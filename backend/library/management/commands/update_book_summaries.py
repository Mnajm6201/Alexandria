from django.core.management.base import BaseCommand
from django.db.models import Q
from library.models import Book
import requests
import time
import re
import html

class Command(BaseCommand):
    help = 'Updates book summaries with content from Google Books API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help='Number of books to process per batch'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes'
        )
        parser.add_argument(
            '--force-all',
            action='store_true',
            help='Force update all books, even those with existing summaries'
        )
        parser.add_argument(
            '--min-length',
            type=int,
            default=100,
            help='Minimum length of summary to update (default: 100 characters)'
        )
        parser.add_argument(
            '--api-key',
            type=str,
            help='Google Books API key (optional)'
        )

    def get_google_books_summary(self, title, author=None, api_key=None):
        """
        Attempts to find a book summary from Google Books API.
        
        Args:
            title: Book title
            author: Optional author name to narrow search
            api_key: Optional Google Books API key
            
        Returns:
            Tuple of (description, source) or (None, None) if not found
        """
        try:
            # Build search query
            query = f'intitle:"{title}"'
            if author:
                query += f' inauthor:"{author}"'
                
            # Build request URL
            url = "https://www.googleapis.com/books/v1/volumes"
            params = {"q": query}
            if api_key:
                params["key"] = api_key
                
            # Make request
            response = requests.get(url, params=params, timeout=10)
            if response.status_code != 200:
                return None, None
                
            data = response.json()
            
            # Check if we have results
            if not data.get("items"):
                return None, None
                
            # Find the best result (highest page count or most detailed description)
            best_description = None
            best_source = None
            best_score = 0
            
            for item in data["items"][:5]:  # Check top 5 results
                volume_info = item.get("volumeInfo", {})
                description = volume_info.get("description", "")
                
                # Skip empty descriptions
                if not description:
                    continue
                    
                # Calculate score based on description length and pageCount
                score = len(description) * 0.5
                
                # Bonus for page count (more detailed books often have better descriptions)
                if "pageCount" in volume_info:
                    score += min(volume_info["pageCount"], 1000) * 0.1
                    
                # Bonus for exact title match
                if volume_info.get("title", "").lower() == title.lower():
                    score += 300
                    
                # Bonus for author match if provided
                if author and any(a.lower() in author.lower() for a in volume_info.get("authors", [])):
                    score += 200
                    
                if score > best_score:
                    best_score = score
                    best_description = description
                    best_source = "Google Books"
            
            # Clean up the description
            if best_description:
                # Decode HTML entities
                best_description = html.unescape(best_description)
                
                # Remove HTML tags
                best_description = re.sub(r'<[^>]+>', '', best_description)
                
                # Remove excess whitespace
                best_description = re.sub(r'\s+', ' ', best_description).strip()
                
            return best_description, best_source
            
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Error fetching summary for {title}: {e}"))
            return None, None

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        dry_run = options['dry_run']
        force_all = options['force_all']
        min_length = options['min_length']
        api_key = options.get('api_key')
        
        if dry_run:
            self.stdout.write(self.style.WARNING("Running in DRY RUN mode - no changes will be made"))
        
        # Get books needing summary updates
        if force_all:
            books = Book.objects.all()
            self.stdout.write(f"Processing ALL {books.count()} books")
        else:
            # Get books with no or short summaries
            books = Book.objects.filter(
                Q(summary__isnull=True) | 
                Q(summary__exact='') |
                Q(summary__isnull=False, summary__lt=min_length)
            )
            self.stdout.write(f"Found {books.count()} books needing summary updates")
        
        updated_count = 0
        failed_count = 0
        
        # Process in batches to avoid overloading API
        for i in range(0, books.count(), batch_size):
            batch = books[i:i+batch_size]
            self.stdout.write(f"Processing batch {i//batch_size + 1}")
            
            for book in batch:
                self.stdout.write(f"Processing book: {book.title}")
                
                # Get author name if available
                author_name = None
                authors = book.authors.all()
                if authors.exists():
                    author_name = authors.first().name
                    
                # Get Google Books summary
                new_summary, source = self.get_google_books_summary(
                    book.title, 
                    author_name, 
                    api_key
                )
                
                if new_summary and len(new_summary) > min_length:
                    # Preview the summary (truncated for display)
                    preview = new_summary[:100] + "..." if len(new_summary) > 100 else new_summary
                    
                    if dry_run:
                        self.stdout.write(self.style.SUCCESS(
                            f"[DRY RUN] Would update summary for '{book.title}' from {source} ({len(new_summary)} chars): {preview}"
                        ))
                    else:
                        book.summary = new_summary
                        book.save()
                        self.stdout.write(self.style.SUCCESS(
                            f"Updated summary for '{book.title}' from {source} ({len(new_summary)} chars): {preview}"
                        ))
                    updated_count += 1
                else:
                    self.stdout.write(self.style.WARNING(
                        f"Could not find suitable summary for '{book.title}'"
                    ))
                    failed_count += 1
                
                # Small pause to avoid overwhelming the API
                time.sleep(0.5)
            
            # Larger pause between batches
            if i + batch_size < books.count():
                self.stdout.write("Pausing between batches...")
                time.sleep(2)
        
        # Output summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write("UPDATE SUMMARY")
        self.stdout.write("="*50)
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"[DRY RUN] Would have updated {updated_count} book summaries"))
            self.stdout.write(self.style.WARNING(f"[DRY RUN] Would have failed to find summaries for {failed_count} books"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Successfully updated {updated_count} book summaries"))
            self.stdout.write(self.style.WARNING(f"Failed to find summaries for {failed_count} books"))
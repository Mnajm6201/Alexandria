from django.core.management.base import BaseCommand
from django.db.models import Q, Value, CharField, F
from django.db.models.functions import Length, Concat
from library.models import Author
import requests
import time
import re

class Command(BaseCommand):
    help = 'Updates author biographies with content from Wikipedia'

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=10,
            help='Number of authors to process per batch'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes'
        )
        parser.add_argument(
            '--force-all',
            action='store_true',
            help='Force update all authors, even those with existing biographies'
        )
        parser.add_argument(
            '--min-length',
            type=int,
            default=100,
            help='Minimum length of biography to update (default: 100 characters)'
        )

    def get_wikipedia_bio_for_author(self, author_name):
        """
        Attempts to find a biography for an author using the Wikipedia API.
        """
        if not author_name or author_name == "Unknown Author":
            return None
            
        try:
            # Search for the author page
            search_url = "https://en.wikipedia.org/w/api.php"
            search_params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": f"{author_name} writer author",
                "srlimit": 1
            }
            
            response = requests.get(search_url, params=search_params, timeout=10)
            if response.status_code != 200:
                return None
                
            search_data = response.json()
            
            # Check if we found any results
            if not search_data.get("query", {}).get("search"):
                self.stdout.write(self.style.WARNING(f"No Wikipedia page found for author: {author_name}"))
                return None
            
            # Get the page ID of the first result
            page_id = str(search_data["query"]["search"][0]["pageid"])
            
            # Get the page extract
            extract_params = {
                "action": "query",
                "format": "json",
                "prop": "extracts",
                "exintro": 1,  # Only get the intro section
                "explaintext": 1,  # Return plain text, not HTML
                "pageids": page_id
            }
            
            extract_response = requests.get(search_url, params=extract_params, timeout=10)
            if extract_response.status_code != 200:
                return None
                
            extract_data = extract_response.json()
            
            # Get the page extract
            extract = extract_data.get("query", {}).get("pages", {}).get(page_id, {}).get("extract", "")
            
            # Clean up the extract
            extract = re.sub(r'\[\d+\]', '', extract)
            
            return extract if extract else None
            
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Error fetching biography for {author_name}: {e}"))
            return None

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        dry_run = options['dry_run']
        force_all = options['force_all']
        min_length = options['min_length']
        
        if dry_run:
            self.stdout.write(self.style.WARNING("Running in DRY RUN mode - no changes will be made"))
        
        # Get all authors
        if force_all:
            authors = Author.objects.all()
            self.stdout.write(f"Processing ALL {authors.count()} authors")
        else:
            # Get authors with no or short biographies
            authors = Author.objects.filter(
                Q(biography__isnull=True) | 
                Q(biography__exact='')
            )
            self.stdout.write(f"Found {authors.count()} authors with empty biographies")
            
            # Then add authors with short biographies
            authors_with_short_bios = Author.objects.annotate(
                bio_length=Length('biography')
            ).filter(
                bio_length__lt=min_length,
                biography__isnull=False  # Ensure biography is not null
            ).exclude(
                biography__exact=''  # Exclude empty biographies already counted above
            )
            
            self.stdout.write(f"Found {authors_with_short_bios.count()} authors with short biographies")
            
            # Combine the querysets
            authors = authors | authors_with_short_bios
            self.stdout.write(f"Total of {authors.count()} authors needing biography updates")
        
        updated_count = 0
        failed_count = 0
        
        # Process in batches to avoid overloading
        for i in range(0, authors.count(), batch_size):
            batch = authors[i:i+batch_size]
            self.stdout.write(f"Processing batch {i//batch_size + 1}")
            
            for author in batch:
                self.stdout.write(f"Processing author: {author.name}")
                
                # Get Wikipedia biography
                new_bio = self.get_wikipedia_bio_for_author(author.name)
                
                if new_bio and len(new_bio) > min_length:
                    # Preview the biography (truncated for display)
                    preview = new_bio[:100] + "..." if len(new_bio) > 100 else new_bio
                    
                    if dry_run:
                        self.stdout.write(self.style.SUCCESS(
                            f"[DRY RUN] Would update biography for {author.name} ({len(new_bio)} chars): {preview}"
                        ))
                    else:
                        author.biography = new_bio
                        author.save()
                        self.stdout.write(self.style.SUCCESS(
                            f"Updated biography for {author.name} ({len(new_bio)} chars): {preview}"
                        ))
                    updated_count += 1
                else:
                    self.stdout.write(self.style.WARNING(
                        f"Could not find suitable Wikipedia biography for {author.name}"
                    ))
                    failed_count += 1
                time.sleep(1)
            if i + batch_size < authors.count():
                self.stdout.write("Pausing between batches...")
                time.sleep(3)
        
        # Output summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write("UPDATE SUMMARY")
        self.stdout.write("="*50)
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(f"[DRY RUN] Would have updated {updated_count} author biographies"))
            self.stdout.write(self.style.WARNING(f"[DRY RUN] Would have failed to find biographies for {failed_count} authors"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Successfully updated {updated_count} author biographies"))
            self.stdout.write(self.style.WARNING(f"Failed to find biographies for {failed_count} authors"))
import time
import langdetect
from django.core.management.base import BaseCommand
from django.db import transaction
from library.models import Book, Author, Edition

class Command(BaseCommand):
    help = "Normalize book and author names to prefer English titles"

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of items to process in each batch'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=0,
            help='Limit the number of items to process (0 for all)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )
        parser.add_argument(
            '--books-only',
            action='store_true',
            help='Only process books, not authors'
        )
        parser.add_argument(
            '--authors-only',
            action='store_true',
            help='Only process authors, not books'
        )

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        limit = options['limit']
        dry_run = options['dry_run']
        books_only = options['books_only']
        authors_only = options['authors_only']
        
        if dry_run:
            self.stdout.write(self.style.WARNING("Running in DRY RUN mode - no changes will be made"))
        
        # Process books if not authors_only
        if not authors_only:
            self._process_books(batch_size, limit, dry_run)
            
        # Process authors if not books_only
        if not books_only:
            self._process_authors(batch_size, limit, dry_run)
    
    def _is_likely_english(self, text):
        """
        Determine if a text string is likely English.
        """
        if not text:
            return False
            
        try:
            # Check if text contains mostly ASCII characters
            ascii_ratio = sum(1 for c in text if ord(c) < 128) / len(text)
            if ascii_ratio < 0.7:  # Text contains many non-ASCII characters
                return False
                
            # Try to detect language with langdetect
            detected_lang = langdetect.detect(text)
            return detected_lang == 'en'
        except (langdetect.LangDetectException, ZeroDivisionError):
            # Default to False if detection fails
            return False
    
    def _process_books(self, batch_size, limit, dry_run):
        """
        Process books to normalize titles.
        """
        # Get the total number of books
        total_books = Book.objects.count()
        if limit > 0 and limit < total_books:
            total_books = limit
            
        self.stdout.write(self.style.SUCCESS(f"Processing {total_books} books in batches of {batch_size}"))
        
        # Process books in batches to avoid memory issues
        offset = 0
        books_processed = 0
        titles_changed = 0
        
        while True:
            # Get a batch of books
            if limit > 0:
                book_batch = Book.objects.all()[offset:min(offset + batch_size, limit)]
            else:
                book_batch = Book.objects.all()[offset:offset + batch_size]
            
            if not book_batch:
                break
                
            for book in book_batch:
                # Check if current title is not English
                current_title = book.title
                is_english = self._is_likely_english(current_title)
                
                if is_english:
                    self.stdout.write(f"Book '{current_title}' already has English title, skipping.")
                else:
                    # Try to find English title from editions
                    english_title = self._find_english_title_for_book(book)
                    
                    if english_title and english_title != current_title:
                        if dry_run:
                            self.stdout.write(f"Would change book title from '{current_title}' to '{english_title}'")
                        else:
                            book.title = english_title[:255]  # Ensure it fits in the field
                            book.save()
                            self.stdout.write(self.style.SUCCESS(
                                f"Changed book title from '{current_title}' to '{english_title}'"
                            ))
                        titles_changed += 1
                    else:
                        self.stdout.write(f"No suitable English title found for '{current_title}', keeping original.")
                
                books_processed += 1
                if books_processed % 10 == 0:
                    self.stdout.write(f"Processed {books_processed}/{total_books} books")
            
            # Move to the next batch
            offset += batch_size
            
            # Break if we've reached the limit
            if limit > 0 and books_processed >= limit:
                break
            
            # Small pause to reduce database load
            time.sleep(0.1)
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"DRY RUN completed for {books_processed} books, would change {titles_changed} titles"
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Processed {books_processed} books, changed {titles_changed} titles"
            ))
    
    def _find_english_title_for_book(self, book):
        """Find an English title for a book from its editions."""
        editions = Edition.objects.filter(book=book)
        
        # Look for English editions
        english_editions = []
        for edition in editions:
            if edition.language == 'eng' and edition.book.title:
                english_editions.append(edition.book.title)
        
        # If we found English editions, use the most common title
        if english_editions:
            # Count occurrences of each title
            title_counts = {}
            for title in english_editions:
                title_counts[title] = title_counts.get(title, 0) + 1
                
            # Return the most common English title
            return max(title_counts.items(), key=lambda x: x[1])[0]
            
        return None
    
    def _process_authors(self, batch_size, limit, dry_run):
        """
        Process authors to normalize names.
        """
        # Get the total number of authors
        total_authors = Author.objects.count()
        if limit > 0 and limit < total_authors:
            total_authors = limit
            
        self.stdout.write(self.style.SUCCESS(f"Processing {total_authors} authors in batches of {batch_size}"))
        
        # Process authors in batches to avoid memory issues
        offset = 0
        authors_processed = 0
        names_changed = 0
        
        while True:
            # Get a batch of authors
            if limit > 0:
                author_batch = Author.objects.all()[offset:min(offset + batch_size, limit)]
            else:
                author_batch = Author.objects.all()[offset:offset + batch_size]
            
            if not author_batch:
                break
                
            for author in author_batch:
                # Check if current name is not English
                current_name = author.name
                is_english = self._is_likely_english(current_name)
                
                if is_english:
                    self.stdout.write(f"Author '{current_name}' already has English name, skipping.")
                else:
                    # Maybe look at other APIs here. Look intio later.
                    
                    self.stdout.write(f"No English name data available for '{current_name}', keeping original.")
                
                authors_processed += 1
                if authors_processed % 10 == 0:
                    self.stdout.write(f"Processed {authors_processed}/{total_authors} authors")
            
            # Move to the next batch
            offset += batch_size
            
            # Break if we've reached the limit
            if limit > 0 and authors_processed >= limit:
                break
            
            # Small pause to reduce database load
            time.sleep(0.1)
        
        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f"DRY RUN completed for {authors_processed} authors, would change {names_changed} names"
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Processed {authors_processed} authors, changed {names_changed} names"
            ))
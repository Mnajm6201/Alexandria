import requests
import hashlib
import json
import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from library.models import Book, Author, Genre, Edition, Publisher, CoverImage


class Command(BaseCommand):
    help = "Populate the database with books from the Internet Archive"

    def add_arguments(self, parser):
        """
        Define command line arguments for the script
        """
        parser.add_argument(
            '--batch-size',
            type=int,  # Changed from string 'int' to actual int type
            default=10,
            help='Number of books to fetch per API call'
        )
        parser.add_argument(
            '--max-books',
            type=int,  # Changed from string 'int' to actual int type
            default=10,
            help='Maximum number of books to import'
        )
        parser.add_argument(
            '--test-mode',
            action='store_true',
            help='Run in test mode and delete all imported data when finished'
        )

    def handle(self, *args, **kwargs):
        """
        Main entry point for the command.
        Fetches books from Internet Archive and adds them to the database.
        """
        batch_size = kwargs.get("batch_size", 10)
        max_books = kwargs.get('max_books', 10)
        test_mode = kwargs.get('test_mode', False)
        
        if test_mode:
            self.stdout.write(self.style.WARNING("Running in TEST MODE - all imported data will be deleted when finished"))
        
        # Track imported books for potential deletion in test mode
        self.imported_book_ids = []

        self.stdout.write(self.style.SUCCESS(f"Fetching up to {max_books} books from Internet Archive in batches of {batch_size}..."))

        books_imported = 0
        page = 1

        while books_imported < max_books:
            # Check if we need to fetch a partial batch for the last page
            remaining_books = max_books - books_imported
            current_batch_size = min(batch_size, remaining_books)
            
            # Construct API URL with pagination parameters
            url = f"https://archive.org/advancedsearch.php?q=subject:fiction&output=json&rows={current_batch_size}&page={page}"

            try:
                # Fetch and process the current page
                imported_count = self._process_page(url, page)
                
                if imported_count == 0:
                    # No more books found
                    break
                
                books_imported += imported_count
                page += 1
                
                self.stdout.write(self.style.SUCCESS(
                    f"Progress: {books_imported}/{max_books} books imported"
                ))
                
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error processing page {page}: {str(e)}"))
                break
        
        self.stdout.write(self.style.SUCCESS(
            f"Database population complete! Imported {books_imported} books."
        ))
        
        # If in test mode, delete all imported books
        if kwargs.get('test_mode') and hasattr(self, 'imported_book_ids') and self.imported_book_ids:
            self.stdout.write(self.style.WARNING(
                f"Test mode cleanup: Deleting {len(self.imported_book_ids)} imported books..."
            ))
            
            # Delete the books we just imported
            try:
                with transaction.atomic():
                    # This will cascade delete related records due to our model relationships
                    deleted_count = Book.objects.filter(id__in=self.imported_book_ids).delete()[0]
                    self.stdout.write(self.style.SUCCESS(
                        f"Successfully deleted {deleted_count} books and related records"
                    ))
            except Exception as e:
                self.stderr.write(self.style.ERROR(
                    f"Error during test mode cleanup: {str(e)}"
                ))

    def _process_page(self, url, page_number):
        """
        Process a single page of book results from the API.
        
        Args:
            url (str): The API URL to fetch
            page_number (int): The current page number for logging
            
        Returns:
            int: Number of books successfully imported from this page
        """
        self.stdout.write(f"Fetching page {page_number}...")
        
        try:
            # Make API request with timeout to prevent hanging
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            # Parse JSON response
            try:
                data = response.json()
            except json.JSONDecodeError as e:
                self.stderr.write(self.style.ERROR(f"Error decoding JSON: {e}"))
                return 0
            
            # Get the documents list from the response
            docs = data.get("response", {}).get("docs", [])
            
            if not docs:
                self.stdout.write(self.style.SUCCESS("No more books found. Finishing."))
                return 0
            
            # Process each book in the current page
            books_imported = 0
            for item in docs:
                try:
                    with transaction.atomic():
                        # Process book in transaction to ensure data integrity
                        book = self._process_book(item)
                        
                        # Track the book ID if we're in test mode
                        if hasattr(self, 'imported_book_ids') and book and book.id:
                            self.imported_book_ids.append(book.id)
                            
                        books_imported += 1
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"Error processing book: {e}"))
                    # Continue with next book instead of breaking the entire import
            
            return books_imported
            
        except requests.exceptions.RequestException as e:
            self.stderr.write(self.style.ERROR(f"Error fetching books: {e}"))
            raise
    
    def _process_book(self, item):
        """
        Process a single book entry from the API response.
        
        Args:
            item (dict): Book data from API response
            
        Returns:
            Book: The created or retrieved Book object
        """
        # Extract basic book information with fallbacks for missing data
        title = item.get("title", "Unknown Title")
        summary = item.get("description", "")
        
        # Handle authors data safely
        authors_raw = item.get("creator", ["Unknown Author"])
        # Ensure authors is always a list
        if not isinstance(authors_raw, list):
            authors = [authors_raw]
        else:
            authors = authors_raw if authors_raw else ["Unknown Author"]
        
        # Extract and validate year
        year = item.get("year")
        if year and isinstance(year, str):
            try:
                year = int(year)
            except ValueError:
                year = None
        
        # Extract language safely
        language_list = item.get("language", [])
        if not isinstance(language_list, list):
            language_list = [language_list]
        language_value = language_list[0] if language_list else "Unknown"
        
        # Extract publisher information
        publisher_list = item.get("publisher", ["Unknown Publisher"])
        if not isinstance(publisher_list, list):
            publisher_list = [publisher_list]
        publisher_name = publisher_list[0] if publisher_list else "Unknown Publisher"
        
        # Extract ISBN safely
        isbn_list = item.get("isbn", [""])
        if not isinstance(isbn_list, list):
            isbn_list = [isbn_list]
        isbn = isbn_list[0] if isbn_list else ""
        
        # Get cover image URL if available
        cover_id = item.get("cover_i")
        cover_url = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else None

        # Generate unique hash for book based on title and authors
        author_string = ", ".join(authors)
        unique_hash = hashlib.sha256(f"{title}{author_string}".encode()).hexdigest()

        # Create or get the book record
        book, created = Book.objects.get_or_create(
            unique_hash=unique_hash,
            defaults={
                "title": title,
                "summary": summary,
                "year_published": year,
                "original_language": language_value,
            })

        # Add status message based on whether book was created or found
        if created:
            self.stdout.write(f"Created new book: {title}")
        else:
            self.stdout.write(f"Found existing book: {title}")

        # Process each author and create M2M relationships
        for author_name in authors:
            if not author_name:
                continue
                
            author_hash = hashlib.sha256(author_name.encode()).hexdigest()
            author, _ = Author.objects.get_or_create(
                unique_hash=author_hash,
                defaults={"name": author_name}
            )
            book.authors.add(author)

        # Add genre (currently defaulting to Fiction)
        genre_name = "Fiction"
        genre, _ = Genre.objects.get_or_create(name=genre_name)
        book.genres.add(genre)

        # Add Publisher
        publisher, _ = Publisher.objects.get_or_create(name=publisher_name)

        # Add Edition if ISBN is available
        if isbn:
            # Ensure we have a valid publication year (use current year as fallback)
            publication_year = year if year else datetime.date.today().year
            
            # Create or get the edition
            edition, created = Edition.objects.get_or_create(
                isbn=isbn,
                defaults={
                    "book": book,
                    "publisher": publisher,
                    "kind": "Hardcover",  # Default format
                    "publication_year": publication_year,
                    "language": language_value,
                }
            )

            # Add cover image if available
            if cover_url:
                CoverImage.objects.get_or_create(
                    edition=edition,
                    image_url=cover_url,
                    is_primary=True
                )

        return book
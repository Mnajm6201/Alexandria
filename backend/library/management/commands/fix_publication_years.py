from django.core.management.base import BaseCommand
from django.db.models import Min
from library.models import Book, Edition
import datetime

class Command(BaseCommand):
    help = "Updates book publication years to match the oldest edition's year"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )
        parser.add_argument(
            '--book-id',
            type=str,
            help='Process a specific book by ID',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=0,
            help='Limit the number of books to process (0 for all)',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update all books even if they already have a publication year',
        )

    def handle(self, *args, **options):
        dry_run = options.get('dry_run', False)
        book_id = options.get('book_id')
        limit = options.get('limit', 0)
        force = options.get('force', False)
        
        if dry_run:
            self.stdout.write(self.style.WARNING("Running in DRY RUN mode - no changes will be made"))
        
        # Get books to process
        if book_id:
            books = Book.objects.filter(book_id=book_id)
            if not books.exists():
                self.stdout.write(self.style.ERROR(f'No book found with ID: {book_id}'))
                return
        else:
            books = Book.objects.all()
            
            # Apply limit if specified
            if limit > 0:
                books = books[:limit]
        
        total_books = books.count()
        self.stdout.write(f"Processing {total_books} books...")
        
        books_updated = 0
        books_skipped = 0
        
        for book in books:
            # Get all editions for this book
            editions = Edition.objects.filter(book=book)
            
            if not editions.exists():
                self.stdout.write(f"Skipping book '{book.title}' (ID: {book.book_id}): No editions found")
                books_skipped += 1
                continue
                
            # Get the oldest publication year from editions
            oldest_year = None
            
            # Query for the minimum publication year
            oldest_edition = editions.order_by('publication_year').first()
            if oldest_edition and oldest_edition.publication_year:
                oldest_year = oldest_edition.publication_year
            
            # Skip if we couldn't determine a year
            if not oldest_year:
                self.stdout.write(f"Skipping book '{book.title}' (ID: {book.book_id}): No valid publication years in editions")
                books_skipped += 1
                continue
                
            # Skip if the book already has the correct year and we're not forcing updates
            if book.year_published == oldest_year and not force:
                self.stdout.write(f"Skipping book '{book.title}' (ID: {book.book_id}): Already has correct year ({oldest_year})")
                books_skipped += 1
                continue
                
            # Skip if the book has a year and it's older than the oldest edition (unless forcing)
            if book.year_published and book.year_published < oldest_year and not force:
                self.stdout.write(
                    f"Skipping book '{book.title}' (ID: {book.book_id}): "
                    f"Existing year ({book.year_published}) is older than oldest edition ({oldest_year})"
                )
                books_skipped += 1
                continue
            
            # Update the book's year_published
            old_year = book.year_published
            if not dry_run:
                book.year_published = oldest_year
                book.save()
                
            books_updated += 1
            self.stdout.write(
                f"{'Would update' if dry_run else 'Updated'} book '{book.title}' "
                f"(ID: {book.book_id}): {old_year} -> {oldest_year}"
            )
        
        # Print summary
        self.stdout.write(self.style.SUCCESS(
            f"{'Would update' if dry_run else 'Updated'} {books_updated} books, "
            f"skipped {books_skipped} books"
        ))
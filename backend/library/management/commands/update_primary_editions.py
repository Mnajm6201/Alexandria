from django.core.management.base import BaseCommand
from django.db.models import Q
from library.models import Book, Edition, CoverImage

class Command(BaseCommand):
    help = 'Updates primary editions and cover images for books'

    def add_arguments(self, parser):
        parser.add_argument(
            '--book-id',
            type=str,
            help='Process a specific book by ID',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset all primary flags before processing',
        )

    def handle(self, *args, **options):
        book_id = options.get('book_id')
        reset = options.get('reset')
        
        if book_id:
            books = Book.objects.filter(book_id=book_id)
            if not books.exists():
                self.stdout.write(self.style.ERROR(f'No book found with ID: {book_id}'))
                return
        else:
            books = Book.objects.all()
        
        self.stdout.write(f"Processing {books.count()} books...")
        
        if reset:
            # Reset all primary flags
            edition_count = Edition.objects.filter(book__in=books, is_primary=True).update(is_primary=False)
            cover_count = CoverImage.objects.filter(edition__book__in=books, is_primary=True).update(is_primary=False)
            self.stdout.write(f"Reset {edition_count} primary editions and {cover_count} primary covers")
        
        processed_count = 0
        updated_count = 0
        
        for book in books:
            processed_count += 1
            
            # Get all editions
            editions = Edition.objects.filter(book=book)
            
            if not editions.exists():
                continue
                
            # Check if already has a primary edition
            has_primary = editions.filter(is_primary=True).exists()
            
            if has_primary and not reset:
                # Skip books that already have a primary edition
                continue
            
            # Find the best edition
            # First, look for English editions
            english_editions = editions.filter(
                Q(language__iexact='eng') | 
                Q(language__iexact='en') | 
                Q(language__iexact='english')
            )
            
            candidate_editions = english_editions if english_editions.exists() else editions
            
            # Find editions with covers
            editions_with_covers = candidate_editions.filter(
                related_edition_image__isnull=False
            ).distinct()
            
            if editions_with_covers.exists():
                # Find most recent edition with covers (but not future)
                import datetime
                current_year = datetime.datetime.now().year
                
                best_edition = None
                for edition in editions_with_covers.order_by('-publication_year'):
                    if edition.publication_year and edition.publication_year <= current_year:
                        best_edition = edition
                        break
                
                if not best_edition:
                    best_edition = editions_with_covers.first()
            else:
                # No editions with covers, use most recent edition
                best_edition = candidate_editions.order_by('-publication_year').first()
            
            if not best_edition:
                best_edition = editions.first()
            
            # Set as primary
            best_edition.is_primary = True
            best_edition.save()
            
            # Set a primary cover
            covers = CoverImage.objects.filter(edition=best_edition)
            if covers.exists():
                # Clear existing primary covers for this book
                CoverImage.objects.filter(
                    edition__book=book, 
                    is_primary=True
                ).update(is_primary=False)
                
                # Set first cover as primary
                best_cover = covers.first()
                best_cover.is_primary = True
                best_cover.save()
            
            updated_count += 1
            
            if processed_count % 100 == 0:
                self.stdout.write(f"Processed {processed_count} books, updated {updated_count}")
        
        self.stdout.write(self.style.SUCCESS(f'Processed {processed_count} books, updated {updated_count}'))
# backend/library/management/commands/normalize_genres.py

import time
from django.core.management.base import BaseCommand
from django.db import transaction
from library.models import Book, Genre, BookGenre
from library.utils.genre_utils import extract_genres_from_subjects, get_primary_genre

class Command(BaseCommand):
    help = "Normalize genres for existing books based on whitelist"

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of books to process in each batch'
        )
        parser.add_argument(
            '--remove-old',
            action='store_true',
            help='Remove old genres that are not in the whitelist'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=0,
            help='Limit the number of books to process (0 for all)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        remove_old = options['remove_old']
        limit = options['limit']
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING("Running in DRY RUN mode - no changes will be made"))
        
        # Get the total number of books
        total_books = Book.objects.count()
        if limit > 0 and limit < total_books:
            total_books = limit
            
        self.stdout.write(self.style.SUCCESS(f"Processing {total_books} books in batches of {batch_size}"))
        
        # Process books in batches to avoid memory issues
        offset = 0
        books_processed = 0
        genres_added = 0
        genres_removed = 0
        
        while True:
            # Get a batch of books
            if limit > 0:
                book_batch = Book.objects.all()[offset:min(offset + batch_size, limit)]
            else:
                book_batch = Book.objects.all()[offset:offset + batch_size]
            
            if not book_batch:
                break
                
            for book in book_batch:
                # Process each book
                if dry_run:
                    self._process_book_dry_run(book, remove_old)
                else:
                    added, removed = self._process_book(book, remove_old)
                    genres_added += added
                    genres_removed += removed
                
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
            self.stdout.write(self.style.SUCCESS(f"DRY RUN completed for {books_processed} books"))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"Processed {books_processed} books, added {genres_added} genres, removed {genres_removed} genres"
            ))
    
    def _process_book_dry_run(self, book, remove_old):
        """Process a book in dry run mode - just print what would be done"""
        # Get all existing genres for the book
        existing_genres = [bg.genre.name.lower() for bg in BookGenre.objects.filter(book=book)]
        subjects = existing_genres
        
        # Extract normalized genres
        normalized_genres = extract_genres_from_subjects(subjects)
        
        # What would be added
        to_add = normalized_genres - set(existing_genres)
        if to_add:
            self.stdout.write(f"Would add genres to {book.title}: {', '.join(to_add)}")
        
        # What would be removed
        if remove_old:
            to_remove = set(existing_genres) - normalized_genres
            if to_remove:
                self.stdout.write(f"Would remove genres from {book.title}: {', '.join(to_remove)}")
    
    def _process_book(self, book, remove_old):
        """Process a book and update its genres"""
        genres_added = 0
        genres_removed = 0
        
        # Get all existing genres for the book
        existing_genres = set()
        book_genre_objects = {}
        
        for bg in BookGenre.objects.filter(book=book):
            existing_genres.add(bg.genre.name.lower())
            book_genre_objects[bg.genre.name.lower()] = bg
        
        # Get subject data
        subjects = list(existing_genres)
        
        # Extract normalized genres
        normalized_genres = extract_genres_from_subjects(subjects)
        
        # If no normalized genres were found, use a default
        if not normalized_genres and not existing_genres:
            normalized_genres = {"fiction"}
        
        # Remove old genres if requested
        if remove_old:
            genres_to_remove = existing_genres - normalized_genres
            for genre_name in genres_to_remove:
                if genre_name in book_genre_objects:
                    book_genre_objects[genre_name].delete()
                    genres_removed += 1
                    print(f"Removed genre {genre_name} from book {book.title}")
        
        # Add new genres
        with transaction.atomic():
            for genre_name in normalized_genres:
                if genre_name not in existing_genres:
                    genre, _ = Genre.objects.get_or_create(name=genre_name)
                    BookGenre.objects.create(book=book, genre=genre)
                    genres_added += 1
                    print(f"Added genre {genre_name} to book {book.title}")
        
        return genres_added, genres_removed
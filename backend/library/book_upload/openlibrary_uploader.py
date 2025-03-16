#!/usr/bin/env python
import os
import sys
import json
import hashlib
import django
from typing import Dict, Any, Optional
from decimal import Decimal

# Setup Django 
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import models
from django.db import transaction
from library.models import (
    Book, Author, BookAuthor, Genre, BookGenre, 
    Edition, Publisher, CoverImage
)

# Define valid genres to filter the subjects
# This is not working for some reason, but i'll leave list here for now.
VALID_GENRES = {
    'fantasy', 'fantasy fiction', 'epic fantasy', 'fiction', 
    'adventure fiction', 'high fantasy', 'english fantasy fiction',
    'fantasy fiction, english', 'fiction in english', 'literature',
    'english literature', 'fiction, fantasy, epic', 'fiction, fantasy, general',
    'fiction in english', 'science fiction', 'mystery', 'thriller',
    'historical fiction', 'romance', 'horror', 'adventure', 'detective',
    'young adult', 'ya', 'children\'s fiction', 'dystopian', 'supernatural',
    'paranormal', 'steampunk', 'urban fantasy', 'contemporary fiction',
    'literary fiction', 'magical realism', 'speculative fiction',
    'suspense', 'historical fantasy', 'dark fantasy', 'coming of age',
    'classics', 'crime fiction', 'mystery fiction', 'teen fiction',
    'action', 'adventure stories', 'love stories', 'war stories',
    'spy stories', 'drama', 'bildungsroman', 'space opera',
    'alternate history', 'time travel', 'cyberpunk'
}

class LibraryUpload:
    """Uploads book data from local JSON files into database.."""
    
    def __init__(self, work_file: str, editions_file: str, authors_file: str):
        """
        Initialize class.
        
        Args:
            work_file: Path to the JSON file containing work data
            editions_file: Path to the JSON file containing editions data
            authors_file: Path to the JSON file containing authors data
        """
        self.work_data = self._load_json(work_file)
        self.editions_data = self._load_json(editions_file)
        self.authors_data = self._load_json(authors_file)
    
    def _load_json(self, file_path: str) -> Any:
        """Load JSON data from a file."""
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def _create_hash(self, text: str) -> str:
        """Create a hash from a text string."""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    def _extract_year(self, date_str: Optional[str]) -> Optional[int]:
        """Extract year from a date string."""
        if not date_str:
            return None
        # Try to extract a 4-digit year from the date string
        for word in date_str.split():
            if word.isdigit() and len(word) == 4 and 1000 <= int(word) <= 2100:
                return int(word)
        return None
    
    def _get_or_create_publisher(self, name: str) -> Publisher:
        """Get or create a Publisher object."""
        if not name:
            return None
        
        publisher, created = Publisher.objects.get_or_create(
            name=name[:100] 
        )
        
        if created:
            print(f"Created new publisher: {name}")
        
        return publisher
    
    def _get_or_create_genre(self, name: str) -> Genre:
        """Get or create a Genre object."""
        if not name:
            return None
        
        genre, created = Genre.objects.get_or_create(
            name=name[:100]  
        )
        
        if created:
            print(f"Created new genre: {name}")
        
        return genre
    
    def _is_valid_genre(self, subject: str) -> bool:
        """Check if a subject from Open Library is a valid genre for our system."""
        subject_lower = subject.lower()
        
        # Check if it's in our valid genres list
        for genre in VALID_GENRES:
            if genre in subject_lower:
                return True
        
        return False
    
    @transaction.atomic
    def upload_authors(self) -> Dict[str, Author]:
        """
        Upload authors to the database.
        
        Returns:
            Dictionary mapping Open Library author keys to Author objects
        """
        author_map = {}
        
        for author_data in self.authors_data:
            name = author_data.get('name', 'Unknown Author')
            key = author_data.get('key', '').replace('/authors/', '')
            bio = author_data.get('bio', '')
            
            # Handle different forms of biography field
            if isinstance(bio, dict):
                bio = bio.get('value', '')
            
            # Create a unique hash for the author
            unique_hash = self._create_hash(key)
            
            # Get or create the author
            author, created = Author.objects.get_or_create(
                unique_hash=unique_hash,
                defaults={
                    'name': name[:250], 
                    'biography': bio,
                    'author_image': f"https://covers.openlibrary.org/a/olid/OL{key}A-M.jpg" if key else None
                }
            )
            
            if created:
                print(f"Created new author: {name}")
            
            author_map[f"/authors/{key}"] = author
        
        return author_map
    
    @transaction.atomic
    def upload_book_and_genres(self, author_map: Dict[str, Author]) -> Book:
        """
        Upload a book and its genres to the database.
        
        Args:
            author_map: Dictionary mapping Open Library author keys to Author objects
            
        Returns:
            The created Book object
        """
        # Extract book details
        title = self.work_data.get('title', 'Unknown Title')
        key = self.work_data.get('key', '').replace('/works/', '')
        unique_hash = key  # Use the work ID as the unique hash
        
        # Get description
        description = self.work_data.get('description', '')
        if isinstance(description, dict):
            description = description.get('value', '')
        
        # Extract publication year - look at multiple fields to ensure we get it
        year_published = None
        
        # Try using the first_publish_year field directly
        if 'first_publish_year' in self.work_data:
            year_published = int(self.work_data['first_publish_year'])
            print(f"Found first_publish_year: {year_published}")
        
        # Try to extract from first_publish_date
        if not year_published and 'first_publish_date' in self.work_data:
            year_str = self._extract_year(self.work_data['first_publish_date'])
            if year_str:
                year_published = year_str
                print(f"Extracted year from first_publish_date: {year_published}")
        
        # Fall back to any publication date we can find
        if not year_published and self.editions_data and len(self.editions_data) > 0:
            # Try to get year from first edition's publication date
            for edition in self.editions_data:
                if 'publish_date' in edition:
                    year_str = self._extract_year(edition['publish_date'])
                    if year_str:
                        year_published = year_str
                        print(f"Using year from first edition: {year_published}")
                        break
        
        # If we still don't have a year, try to get it from the search result
        if not year_published:
            print("WARNING: Could not determine publication year from API data")
            year_published = 1900  # Default fallback value
        
        # Get original language
        languages = self.work_data.get('original_languages', [])
        original_language = languages[0].get('key', '').replace('/languages/', '') if languages else None
        
        # Create or update the book
        book, created = Book.objects.get_or_create(
            unique_hash=unique_hash,
            defaults={
                'title': title[:255],  
                'summary': description,
                'year_published': year_published,
                'original_language': original_language,
                'average_rating': Decimal('0.00') 
            }
        )
        
        # Print debugging info
        print(f"Book year_published set to: {year_published}")
        
        if created:
            print(f"Created new book: {title}")
        
        # Link authors to book
        for author_key, author_obj in author_map.items():
            BookAuthor.objects.get_or_create(
                book=book,
                author=author_obj
            )
            print(f"Linked author {author_obj.name} to book {book.title}")
        
        # Add genres
        subjects = []
        
        # Extract subjects from different fields
        if 'subjects' in self.work_data:
            subjects.extend([s.get('name', s) if isinstance(s, dict) else s 
                           for s in self.work_data['subjects']])
        
        if 'subject_places' in self.work_data:
            subjects.extend(self.work_data['subject_places'])
        
        if 'subject_times' in self.work_data:
            subjects.extend(self.work_data['subject_times'])
        
        for subject_name in set(subjects):
            if not subject_name:
                continue
                
            # Filter to include only valid genres
            if self._is_valid_genre(subject_name):
                genre = self._get_or_create_genre(subject_name)
                if genre:
                    BookGenre.objects.get_or_create(
                        book=book,
                        genre=genre
                    )
                    print(f"Added genre {genre.name} to book {book.title}")
        
        return book
    
    @transaction.atomic
    def upload_editions(self, book: Book) -> None:
        """
        Upload editions for a book to the database.
        
        Args:
            book: The Book object to link editions to
        """
        # Keep track of whether we've set a primary cover yet
        primary_cover_set = False
        
        for edition_data in self.editions_data:

            # Extract edition details
            key = edition_data.get('key', '').replace('/books/', '')
            isbn = edition_data.get('isbn_13', [None])[0] or edition_data.get('isbn_10', [None])[0]
            
            # Skip if no ISBN. We should look at possibly creating our own isbn instead of skipping.
            if not isbn:
                print(f"Skipping edition with no ISBN: {edition_data.get('title', 'Unknown')}")
                continue
            
            # Check if this edition already exists
            if Edition.objects.filter(isbn=isbn).exists():
                print(f"Edition with ISBN {isbn} already exists, skipping")
                continue
            
            # Determine format/kind
            physical_format = edition_data.get('physical_format', '').capitalize()
            if physical_format in ['Hardcover', 'Paperback']:
                kind = physical_format
            elif 'electronic' in physical_format.lower() or 'ebook' in physical_format.lower():
                kind = 'eBook'
            elif 'audio' in physical_format.lower():
                kind = 'Audiobook'
            else:
                kind = 'Other'
            
            # Get publication year
            publish_date = edition_data.get('publish_date')
            publication_year = self._extract_year(publish_date)
            if not publication_year:
                # Use work's publication year as fallback
                publication_year = book.year_published or 2000  # Default to 2000 if all else fails
            
            # Get publisher
            publisher_name = edition_data.get('publishers', ['Unknown Publisher'])[0]
            publisher = self._get_or_create_publisher(publisher_name)
            
            # Get language
            languages = edition_data.get('languages', [])
            language_code = languages[0].get('key', '').replace('/languages/', '') if languages else 'eng'
            
            # Create the edition
            edition = Edition.objects.create(
                book=book,
                isbn=isbn[:13],  # Truncate to fit model field length
                publisher=publisher,
                kind=kind,
                publication_year=publication_year,
                language=language_code[:50],  # Truncate to fit model field length
                page_count=edition_data.get('number_of_pages'),
                edition_number=edition_data.get('edition_number', 1),
                abridged=False  # Default value
            )
            
            print(f"Created edition: {edition}")
            
            # Add cover images
            covers = edition_data.get('covers', [])
            for i, cover_id in enumerate(covers):
                # Only set the first cover of the first edition as primary
                is_primary = (not primary_cover_set) and (i == 0)
                
                CoverImage.objects.create(
                    edition=edition,
                    image_url=f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg",
                    is_primary=is_primary
                )
                
                # If we just set a primary cover, update our flag
                if is_primary:
                    primary_cover_set = True
                    
                print(f"Added cover image for edition {edition}")
    
    def upload_all(self) -> None:
        """Upload all data to the database."""
        # Upload authors
        author_map = self.upload_authors()
        
        # Upload the book and genres
        book = self.upload_book_and_genres(author_map)
        
        # Upload editions
        self.upload_editions(book)
        
        print(f"Successfully uploaded all data for: {book.title}")

def main():
    """Main entry point for the script."""
    if len(sys.argv) != 4:
        print("Usage: python openlibrary_uploader.py work_data.json editions_data.json authors_data.json")
        sys.exit(1)
    
    work_file = sys.argv[1]
    editions_file = sys.argv[2]
    authors_file = sys.argv[3]
    
    uploader = LibraryUpload(work_file, editions_file, authors_file)
    
    try:
        uploader.upload_all()
    except Exception as e:
        print(f"Error during upload: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
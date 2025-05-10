from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from library.models import Book, Author, Edition, Publisher, CoverImage, Genre

class EditionDetailViewTest(TestCase):
    """Test case for the EditionDetailView."""
    
    def setUp(self):
        """Set up test data."""
        # Create test book, author, publisher
        self.author = Author.objects.create(name="Test Author", author_id="auth123")
        self.genre = Genre.objects.create(name="Test Genre")
        self.book = Book.objects.create(
            title="Test Book",
            book_id="book123",
            year_published=2020
        )
        self.book.authors.add(self.author)
        self.book.genres.add(self.genre)
        
        self.publisher = Publisher.objects.create(name="Test Publisher")
        
        # Create test edition
        self.edition = Edition.objects.create(
            book=self.book,
            isbn="9781234567890",
            publisher=self.publisher,
            kind="Hardcover",
            publication_year=2021,
            language="English",
            page_count=300,
            edition_number=1
        )
        
        # Create cover image
        self.cover_image = CoverImage.objects.create(
            edition=self.edition,
            image_url="https://example.com/cover.jpg",
            is_primary=True
        )
        
        # Create another edition for the same book
        self.other_edition = Edition.objects.create(
            book=self.book,
            isbn="9780987654321",
            publisher=self.publisher,
            kind="Paperback",
            publication_year=2022,
            language="English",
            page_count=280,
            edition_number=2
        )
        
        # Setup API client
        self.client = APIClient()
        
        # URL for edition detail
        self.url = reverse('edition-detail', kwargs={'isbn': self.edition.isbn})
    
    def test_get_edition_detail(self):
        """Test retrieving edition details."""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['isbn'], "9781234567890")
        self.assertEqual(response.data['kind'], "Hardcover")
        self.assertEqual(response.data['publication_year'], 2021)
        self.assertEqual(response.data['language'], "English")
        self.assertEqual(response.data['page_count'], 300)
        
        # Check book info
        self.assertEqual(response.data['book_info']['title'], "Test Book")
        self.assertEqual(response.data['book_info']['authors'][0]['name'], "Test Author")
        
        # Check cover image
        self.assertEqual(response.data['cover_image'], "https://example.com/cover.jpg")
        
        # Check other editions
        self.assertEqual(len(response.data['other_editions']), 1)
        self.assertEqual(response.data['other_editions'][0]['isbn'], "9780987654321")
    
    def test_get_nonexistent_edition(self):
        """Test retrieving a non-existent edition."""
        url = reverse('edition-detail', kwargs={'isbn': '9999999999999'})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

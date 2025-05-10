from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from .models import FeaturedShelf
from library.models import Shelf, Book, Edition, Publisher, ShelfEdition, CoverImage

User = get_user_model()

class FeaturedShelfModelTests(TestCase):
    """
    Test module for the FeaturedShelf model. Tests model creation, validation, and behavior.
    
    Equivalence Classes:
    ## Required Fields ##
    - shelf (valid)
    - shelf missing (invalid)
    - display_title (valid)
    - display_title missing (invalid)
    
    ## Optional Fields ##
    - description present (valid)
    - description missing (valid)
    - display_order specified (valid)
    - display_order default (valid)
    - is_active true (valid)
    - is_active false (valid)
    - display_type valid choice (valid)
    - display_type invalid choice (invalid)
    """
    
    def setUp(self):
        """Create required objects for testing FeaturedShelf"""
        self.user = User.objects.create_user(
            username="test_user",
            email="test@example.com",
            password="testpassword"
        )
        
        self.shelf = Shelf.objects.create(
            user=self.user,
            name="Test Shelf",
            shelf_type="Custom",
            is_private=False
        )
    
    def test_create_featured_shelf_with_all_fields(self):
        """Test creating a featured shelf with all fields specified"""
        featured_shelf = FeaturedShelf.objects.create(
            shelf=self.shelf,
            display_title="Featured Test Shelf",
            description="A test description",
            display_order=5,
            is_active=True,
            display_type="CAROUSEL"
        )
        
        self.assertEqual(featured_shelf.shelf, self.shelf)
        self.assertEqual(featured_shelf.display_title, "Featured Test Shelf")
        self.assertEqual(featured_shelf.description, "A test description")
        self.assertEqual(featured_shelf.display_order, 5)
        self.assertTrue(featured_shelf.is_active)
        self.assertEqual(featured_shelf.display_type, "CAROUSEL")
    
    def test_create_featured_shelf_with_required_fields_only(self):
        """Test creating a featured shelf with only required fields"""
        featured_shelf = FeaturedShelf.objects.create(
            shelf=self.shelf,
            display_title="Required Fields Only"
        )
        
        self.assertEqual(featured_shelf.shelf, self.shelf)
        self.assertEqual(featured_shelf.display_title, "Required Fields Only")
        self.assertEqual(featured_shelf.description, "")  # Default empty string
        self.assertEqual(featured_shelf.display_order, 0)  # Default value
        self.assertTrue(featured_shelf.is_active)  # Default is True
        self.assertEqual(featured_shelf.display_type, "CAROUSEL")  # Default value
    
    def test_string_representation(self):
        """Test the string representation of the model"""
        featured_shelf = FeaturedShelf.objects.create(
            shelf=self.shelf,
            display_title="Test Featured Shelf"
        )
        
        self.assertEqual(str(featured_shelf), "Test Featured Shelf")
    
    def test_featured_shelf_ordering(self):
        """Test that featured shelves are ordered by display_order and created_at"""
        # Create multiple featured shelves with different display orders
        shelf2 = Shelf.objects.create(
            user=self.user,
            name="Second Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        shelf3 = Shelf.objects.create(
            user=self.user,
            name="Third Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        featured1 = FeaturedShelf.objects.create(
            shelf=self.shelf,
            display_title="Featured 1",
            display_order=3
        )
        
        featured2 = FeaturedShelf.objects.create(
            shelf=shelf2,
            display_title="Featured 2",
            display_order=1
        )
        
        featured3 = FeaturedShelf.objects.create(
            shelf=shelf3,
            display_title="Featured 3",
            display_order=2
        )
        
        # Retrieve ordered shelves
        ordered_shelves = FeaturedShelf.objects.all()
        
        # Check the order matches display_order
        self.assertEqual(ordered_shelves[0], featured2)  # display_order=1
        self.assertEqual(ordered_shelves[1], featured3)  # display_order=2
        self.assertEqual(ordered_shelves[2], featured1)  # display_order=3


class FeaturedShelfSerializerTests(TestCase):
    """
    Test module for the FeaturedShelfSerializer. Tests serialization, data formatting, and output.
    
    Equivalence Classes:
    ## Shelf Content ##
    - Shelf with books/editions (valid)
    - Empty shelf (valid)
    ## Cover Images ##
    - Books with primary cover images (valid)
    - Books without primary cover images (valid)
    - Books without any cover images (valid)
    """
    
    def setUp(self):
        """Create required objects for testing the FeaturedShelfSerializer"""
        self.client = APIClient()
        
        # Create user, book, publisher, and shelves
        self.user = User.objects.create_user(
            username="serializer_tester",
            email="serializer@example.com",
            password="testpassword"
        )
        
        self.shelf = Shelf.objects.create(
            user=self.user,
            name="Serializer Test Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        self.book = Book.objects.create(
            title="Test Book",
            book_id="test123"
        )
        
        self.publisher = Publisher.objects.create(name="Test Publisher")
        
        self.edition = Edition.objects.create(
            book=self.book,
            isbn="9781234567890",
            publisher=self.publisher,
            kind="Hardcover",
            publication_year=2020,
            language="English"
        )
        
        # Add book edition to shelf
        self.shelf_edition = ShelfEdition.objects.create(
            shelf=self.shelf,
            edition=self.edition
        )
        
        # Create cover image
        self.cover_image = CoverImage.objects.create(
            edition=self.edition,
            image_url="https://example.com/cover.jpg",
            is_primary=True
        )
        
        # Create featured shelf
        self.featured_shelf = FeaturedShelf.objects.create(
            shelf=self.shelf,
            display_title="Featured Books",
            description="A collection of featured books",
            display_type="CAROUSEL"
        )
        
        # Authenticate API client
        self.client.force_authenticate(user=self.user)
    
    def test_featured_shelf_with_books(self):
        """Test serializing a featured shelf with books"""
        response = self.client.get(
            reverse('featuredshelf-detail', kwargs={'pk': self.featured_shelf.pk})
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check shelf data
        self.assertEqual(response.data['display_title'], "Featured Books")
        self.assertEqual(response.data['description'], "A collection of featured books")
        self.assertEqual(response.data['display_type'], "CAROUSEL")
        
        # Check books data
        self.assertEqual(len(response.data['books']), 1)
        book_data = response.data['books'][0]
        self.assertEqual(book_data['title'], "Test Book")
        self.assertEqual(book_data['isbn'], "9781234567890")
        self.assertEqual(book_data['cover_image'], "https://example.com/cover.jpg")
        
        # Check authors array
        self.assertEqual(len(book_data['authors']), 0)  # No authors assigned to test book
    
    def test_empty_featured_shelf(self):
        """Test serializing a featured shelf with no books"""
        # Create empty shelf
        empty_shelf = Shelf.objects.create(
            user=self.user,
            name="Empty Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        # Create featured shelf linked to empty shelf
        empty_featured = FeaturedShelf.objects.create(
            shelf=empty_shelf,
            display_title="Empty Featured Shelf",
            description="This shelf has no books"
        )
        
        response = self.client.get(
            reverse('featuredshelf-detail', kwargs={'pk': empty_featured.pk})
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['display_title'], "Empty Featured Shelf")
        self.assertEqual(len(response.data['books']), 0)
    
    def test_book_without_primary_cover(self):
        """Test handling of books without primary cover images"""
        # Create a new book/edition
        book2 = Book.objects.create(
            title="Book without primary cover",
            book_id="noprimary"
        )
        
        edition2 = Edition.objects.create(
            book=book2,
            isbn="9780987654321",
            publisher=self.publisher,
            kind="Paperback",
            publication_year=2021,
            language="English"
        )
        
        # Create cover image that is NOT primary
        CoverImage.objects.create(
            edition=edition2,
            image_url="https://example.com/non-primary.jpg",
            is_primary=False
        )
        
        # Add to shelf
        ShelfEdition.objects.create(
            shelf=self.shelf,
            edition=edition2
        )
        
        response = self.client.get(
            reverse('featuredshelf-detail', kwargs={'pk': self.featured_shelf.pk})
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # We should have 2 books now
        self.assertEqual(len(response.data['books']), 2)
        
        # Find the second book (without primary cover)
        book_without_primary = None
        for book in response.data['books']:
            if book['isbn'] == "9780987654321":
                book_without_primary = book
                break
        
        self.assertIsNotNone(book_without_primary)
        self.assertEqual(book_without_primary['cover_image'], "https://example.com/non-primary.jpg")
    

class FeaturedShelfViewSetTests(TestCase):
    """
    Test module for the FeaturedShelfViewSet. Tests authentication, listing, and permissions.
    
    Equivalence Classes:
    ## Authentication Status ##
    - Authenticated user (valid)
    - Unauthenticated user (invalid)
    ## Featured Status ##
    - Active featured shelves (valid - should be displayed)
    - Inactive featured shelves (invalid - should not be displayed)
    ## Permissions ##
    - Default permissions (read-only)
    """
    
    def setUp(self):
        """Create test data for FeaturedShelfViewSet testing"""
        self.client = APIClient()
        
        # Create users
        self.user = User.objects.create_user(
            username="viewset_tester",
            email="viewset@example.com",
            password="testpassword"
        )
        
        # Create shelves
        self.shelf1 = Shelf.objects.create(
            user=self.user,
            name="First Test Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        self.shelf2 = Shelf.objects.create(
            user=self.user,
            name="Second Test Shelf",
            shelf_type="Custom",
            is_private=False
        )
        
        # Create active and inactive featured shelves
        self.active_featured = FeaturedShelf.objects.create(
            shelf=self.shelf1,
            display_title="Active Featured Shelf",
            description="This shelf is active",
            is_active=True
        )
        
        self.inactive_featured = FeaturedShelf.objects.create(
            shelf=self.shelf2,
            display_title="Inactive Featured Shelf",
            description="This shelf is inactive",
            is_active=False
        )
        
        # URL for featured shelf listing
        self.list_url = reverse('featuredshelf-list')
    
    def test_authenticated_user_can_list_featured_shelves(self):
        """Test that authenticated users can list featured shelves"""
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Request featured shelves
        response = self.client.get(self.list_url)
        
        # Check response and content
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Only active featured shelves
        self.assertEqual(response.data[0]['display_title'], "Active Featured Shelf")
    
    def test_unauthenticated_user_cannot_list_featured_shelves(self):
        """Test that unauthenticated users cannot list featured shelves"""
        # No authentication
        response = self.client.get(self.list_url)
        
        # Should be unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_only_active_shelves_are_listed(self):
        """Test that only active featured shelves are listed"""
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Request featured shelves
        response = self.client.get(self.list_url)
        
        # Check that only active shelves are included
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Verify the inactive shelf is not included
        featured_titles = [shelf['display_title'] for shelf in response.data]
        self.assertIn("Active Featured Shelf", featured_titles)
        self.assertNotIn("Inactive Featured Shelf", featured_titles)
    
    def test_retrieve_specific_featured_shelf(self):
        """Test retrieving a specific featured shelf"""
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Request specific featured shelf
        response = self.client.get(
            reverse('featuredshelf-detail', kwargs={'pk': self.active_featured.pk})
        )
        
        # Check response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['display_title'], "Active Featured Shelf")
        self.assertEqual(response.data['description'], "This shelf is active")
    
    def test_viewset_is_read_only(self):
        """Test that the viewset is read-only and doesn't allow modifications"""
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Attempt to create a new featured shelf via API
        data = {
            'shelf': self.shelf1.pk,
            'display_title': 'New Featured Shelf',
            'description': 'Should not be created'
        }
        
        response = self.client.post(self.list_url, data, format='json')
        
        # Should not allow creation (405 Method Not Allowed)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Attempt to update existing featured shelf
        update_data = {
            'display_title': 'Updated Title'
        }
        
        response = self.client.put(
            reverse('featuredshelf-detail', kwargs={'pk': self.active_featured.pk}),
            update_data,
            format='json'
        )
        
        # Should not allow updates
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        
        # Attempt to delete
        response = self.client.delete(
            reverse('featuredshelf-detail', kwargs={'pk': self.active_featured.pk})
        )
        
        # Should not allow deletion
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
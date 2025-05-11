from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from library.models import Book, Review, Author, BookAuthor
from decimal import Decimal

User = get_user_model()

### Equivalent Classes ###
##  Authentication Status ##
#       Authenticated user            (valid)
#       Unauthenticated user          (invalid for create, valid for read)
##  Review Integrity ##
#       Rating: 0.00 <= x <= 5.00     (valid)
#       Rating: x < 0.00              (invalid)
#       Rating: x > 5.00              (invalid)
#       Content: not null             (valid)
#       Content: null                 (valid)
##  Uniqueness ##
#       One review per user per book  (valid)
#       Multiple reviews same book    (valid - different users)
#       Multiple reviews same user    (valid - different books)
##  Book Avg Rating ##
#       First review sets avg         (valid)
#       Multiple reviews updates avg  (valid)
#       Deleting review updates avg   (valid)
#       Updating review updates avg   (valid)
##  Flagging ##
#       Flag count increments         (valid)
#       Flag count < 3 visible        (valid)
#       Flag count >= 3 hidden        (valid)
##  Filtering ##
#       Filter by book                (valid)
#       Filter by user                (valid)
#       Sort by date asc/desc         (valid)
#       Sort by rating asc/desc       (valid)

class ReviewCreateTests(TestCase):
    """
    Test Module for creating reviews based on listed equivalence classes
    """
    
    def setUp(self):
        """
        Create test data for class.
        Test users, book, API client, and url.
        """
        # Create test users
        self.user = User.objects.create_user(
            username="testuser_1",
            email="test@example.com",
            password="testpassword"
        )      
        self.user_other = User.objects.create_user(
            username="testuser_2",
            email="other@example.com",
            password="testpassword"
        ) 
        
        # Create test author
        self.author = Author.objects.create(
            name="Test Author",
            author_id="author123"
        )
        
        # Create test book
        self.book = Book.objects.create(
            title="Test Book",
            book_id="book123",
            summary="A test book summary",
            average_rating=0.00
        )
        
        # Link author to book
        BookAuthor.objects.create(
            book=self.book,
            author=self.author
        )
        
        # Create another book for multiple reviews test
        self.book2 = Book.objects.create(
            title="Another Test Book",
            book_id="book456",
            summary="Another test book summary",
            average_rating=0.00
        )
        
        # Link author to second book
        BookAuthor.objects.create(
            book=self.book2,
            author=self.author
        )
        
        # Set up API client
        self.client = APIClient()
        
        # Set up URL for review creation
        self.url = reverse("reviews:review-list")
    
    ### Actual tests ###
    
    ## Authentication Status
    
    # Authentication Status: Authenticated user (valid)
    def test_create_review_authenticated_user(self):
        """
        Test creating a review when user is authenticated
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Review data
        data = {
            'book': self.book.id,
            'content': "This is a test review",
            'rating': 4.5
        }
        
        # Get response with given data
        response = self.client.post(self.url, data, format='json')
        
        # Assert that user authenticated, review created and data output matches input
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['rating']), Decimal('4.50'))
        self.assertTrue(
            Review.objects.filter(
                user=self.user,
                book=self.book
            ).exists()
        )
        
        # Check book's average rating was updated
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('4.50'))
    
    # Authentication Status: Unauthenticated user (invalid for create)
    def test_create_review_unauthenticated_user(self):
        """
        Test creating a review when user is unauthenticated (invalid)
        """
        # Review data
        data = {
            'book': self.book.id,
            'content': "This is a test review",
            'rating': 4.5
        }
        
        # Get response without authentication
        response = self.client.post(self.url, data, format='json')
        
        # Assert that creation failed with unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(
            Review.objects.filter(
                book=self.book,
                content="This is a test review"
            ).exists()
        )
    
    ## Review Integrity
    
    # Rating: 0.00 <= x <= 5.00 (valid)
    def test_create_review_valid_rating_range(self):
        """
        Test creating reviews with valid rating values (boundary testing)
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Test lower boundary (minimum rating = 0.00)
        data = {
            'book': self.book.id,
            'content': "Minimum rating test",
            'rating': 0.00
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['rating']), Decimal('0.00'))
        
        # Delete the review to test other ratings
        review_id = response.data['id']
        self.client.delete(f"{self.url}{review_id}/")
        
        # Test upper boundary (maximum rating = 5.00)
        data = {
            'book': self.book.id,
            'content': "Maximum rating test",
            'rating': 5.00
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['rating']), Decimal('5.00'))
        
        # Delete the review to test other ratings
        review_id = response.data['id']
        self.client.delete(f"{self.url}{review_id}/")
        
        # Test middle value (rating = 2.50)
        data = {
            'book': self.book.id,
            'content': "Middle rating test",
            'rating': 2.50
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['rating']), Decimal('2.50'))
    
    # Rating: x < 0.00 (invalid)
    def test_create_review_rating_too_low(self):
        """
        Test creating a review with rating below minimum (invalid)
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Review data with rating below minimum
        data = {
            'book': self.book.id,
            'content': "Rating too low test",
            'rating': -1.00
        }
        
        # Get response with invalid data
        response = self.client.post(self.url, data, format='json')
        
        # Assert that creation failed with bad request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('rating', response.data)
        self.assertFalse(
            Review.objects.filter(
                book=self.book,
                content="Rating too low test"
            ).exists()
        )
    
    # Rating: x > 5.00 (invalid)
    def test_create_review_rating_too_high(self):
        """
        Test creating a review with rating above maximum (invalid)
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Review data with rating above maximum
        data = {
            'book': self.book.id,
            'content': "Rating too high test",
            'rating': 6.00
        }
        
        # Get response with invalid data
        response = self.client.post(self.url, data, format='json')
        
        # Assert that creation failed with bad request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('rating', response.data)
        self.assertFalse(
            Review.objects.filter(
                book=self.book,
                content="Rating too high test"
            ).exists()
        )
    
    # Content: not null (valid)
    def test_create_review_with_content(self):
        """
        Test creating a review with content provided
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Review data with content
        data = {
            'book': self.book.id,
            'content': "This is a detailed review of the book",
            'rating': 4.00
        }
        
        # Get response
        response = self.client.post(self.url, data, format='json')
        
        # Assert creation successful and content saved
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], "This is a detailed review of the book")
        self.assertTrue(
            Review.objects.filter(
                book=self.book,
                content="This is a detailed review of the book"
            ).exists()
        )
    
    # Content: null (valid)
    def test_create_review_without_content(self):
        """
        Test creating a review without content (rating only)
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Review data without content
        data = {
            'book': self.book.id,
            'rating': 3.50
        }
        
        # Get response
        response = self.client.post(self.url, data, format='json')
        
        # Assert creation successful with empty content
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            Review.objects.filter(
                book=self.book,
                user=self.user
            ).exists()
        )
        
        # Verify content is empty
        review = Review.objects.get(book=self.book, user=self.user)
        self.assertEqual(review.content, "")
    
    ## Uniqueness
    
    # One review per user per book (valid)
    def test_one_review_per_user_per_book(self):
        """
        Test that a user can only have one review per book (updating replaces)
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Create first review
        data1 = {
            'book': self.book.id,
            'content': "Initial review",
            'rating': 3.00
        }
        response1 = self.client.post(self.url, data1, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Create second review for same book
        data2 = {
            'book': self.book.id,
            'content': "Updated review",
            'rating': 4.00
        }
        response2 = self.client.post(self.url, data2, format='json')
        
        # Should succeed (update existing) rather than create new
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Check that only one review exists and it has updated content
        reviews = Review.objects.filter(book=self.book, user=self.user)
        self.assertEqual(reviews.count(), 1)
        self.assertEqual(reviews.first().content, "Updated review")
        self.assertEqual(reviews.first().rating, Decimal('4.00'))
        
        # Check that book average rating is updated
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('4.00'))
    
    # Multiple reviews same book (valid - different users)
    def test_multiple_reviews_same_book_different_users(self):
        """
        Test that different users can review the same book
        """
        # First user review
        self.client.force_authenticate(user=self.user)
        data1 = {
            'book': self.book.id,
            'content': "First user review",
            'rating': 4.00
        }
        response1 = self.client.post(self.url, data1, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Second user review
        self.client.force_authenticate(user=self.user_other)
        data2 = {
            'book': self.book.id,
            'content': "Second user review",
            'rating': 3.00
        }
        response2 = self.client.post(self.url, data2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Check both reviews exist
        self.assertEqual(Review.objects.filter(book=self.book).count(), 2)
        
        # Check book average rating is updated correctly ((4.00 + 3.00) / 2 = 3.50)
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('3.50'))
    
    # Multiple reviews same user (valid - different books)
    def test_multiple_reviews_same_user_different_books(self):
        """
        Test that same user can review different books
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Review for first book
        data1 = {
            'book': self.book.id,
            'content': "Review for first book",
            'rating': 4.00
        }
        response1 = self.client.post(self.url, data1, format='json')
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        
        # Review for second book
        data2 = {
            'book': self.book2.id,
            'content': "Review for second book",
            'rating': 5.00
        }
        response2 = self.client.post(self.url, data2, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Check both reviews exist
        self.assertEqual(Review.objects.filter(user=self.user).count(), 2)
        
        # Check both books' average ratings updated
        self.book.refresh_from_db()
        self.book2.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('4.00'))
        self.assertEqual(self.book2.average_rating, Decimal('5.00'))

class ReviewUpdateTests(TestCase):
    """
    Test Module for updating reviews based on listed equivalence classes
    """
    
    def setUp(self):
        """
        Create test data for class.
        Test users, books, reviews, API client, and urls.
        """
        # Create test users
        self.user = User.objects.create_user(
            username="testuser_1",
            email="test@example.com",
            password="testpassword"
        )      
        self.user_other = User.objects.create_user(
            username="testuser_2",
            email="other@example.com",
            password="testpassword"
        ) 
        
        # Create test book
        self.book = Book.objects.create(
            title="Test Book",
            book_id="book123",
            summary="A test book summary",
            average_rating=0.00
        )
        
        # Create reviews
        self.review = Review.objects.create(
            user=self.user,
            book=self.book,
            content="Initial review content",
            rating=4.00
        )
        
        self.other_review = Review.objects.create(
            user=self.user_other,
            book=self.book,
            content="Other user review",
            rating=2.00
        )
        
        # Update book's average rating
        self.book.average_rating = (4.00 + 2.00) / 2
        self.book.save()
        
        # Set up API client
        self.client = APIClient()
        
        # Set up URL for review update
        self.url = f"/api/reviews/{self.review.id}/"
        self.other_url = f"/api/reviews/{self.other_review.id}/"
    
    ## Authentication Status
    
    # Authentication Status: Authenticated user (valid)
    def test_update_review_authenticated_user(self):
        """
        Test updating a review when user is authenticated and owns the review
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Updated review data
        data = {
            'content': "Updated review content",
            'rating': 5.00
        }
        
        # Get response with given data
        response = self.client.patch(self.url, data, format='json')
        
        # Assert update successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], "Updated review content")
        self.assertEqual(Decimal(response.data['rating']), Decimal('5.00'))
        
        # Check review was updated in database
        self.review.refresh_from_db()
        self.assertEqual(self.review.content, "Updated review content")
        self.assertEqual(self.review.rating, Decimal('5.00'))
        
        # Check book's average rating was updated ((5.00 + 2.00) / 2 = 3.50)
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('3.50'))
    
    # Authentication Status: Unauthenticated user (invalid)
    def test_update_review_unauthenticated_user(self):
        """
        Test updating a review when user is unauthenticated (invalid)
        """
        # Updated review data
        data = {
            'content': "Unauthorized update attempt",
            'rating': 1.00
        }
        
        # Get response without authentication
        response = self.client.patch(self.url, data, format='json')
        
        # Assert that update failed with unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Check review data unchanged
        self.review.refresh_from_db()
        self.assertEqual(self.review.content, "Initial review content")
        self.assertEqual(self.review.rating, Decimal('4.00'))
    
    # Ownership: User can't update other user's review
    def test_update_other_user_review(self):
        """
        Test that a user cannot update another user's review
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Updated review data for other user's review
        data = {
            'content': "Trying to update other's review",
            'rating': 1.00
        }
        
        # Get response with given data
        response = self.client.patch(self.other_url, data, format='json')
        
        # Assert update failed with forbidden or not found
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        
        # Check other user's review data unchanged
        self.other_review.refresh_from_db()
        self.assertEqual(self.other_review.content, "Other user review")
        self.assertEqual(self.other_review.rating, Decimal('2.00'))
    
    ## Review Integrity
    
    # Rating: 0.00 <= x <= 5.00 (valid)
    def test_update_review_valid_rating(self):
        """
        Test updating a review with valid rating
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Updated review data with valid rating
        data = {
            'rating': 3.50
        }
        
        # Get response with given data
        response = self.client.patch(self.url, data, format='json')
        
        # Assert update successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['rating']), Decimal('3.50'))
        
        # Check review rating updated in database
        self.review.refresh_from_db()
        self.assertEqual(self.review.rating, Decimal('3.50'))
        
        # Check book's average rating was updated ((3.50 + 2.00) / 2 = 2.75)
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('2.75'))
    
    # Rating: x < 0.00 (invalid)
    def test_update_review_rating_too_low(self):
        """
        Test updating a review with rating below minimum (invalid)
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Updated review data with invalid rating
        data = {
            'rating': -1.00
        }
        
        # Get response with given data
        response = self.client.patch(self.url, data, format='json')
        
        # Assert update failed with bad request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('rating', response.data)
        
        # Check review rating unchanged in database
        self.review.refresh_from_db()
        self.assertEqual(self.review.rating, Decimal('4.00'))
        
        # Check book's average rating unchanged
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('3.00'))
    
    # Rating: x > 5.00 (invalid)
    def test_update_review_rating_too_high(self):
        """
        Test updating a review with rating above maximum (invalid)
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Updated review data with invalid rating
        data = {
            'rating': 6.00
        }

    # reviews/tests.py (continued)
        
        # Get response with given data
        response = self.client.patch(self.url, data, format='json')
        
        # Assert update failed with bad request
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('rating', response.data)
        
        # Check review rating unchanged in database
        self.review.refresh_from_db()
        self.assertEqual(self.review.rating, Decimal('4.00'))
        
        # Check book's average rating unchanged
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('3.00'))
    
    # Content: Update content only
    def test_update_review_content_only(self):
        """
        Test updating only the content of a review
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Updated content only
        data = {
            'content': "Updated content without changing rating"
        }
        
        # Get response with given data
        response = self.client.patch(self.url, data, format='json')
        
        # Assert update successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], "Updated content without changing rating")
        
        # Check content updated but rating unchanged
        self.review.refresh_from_db()
        self.assertEqual(self.review.content, "Updated content without changing rating")
        self.assertEqual(self.review.rating, Decimal('4.00'))
        
        # Check book's average rating unchanged
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('3.00'))
    
    # Rating: Update rating only
    def test_update_review_rating_only(self):
        """
        Test updating only the rating of a review
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Updated rating only
        data = {
            'rating': 5.00
        }
        
        # Get response with given data
        response = self.client.patch(self.url, data, format='json')
        
        # Assert update successful
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['rating']), Decimal('5.00'))
        
        # Check rating updated but content unchanged
        self.review.refresh_from_db()
        self.assertEqual(self.review.content, "Initial review content")
        self.assertEqual(self.review.rating, Decimal('5.00'))
        
        # Check book's average rating updated ((5.00 + 2.00) / 2 = 3.50)
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('3.50'))

class ReviewDeleteTests(TestCase):
    """
    Test Module for deleting reviews based on listed equivalence classes
    """
    
    def setUp(self):
        """
        Create test data for class.
        Test users, books, reviews, API client, and urls.
        """
        # Create test users
        self.user = User.objects.create_user(
            username="testuser_1",
            email="test@example.com",
            password="testpassword"
        )      
        self.user_other = User.objects.create_user(
            username="testuser_2",
            email="other@example.com",
            password="testpassword"
        ) 
        
        # Create test book
        self.book = Book.objects.create(
            title="Test Book",
            book_id="book123",
            summary="A test book summary",
            average_rating=0.00
        )
        
        # Create another book for multiple reviews test
        self.book2 = Book.objects.create(
            title="Second Book",
            book_id="book456",
            summary="Second test book summary",
            average_rating=0.00
        )
        
        # Create reviews
        self.review = Review.objects.create(
            user=self.user,
            book=self.book,
            content="Test review content",
            rating=4.00
        )
        
        self.other_review = Review.objects.create(
            user=self.user_other,
            book=self.book,
            content="Other user review",
            rating=2.00
        )
        
        self.user_review2 = Review.objects.create(
            user=self.user,
            book=self.book2,
            content="User review for book 2",
            rating=5.00
        )
        
        # Update books' average ratings
        self.book.average_rating = (4.00 + 2.00) / 2  # = 3.00
        self.book.save()
        
        self.book2.average_rating = 5.00
        self.book2.save()
        
        # Set up API client
        self.client = APIClient()
        
        # Set up URLs for review deletion
        self.url = f"/api/reviews/{self.review.id}/"
        self.other_url = f"/api/reviews/{self.other_review.id}/"
        self.url2 = f"/api/reviews/{self.user_review2.id}/"
    
    ## Authentication Status
    
    # Authentication Status: Authenticated user (valid)
    def test_delete_review_authenticated_user(self):
        """
        Test deleting a review when user is authenticated and owns the review
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Delete request
        response = self.client.delete(self.url)
        
        # Assert deletion successful
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check review no longer exists
        self.assertFalse(
            Review.objects.filter(
                id=self.review.id
            ).exists()
        )
        
        # Check book's average rating was updated to the other user's rating
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('2.00'))
    
    # Authentication Status: Unauthenticated user (invalid)
    def test_delete_review_unauthenticated_user(self):
        """
        Test deleting a review when user is unauthenticated (invalid)
        """
        # Delete request without authentication
        response = self.client.delete(self.url)
        
        # Assert deletion failed with unauthorized
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Check review still exists
        self.assertTrue(
            Review.objects.filter(
                id=self.review.id
            ).exists()
        )
        
        # Check book's average rating unchanged
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('3.00'))
    
    # Ownership: User can't delete other user's review
    def test_delete_other_user_review(self):
        """
        Test that a user cannot delete another user's review
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Delete request for other user's review
        response = self.client.delete(self.other_url)
        
        # Assert deletion failed with forbidden or not found
        self.assertIn(response.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND])
        
        # Check other user's review still exists
        self.assertTrue(
            Review.objects.filter(
                id=self.other_review.id
            ).exists()
        )
        
        # Check book's average rating unchanged
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('3.00'))
    
    ## Book Avg Rating Update
    
    # Last review deletion resets avg rating to 0
    def test_delete_last_review_resets_avg_rating(self):
        """
        Test that deleting the last review for a book resets avg rating to 0
        """
        # Delete other user's review first (not through API)
        self.other_review.delete()
        
        # Update book's average rating manually to match just the user's review
        self.book.average_rating = 4.00
        self.book.save()
        
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Delete request for user's review
        response = self.client.delete(self.url)
        
        # Assert deletion successful
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check book's average rating reset to 0
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('0.00'))
    
    # Multiple reviews affected by deletion
    def test_delete_one_of_multiple_reviews_updates_avg(self):
        """
        Test that deleting one of multiple reviews updates avg rating correctly
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Delete request for user's review
        response = self.client.delete(self.url)
        
        # Assert deletion successful
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Check book's average rating updated to other user's rating
        self.book.refresh_from_db()
        self.assertEqual(self.book.average_rating, Decimal('2.00'))

class ReviewListFilterTests(TestCase):
    """
    Test Module for listing and filtering reviews based on listed equivalence classes
    """
    
    def setUp(self):
        """
        Create test data for class.
        Test users, books, reviews, API client, and url.
        """
        # Create test users
        self.user1 = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="testpassword"
        )      
        self.user2 = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="testpassword"
        ) 
        
        # Create test books
        self.book1 = Book.objects.create(
            title="Book One",
            book_id="book1",
            summary="First test book summary",
            average_rating=0.00
        )
        
        self.book2 = Book.objects.create(
            title="Book Two",
            book_id="book2",
            summary="Second test book summary",
            average_rating=0.00
        )
        
        # Create reviews with different dates for sorting tests
        from datetime import timedelta
        from django.utils import timezone
        
        # Base date for created_on
        now = timezone.now()
        
        # Book 1 reviews from different users with different ratings
        self.review1 = Review.objects.create(
            user=self.user1,
            book=self.book1,
            content="User 1 review for Book 1",
            rating=4.50,
            created_on=now - timedelta(days=5)
        )
        
        self.review2 = Review.objects.create(
            user=self.user2,
            book=self.book1,
            content="User 2 review for Book 1",
            rating=3.00,
            created_on=now - timedelta(days=3)
        )
        
        # Book 2 reviews
        self.review3 = Review.objects.create(
            user=self.user1,
            book=self.book2,
            content="User 1 review for Book 2",
            rating=5.00,
            created_on=now - timedelta(days=2)
        )
        
        self.review4 = Review.objects.create(
            user=self.user2,
            book=self.book2,
            content="User 2 review for Book 2",
            rating=2.50,
            created_on=now - timedelta(days=1)
        )
        
        # Create flagged review
        self.flagged_review = Review.objects.create(
            user=self.user1,
            book=self.book1,
            content="Flagged review",
            rating=1.00,
            created_on=now,
            flagged_count=3  # Set flagged_count to 3 to test hiding
        )
        
        # Update books' average ratings
        self.book1.average_rating = (4.50 + 3.00 + 1.00) / 3  # = 2.83
        self.book1.save()
        
        self.book2.average_rating = (5.00 + 2.50) / 2  # = 3.75
        self.book2.save()
        
        # Set up API client
        self.client = APIClient()
        
        # Set up URL for review listing
        self.url = reverse("reviews:review-list")
    
    ## Authentication Status
    
    # Authentication Status: Authenticated user (valid)
    def test_list_reviews_authenticated_user(self):
        """
        Test listing reviews when user is authenticated
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user1)
        
        # Get response
        response = self.client.get(self.url)
        
        # Assert successful response and returns all non-flagged reviews
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)  # All reviews except flagged one
    
    # Authentication Status: Unauthenticated user (valid for read)
    def test_list_reviews_unauthenticated_user(self):
        """
        Test listing reviews when user is unauthenticated (valid for read)
        """
        # Get response without authentication
        response = self.client.get(self.url)
        
        # Assert successful response and returns all non-flagged reviews
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)  # All reviews except flagged one
    
    ## Filtering
    
    # Filter by book
    def test_filter_reviews_by_book(self):
        """
        Test filtering reviews by book
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user1)
        
        # Get response with book_id filter
        response = self.client.get(f"{self.url}?book_id={self.book1.book_id}")
        
        # Assert successful response and returns only reviews for book1
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Book 1 non-flagged reviews
        
        # Check that returned reviews are for book1
        book_ids = [review['book'] for review in response.data]
        self.assertTrue(all(book_id == self.book1.id for book_id in book_ids))
    
    # Filter by user
    def test_filter_reviews_by_user(self):
        """
        Test filtering reviews by user
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user1)
        
        # Get response with user_id filter
        response = self.client.get(f"{self.url}?user_id={self.user1.id}")
        
        # Assert successful response and returns only reviews by user1
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # User 1 non-flagged reviews
        
        # Check that returned reviews are by user1
        user_ids = [review['user'] for review in response.data]
        self.assertTrue(all(user_id == self.user1.id for user_id in user_ids))
    
    # Sort by date ascending
    def test_sort_reviews_by_date_asc(self):
        """
        Test sorting reviews by date ascending
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user1)
        
        # Get response with sort params
        response = self.client.get(f"{self.url}?sort_by=created_on&sort_order=asc")
        
        # Assert successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check reviews are sorted by created_on ascending
        created_dates = [review['created_on'] for review in response.data]
        self.assertEqual(created_dates, sorted(created_dates))
    
    # Sort by date descending
    def test_sort_reviews_by_date_desc(self):
        """
        Test sorting reviews by date descending
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user1)
        
        # Get response with sort params
        response = self.client.get(f"{self.url}?sort_by=created_on&sort_order=desc")
        
        # Assert successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check reviews are sorted by created_on descending
        created_dates = [review['created_on'] for review in response.data]
        self.assertEqual(created_dates, sorted(created_dates, reverse=True))
    
    # Sort by rating ascending
    def test_sort_reviews_by_rating_asc(self):
        """
        Test sorting reviews by rating ascending
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user1)
        
        # Get response with sort params
        response = self.client.get(f"{self.url}?sort_by=rating&sort_order=asc")
        
        # Assert successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check reviews are sorted by rating ascending
        ratings = [Decimal(review['rating']) for review in response.data]
        self.assertEqual(ratings, sorted(ratings))
    
    # Sort by rating descending
    def test_sort_reviews_by_rating_desc(self):
        """
        Test sorting reviews by rating descending
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user1)
        
        # Get response with sort params
        response = self.client.get(f"{self.url}?sort_by=rating&sort_order=desc")
        
        # Assert successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check reviews are sorted by rating descending
        ratings = [Decimal(review['rating']) for review in response.data]
        self.assertEqual(ratings, sorted(ratings, reverse=True))
    
    ## Flagging
    
    # Flag count < 3 visible
    def test_reviews_with_flag_count_less_than_3_visible(self):
        """
        Test that reviews with flag count < 3 are visible
        """
        # Create review with flag count 2
        slightly_flagged = Review.objects.create(
            user=self.user2,
            book=self.book2,
            content="Slightly flagged review",
            rating=3.50,
            flagged_count=2
        )
        
        # Authenticate user
        self.client.force_authenticate(user=self.user1)
        
        # Get response
        response = self.client.get(self.url)
        
        # Assert successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check slightly flagged review is included
        review_ids = [review['id'] for review in response.data]
        self.assertIn(slightly_flagged.id, review_ids)
    
    # Flag count >= 3 hidden
    def test_reviews_with_flag_count_3_or_more_hidden(self):
        """
        Test that reviews with flag count >= 3 are hidden by default
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user1)
        
        # Get response
        response = self.client.get(self.url)
        
        # Assert successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check flagged review is not included
        review_ids = [review['id'] for review in response.data]
        self.assertNotIn(self.flagged_review.id, review_ids)
    
    # Show flagged reviews with hide_flagged=false
    def test_show_flagged_reviews_with_param(self):
        """
        Test that flagged reviews can be shown with hide_flagged=false parameter
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user1)
        
        # Get response with hide_flagged=false
        response = self.client.get(f"{self.url}?hide_flagged=false")
        
        # Assert successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check flagged review is included
        review_ids = [review['id'] for review in response.data]
        self.assertIn(self.flagged_review.id, review_ids)
    
    ## Flagging Action
    
    # Flag increment action
    def test_flag_review_increment(self):
        """
        Test that flagging a review increments its flag count
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user2)
        
        # Flag URL
        flag_url = f"/api/reviews/{self.review1.id}/flag/"
        
        # Initial flag count
        initial_count = self.review1.flagged_count
        
        # Flag the review
        response = self.client.post(flag_url)
        
        # Assert successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['flagged_count'], initial_count + 1)
        
        # Check flag count incremented in database
        self.review1.refresh_from_db()
        self.assertEqual(self.review1.flagged_count, initial_count + 1)

class ReviewBookStatsTests(TestCase):
    """
    Test Module for book statistics based on reviews
    """
    
    def setUp(self):
        """
        Create test data for class.
        Test users, book, reviews with various ratings, API client, and url.
        """
        # Create test user
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        
        # Create test book
        self.book = Book.objects.create(
            title="Test Book",
            book_id="book123",
            summary="A test book summary",
            average_rating=0.00
        )
        
        # Create reviews with different ratings to test distribution
        self.review1 = Review.objects.create(
            user=self.user,
            book=self.book,
            content="5 star review",
            rating=5.00
        )
        
        # Create additional users for additional reviews
        self.user2 = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="testpassword"
        )
        
        self.user3 = User.objects.create_user(
            username="user3",
            email="user3@example.com",
            password="testpassword"
        )
        
        self.user4 = User.objects.create_user(
            username="user4",
            email="user4@example.com",
            password="testpassword"
        )
        
        self.user5 = User.objects.create_user(
            username="user5",
            email="user5@example.com",
            password="testpassword"
        )
        
        # Create additional reviews
        self.review2 = Review.objects.create(
            user=self.user2,
            book=self.book,
            content="4 star review",
            rating=4.00
        )
        
        self.review3 = Review.objects.create(
            user=self.user3,
            book=self.book,
            content="3 star review",
            rating=3.00
        )
        
        self.review4 = Review.objects.create(
            user=self.user4,
            book=self.book,
            content="2 star review",
            rating=2.00
        )
        
        self.review5 = Review.objects.create(
            user=self.user5,
            book=self.book,
            content="1 star review",
            rating=1.00
        )
        
        # Update book's average rating
        self.book.average_rating = (5.00 + 4.00 + 3.00 + 2.00 + 1.00) / 5  # = 3.00
        self.book.save()
        
        # Set up API client
        self.client = APIClient()
        
        # Set up URL for book stats
        self.url = f"/api/reviews/book_stats/?book_id={self.book.book_id}"
    
    # Book stats calculation
    def test_book_stats_calculation(self):
        """
        Test that book statistics are calculated correctly
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Get response
        response = self.client.get(self.url)
        
        # Assert successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check stats data
        self.assertEqual(response.data['book_id'], self.book.book_id)
        self.assertEqual(response.data['title'], self.book.title)
        self.assertEqual(Decimal(response.data['average_rating']), Decimal('3.00'))
        self.assertEqual(response.data['review_count'], 5)
        
        # Check rating distribution
        distribution = response.data['rating_distribution']
        self.assertEqual(distribution[1], 1)  # One 1-star review
        self.assertEqual(distribution[2], 1)  # One 2-star review
        self.assertEqual(distribution[3], 1)  # One 3-star review
        self.assertEqual(distribution[4], 1)  # One 4-star review
        self.assertEqual(distribution[5], 1)  # One 5-star review
    
    # Invalid book_id
    def test_book_stats_invalid_book_id(self):
        """
        Test book stats with invalid book_id
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Invalid URL
        invalid_url = "/api/reviews/book_stats/?book_id=nonexistent"
        
        # Get response
        response = self.client.get(invalid_url)
        
        # Assert not found response
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # Missing book_id parameter
    def test_book_stats_missing_book_id(self):
        """
        Test book stats with missing book_id parameter
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # URL without book_id
        invalid_url = "/api/reviews/book_stats/"
        
        # Get response
        response = self.client.get(invalid_url)
        
        # Assert bad request response
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class UserReviewsTests(TestCase):
    """
    Test Module for retrieving a user's reviews
    """
    
    def setUp(self):
        """
        Create test data for class.
        Test user, books, reviews, API client, and url.
        """
        # Create test user
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        
        # Create another user
        self.other_user = User.objects.create_user(
            username="otheruser",
            email="other@example.com",
            password="testpassword"
        )
        
        # Create test books
        self.book1 = Book.objects.create(
            title="Book One",
            book_id="book1",
            summary="First test book summary"
        )
        
        self.book2 = Book.objects.create(
            title="Book Two",
            book_id="book2",
            summary="Second test book summary"
        )
        
        # Create reviews for test user
        self.review1 = Review.objects.create(
            user=self.user,
            book=self.book1,
            content="User review for Book 1",
            rating=4.00
        )
        
        self.review2 = Review.objects.create(
            user=self.user,
            book=self.book2,
            content="User review for Book 2",
            rating=5.00
        )
        
        # Create review for other user
        self.other_review = Review.objects.create(
            user=self.other_user,
            book=self.book1,
            content="Other user review",
            rating=3.00
        )
        
        # Set up API client
        self.client = APIClient()
        
        # Set up URL for user reviews
        self.url = "/api/reviews/user_reviews/"
    
    # Authentication required
    def test_user_reviews_authentication_required(self):
        """
        Test that getting user reviews requires authentication
        """
        # Get response without authentication
        response = self.client.get(self.url)
        
        # Assert unauthorized response
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    # Get user's own reviews
    def test_get_user_own_reviews(self):
        """
        Test that a user can get their own reviews
        """
        # Authenticate user
        self.client.force_authenticate(user=self.user)
        
        # Get response
        response = self.client.get(self.url)
        
        # Assert successful response
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check response contains only the user's reviews
        self.assertEqual(len(response.data), 2)
        
        # Check user IDs in response
        user_ids = [review['user'] for review in response.data]
        self.assertTrue(all(user_id == self.user.id for user_id in user_ids))
        
        # Check book IDs in response
        book_ids = sorted([review['book'] for review in response.data])
        expected_book_ids = sorted([self.book1.id, self.book2.id])
        self.assertEqual(book_ids, expected_book_ids)
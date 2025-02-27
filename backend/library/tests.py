from django.test import TestCase
from django.core.exceptions import ValidationError
from library.models import (
    Book, Author, BookAuthor, Genre, BookGenre, Edition, Publisher, CoverImage, User,
    UserBook, Achievement, UserAchievement, UserProfile, Shelf, ShelfEdition,
    JournalEntry, Review, Community, CommunityUser, BookClub, ClubMember, Post,
    PostComment, ReviewComment, ShelfComment
)
import datetime

class BookModelTest(TestCase):
    def setUp(self):
        self.author1 = Author.objects.create(name="J.K. Rowling", unique_hash="auth123")
        self.author2 = Author.objects.create(name="George Orwell", unique_hash="auth121")
        self.author3 = Author.objects.create(name="Harper Lee", unique_hash="auth122")
        
        self.genre_fiction = Genre.objects.create(name="Fiction")
        self.genre_dystopian = Genre.objects.create(name="Dystopian")
        self.genre_classic = Genre.objects.create(name="Classic")

        self.book1 = Book.objects.create(
            title="Harry Potter", unique_hash="book1234", year_published=1997
        )
        self.book1.authors.add(self.author1)
        self.book1.genres.add(self.genre_fiction)
        
        self.book2 = Book.objects.create(
            title="1984", unique_hash="book5678", year_published=1949
        )
        self.book2.authors.add(self.author2)
        self.book2.genres.add(self.genre_dystopian)

        self.book3 = Book.objects.create(
            title="To Kill a Mockingbird", unique_hash="book9012", year_published=1960
        )
        self.book3.authors.add(self.author3)
        self.book3.genres.add(self.genre_classic)
    
    def test_multiple_books_creation(self):
        book_count = Book.objects.count()
        self.assertEqual(book_count, 3)
    
    def test_books_have_correct_data(self):
        self.assertEqual(self.book1.title, "Harry Potter")
        self.assertEqual(self.book2.title, "1984")
        self.assertEqual(self.book3.title, "To Kill a Mockingbird")
    
    def test_authors_association(self):
        self.assertEqual(self.book1.authors.first().name, "J.K. Rowling")
        self.assertEqual(self.book2.authors.first().name, "George Orwell")
        self.assertEqual(self.book3.authors.first().name, "Harper Lee")
    
    def test_genres_association(self):
        self.assertEqual(self.book1.genres.first().name, "Fiction")
        self.assertEqual(self.book2.genres.first().name, "Dystopian")
        self.assertEqual(self.book3.genres.first().name, "Classic")
    
    def test_invalid_year_published(self):
        with self.assertRaises(ValidationError):
            invalid_book = Book(
                title="Future Book", unique_hash="book9999", year_published=3025
            )
            invalid_book.full_clean()

class AuthorModelTest(TestCase):
    def setUp(self):
        self.author = Author.objects.create(name="Valid Author", unique_hash="auth001")
    
    def test_author_creation(self):
        self.assertEqual(self.author.name, "Valid Author")
    
    def test_duplicate_author(self):
        with self.assertRaises(ValidationError):
            duplicate_author = Author(name="Valid Author", unique_hash="auth001")
            duplicate_author.full_clean()

class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        user_count = User.objects.count()

        print(f"User counter: {user_count}")
    
    def test_user_creation(self):
        self.assertEqual(self.user.username, "testuser")
    
    def test_default_trust_level(self):
        self.assertEqual(self.user.trust_level, 50)

class ReviewModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="reviewuser", password="password")
        self.book = Book.objects.create(title="Review Book", unique_hash="revbook001")
        self.review = Review.objects.create(
            user=self.user, book=self.book, rating=4.5, content="Great book!"
        )
    
    def test_review_creation(self):
        self.assertEqual(self.review.user.username, "reviewuser")
        self.assertEqual(self.review.book.title, "Review Book")
    
    def test_review_rating_constraints(self):
        with self.assertRaises(ValidationError):
            invalid_review = Review(
                user=self.user, book=self.book, rating=5.5, content="Invalid rating"
            )
            invalid_review.full_clean()

class ShelfModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="shelfuser", password="password")
        self.shelf = Shelf.objects.create(user=self.user, name="Favorites", shelf_type="Custom")
    
    def test_shelf_creation(self):
        self.assertEqual(self.shelf.user.username, "shelfuser")
        self.assertEqual(self.shelf.name, "Favorites")
    
    def test_shelf_type_constraint(self):
        with self.assertRaises(ValidationError):
            invalid_shelf = Shelf(user=self.user, name="Invalid", shelf_type="Unknown")
            invalid_shelf.full_clean()

class CommunityTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="commuser", password="password")
        self.book = Book.objects.create(title="Community Book", unique_hash="combook001")
        self.community = Community.objects.create(book=self.book)
        self.community_user = CommunityUser.objects.create(community=self.community, user=self.user)
    
    def test_community_creation(self):
        self.assertEqual(self.community.book.title, "Community Book")
    
    def test_user_community_association(self):
        self.assertEqual(self.community.users.count(), 1)
        self.assertEqual(self.community.users.first().username, "commuser")

class BookClubTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="clubuser", password="password")
        self.book = Book.objects.create(title="Club Book", unique_hash="clubbook001")
        self.bookclub = BookClub.objects.create(name="Awesome Club", book=self.book)
    
    def test_bookclub_creation(self):
        self.assertEqual(self.bookclub.name, "Awesome Club")
        self.assertEqual(self.bookclub.book.title, "Club Book")
    
    def test_add_member_to_club(self):
        club_member = ClubMember.objects.create(user=self.user, club=self.bookclub)
        print(f"Club member created: {club_member}")
        self.assertEqual(self.bookclub.users.count(), 1)
        self.assertEqual(self.bookclub.users.first().username, "clubuser")


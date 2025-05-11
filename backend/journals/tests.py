# backend/journals/tests.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from library.models import Book, UserBook
from .models import Journal, JournalEntry

User = get_user_model()

### Equivalent Classes ###
##  Authentication Status ##
#       Authenticated user                           (valid)
#       Unauthenticated user                         (invalid)
##  Journal Ownership ##
#       User creates own journal                     (valid)
#       User modifies own journal                    (valid)
#       User tries to create journal for other user  (invalid)
#       User tries to modify another user's journal  (invalid)
##  Journal Privacy ##
#       Create private journal                       (valid)
#       Create public journal                        (valid)
#       View own journal (private/public)            (valid)
#       View other's public journal                  (valid)
#       View other's private journal                 (invalid)
##  Journal Entry Ownership ##
#       User creates entry for own journal           (valid)
#       User modifies own entry                      (valid)
#       User tries to create entry for other's journal (invalid)
#       User tries to modify another user's entry    (invalid)
##  Entry Privacy ##
#       Create private entry                         (valid)
#       Create public entry                          (valid)
#       View own entry (private/public)              (valid)
#       View other's public entry in public journal  (valid)
#       View other's private entry in public journal (invalid)
#       View any entry in other's private journal    (invalid)
##  Journal Uniqueness ##
#       Create journal for book user doesn't have yet (valid)
#       Create journal for book user already has      (valid)
#       Create second journal for same book           (invalid)
##  Sorting and Filtering ##
#       Filter entries by page number                (valid)
#       Filter entries by privacy                    (valid)
#       Sort entries by creation date                (valid)
#       Sort entries by page number                  (valid)
#       Sort entries by word count                   (valid)


class JournalModelTests(TestCase):
    """Test module for Journal model"""
    
    def setUp(self):
        """Set up test data"""
        # Create users
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='testpassword'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpassword'
        )
        
        # Create books
        self.book1 = Book.objects.create(
            title='Test Book 1',
            book_id='test1'
        )
        self.book2 = Book.objects.create(
            title='Test Book 2',
            book_id='test2'
        )
        
        # Create user_books
        self.user_book1 = UserBook.objects.create(
            user=self.user1,
            book=self.book1
        )
        self.user_book2 = UserBook.objects.create(
            user=self.user2,
            book=self.book2
        )
        
        # Create journals
        self.private_journal = Journal.objects.create(
            user_book=self.user_book1,
            title='Private Journal',
            description='This is a private journal',
            is_private=True
        )
        
        self.public_journal = Journal.objects.create(
            user_book=self.user_book2,
            title='Public Journal',
            description='This is a public journal',
            is_private=False
        )
    
    def test_journal_creation(self):
        """Test creating a journal"""
        self.assertEqual(self.private_journal.title, 'Private Journal')
        self.assertEqual(self.private_journal.description, 'This is a private journal')
        self.assertTrue(self.private_journal.is_private)
        self.assertEqual(self.private_journal.user_book, self.user_book1)
        
        self.assertEqual(self.public_journal.title, 'Public Journal')
        self.assertEqual(self.public_journal.description, 'This is a public journal')
        self.assertFalse(self.public_journal.is_private)
        self.assertEqual(self.public_journal.user_book, self.user_book2)
    
    def test_journal_str_method(self):
        """Test journal string representation"""
        expected_str = f"Private Journal - {self.user1.username}'s journal for {self.book1.title}"
        self.assertEqual(str(self.private_journal), expected_str)
    
    def test_user_property(self):
        """Test journal's user property"""
        self.assertEqual(self.private_journal.user, self.user1)
        self.assertEqual(self.public_journal.user, self.user2)
    
    def test_book_property(self):
        """Test journal's book property"""
        self.assertEqual(self.private_journal.book, self.book1)
        self.assertEqual(self.public_journal.book, self.book2)
    
    def test_entry_count_property(self):
        """Test journal's entry_count property"""
        # Initially, no entries
        self.assertEqual(self.private_journal.entry_count, 0)
        
        # Add entries
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Entry 1',
            content='Content 1'
        )
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Entry 2',
            content='Content 2'
        )
        
        # Check count
        self.assertEqual(self.private_journal.entry_count, 2)


class JournalEntryModelTests(TestCase):
    """Test module for JournalEntry model"""
    
    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        # Create book
        self.book = Book.objects.create(
            title='Test Book',
            book_id='test'
        )
        
        # Create user_book
        self.user_book = UserBook.objects.create(
            user=self.user,
            book=self.book
        )
        
        # Create journal
        self.journal = Journal.objects.create(
            user_book=self.user_book,
            title='Test Journal',
            description='This is a test journal',
            is_private=False
        )
        
        # Create entries
        self.entry1 = JournalEntry.objects.create(
            journal=self.journal,
            title='Test Entry 1',
            content='This is the first test entry.',
            is_private=True,
            page_num=10
        )
        
        self.entry2 = JournalEntry.objects.create(
            journal=self.journal,
            title='Test Entry 2',
            content='This is the second test entry with more words than the first one.',
            is_private=False,
            page_num=20
        )
    
    def test_entry_creation(self):
        """Test creating entries"""
        self.assertEqual(self.entry1.title, 'Test Entry 1')
        self.assertEqual(self.entry1.content, 'This is the first test entry.')
        self.assertTrue(self.entry1.is_private)
        self.assertEqual(self.entry1.page_num, 10)
        self.assertEqual(self.entry1.journal, self.journal)
        
        self.assertEqual(self.entry2.title, 'Test Entry 2')
        self.assertEqual(self.entry2.content, 'This is the second test entry with more words than the first one.')
        self.assertFalse(self.entry2.is_private)
        self.assertEqual(self.entry2.page_num, 20)
        self.assertEqual(self.entry2.journal, self.journal)
    
    def test_entry_str_method(self):
        """Test entry string representation"""
        expected_str = f"Test Entry 1 - Test Journal"
        self.assertEqual(str(self.entry1), expected_str)
    
    def test_word_count_property(self):
        """Test entry's word_count property"""
        self.assertEqual(self.entry1.word_count, 6)  # "This is the first test entry."
        self.assertEqual(self.entry2.word_count, 12)  # "This is the second test entry with more words than the first one."
    
    def test_user_property(self):
        """Test entry's user property"""
        self.assertEqual(self.entry1.user, self.user)
        self.assertEqual(self.entry2.user, self.user)


class JournalAPITests(TestCase):
    """Test module for Journal API"""
    
    def setUp(self):
        """Set up test data"""
        # Create users
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='testpassword'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpassword'
        )
        
        # Create books
        self.book1 = Book.objects.create(
            title='Test Book 1',
            book_id='test1'
        )
        self.book2 = Book.objects.create(
            title='Test Book 2',
            book_id='test2'
        )
        
        # Create user_books
        self.user_book1 = UserBook.objects.create(
            user=self.user1,
            book=self.book1
        )
        self.user_book2 = UserBook.objects.create(
            user=self.user2,
            book=self.book2
        )
        
        # Create journals
        self.private_journal = Journal.objects.create(
            user_book=self.user_book1,
            title='Private Journal',
            description='This is a private journal',
            is_private=True
        )
        
        self.public_journal = Journal.objects.create(
            user_book=self.user_book2,
            title='Public Journal',
            description='This is a public journal',
            is_private=False
        )
        
        # API client
        self.client = APIClient()
        
        # URLs
        self.journals_list_url = reverse('journal-list')
    
    ### Authentication Status Tests ###
    
    # Authenticated user (valid)
    def test_list_journals_authenticated(self):
        """Test that authenticated users can list journals"""
        self.client.force_authenticate(user=self.user1)
        response = self.client.get(self.journals_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    # Unauthenticated user (invalid)
    def test_list_journals_unauthenticated(self):
        """Test that unauthenticated users cannot list journals"""
        response = self.client.get(self.journals_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    ### Journal Ownership Tests ###
    
    # User creates own journal (valid)
    def test_create_own_journal(self):
        """Test that a user can create a journal for a book they own"""
        self.client.force_authenticate(user=self.user1)
        data = {
            'title': 'New Journal',
            'description': 'This is a new journal',
            'is_private': True,
            'book_id': 'test1'
        }
        response = self.client.post(self.journals_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)  # Should fail because user already has a journal for this book
        
        # Try with a different book
        new_book = Book.objects.create(title='New Book', book_id='newbook')
        data['book_id'] = 'newbook'
        response = self.client.post(self.journals_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
    
    # User modifies own journal (valid)
    def test_update_own_journal(self):
        """Test that a user can update their own journal"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('journal-detail', kwargs={'pk': self.private_journal.pk})
        data = {
            'title': 'Updated Journal',
            'description': 'This journal has been updated',
            'is_private': False
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.private_journal.refresh_from_db()
        self.assertEqual(self.private_journal.title, 'Updated Journal')
        self.assertEqual(self.private_journal.description, 'This journal has been updated')
        self.assertFalse(self.private_journal.is_private)
    
    # User tries to modify another user's journal (invalid)
    def test_update_other_user_journal(self):
        """Test that a user cannot update another user's journal"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('journal-detail', kwargs={'pk': self.public_journal.pk})
        data = {
            'title': 'Hacked Journal',
            'is_private': True
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.public_journal.refresh_from_db()
        self.assertEqual(self.public_journal.title, 'Public Journal')  # Title should not change
    
    ### Journal Privacy Tests ###
    
    # View own journal (private/public) (valid)
    def test_view_own_journals(self):
        """Test that a user can view their own journals (private and public)"""
        self.client.force_authenticate(user=self.user1)
        
        # View private journal
        url = reverse('journal-detail', kwargs={'pk': self.private_journal.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Private Journal')


    # View other's public journal (valid)
    def test_view_other_public_journal(self):
        """Test that a user can view another user's public journal"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('journal-detail', kwargs={'pk': self.public_journal.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Public Journal')
    
    # View other's private journal (invalid)
    def test_view_other_private_journal(self):
        """Test that a user cannot view another user's private journal"""
        # User2 tries to view User1's private journal
        self.client.force_authenticate(user=self.user2)
        url = reverse('journal-detail', kwargs={'pk': self.private_journal.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)  # Should return 404 to avoid leaking private journal IDs
    
    ### Journal Uniqueness Tests ###
    
    # Create second journal for same book (invalid)
    def test_create_duplicate_journal(self):
        """Test that a user cannot create multiple journals for the same book"""
        self.client.force_authenticate(user=self.user1)
        data = {
            'title': 'Duplicate Journal',
            'description': 'This should fail',
            'is_private': True,
            'book_id': 'test1'  # Same book as private_journal
        }
        response = self.client.post(self.journals_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify error message
        self.assertIn('book_id', response.data)
        self.assertEqual(response.data['book_id'], 'A journal already exists for this book.')


class JournalEntryAPITests(TestCase):
    """Test module for JournalEntry API"""
    
    def setUp(self):
        """Set up test data"""
        # Create users
        self.user1 = User.objects.create_user(
            username='testuser1',
            email='test1@example.com',
            password='testpassword'
        )
        self.user2 = User.objects.create_user(
            username='testuser2',
            email='test2@example.com',
            password='testpassword'
        )
        
        # Create books
        self.book1 = Book.objects.create(
            title='Test Book 1',
            book_id='test1'
        )
        self.book2 = Book.objects.create(
            title='Test Book 2',
            book_id='test2'
        )
        
        # Create user_books
        self.user_book1 = UserBook.objects.create(
            user=self.user1,
            book=self.book1
        )
        self.user_book2 = UserBook.objects.create(
            user=self.user2,
            book=self.book2
        )
        
        # Create journals
        self.private_journal = Journal.objects.create(
            user_book=self.user_book1,
            title='Private Journal',
            description='This is a private journal',
            is_private=True
        )
        
        self.public_journal = Journal.objects.create(
            user_book=self.user_book2,
            title='Public Journal',
            description='This is a public journal',
            is_private=False
        )
        
        # Create journal entries
        self.private_entry = JournalEntry.objects.create(
            journal=self.private_journal,
            title='Private Entry',
            content='This is a private entry',
            is_private=True,
            page_num=10
        )
        
        self.public_entry_in_private_journal = JournalEntry.objects.create(
            journal=self.private_journal,
            title='Public Entry in Private Journal',
            content='This is a public entry in a private journal',
            is_private=False,
            page_num=20
        )
        
        self.private_entry_in_public_journal = JournalEntry.objects.create(
            journal=self.public_journal,
            title='Private Entry in Public Journal',
            content='This is a private entry in a public journal',
            is_private=True,
            page_num=30
        )
        
        self.public_entry_in_public_journal = JournalEntry.objects.create(
            journal=self.public_journal,
            title='Public Entry in Public Journal',
            content='This is a public entry in a public journal',
            is_private=False,
            page_num=40
        )
        
        # API client
        self.client = APIClient()
        
        # URLs
        self.journal_entries_url = reverse('journal-entry-list', kwargs={'journal_pk': self.private_journal.pk})
        self.public_journal_entries_url = reverse('journal-entry-list', kwargs={'journal_pk': self.public_journal.pk})
    
    ### Journal Entry Ownership Tests ###
    
    # User creates entry for own journal (valid)
    def test_create_entry_for_own_journal(self):
        """Test that a user can create an entry for their own journal"""
        self.client.force_authenticate(user=self.user1)
        data = {
            'title': 'New Entry',
            'content': 'This is a new entry',
            'is_private': True,
            'page_num': 50,
            'journal': self.private_journal.pk
        }
        response = self.client.post(self.journal_entries_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify entry was created
        self.assertTrue(JournalEntry.objects.filter(title='New Entry').exists())
    
    # User modifies own entry (valid)
    def test_update_own_entry(self):
        """Test that a user can update their own entry"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('journal-entry-detail', kwargs={
            'journal_pk': self.private_journal.pk,
            'pk': self.private_entry.pk
        })
        data = {
            'title': 'Updated Entry',
            'content': 'This entry has been updated',
            'is_private': False
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify entry was updated
        self.private_entry.refresh_from_db()
        self.assertEqual(self.private_entry.title, 'Updated Entry')
        self.assertEqual(self.private_entry.content, 'This entry has been updated')
        self.assertFalse(self.private_entry.is_private)
    
    # User tries to create entry for other's journal (invalid)
    def test_create_entry_for_other_journal(self):
        """Test that a user cannot create an entry for another user's journal"""
        self.client.force_authenticate(user=self.user1)
        data = {
            'title': 'Unauthorized Entry',
            'content': 'This should fail',
            'is_private': True,
            'page_num': 60,
            'journal': self.public_journal.pk  # User2's journal
        }
        response = self.client.post(self.public_journal_entries_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify entry wasn't created
        self.assertFalse(JournalEntry.objects.filter(title='Unauthorized Entry').exists())
    
    # User tries to modify another user's entry (invalid)
    def test_update_other_user_entry(self):
        """Test that a user cannot update another user's entry"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('journal-entry-detail', kwargs={
            'journal_pk': self.public_journal.pk,
            'pk': self.public_entry_in_public_journal.pk
        })
        data = {
            'title': 'Hacked Entry',
            'content': 'This should fail'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify entry wasn't updated
        self.public_entry_in_public_journal.refresh_from_db()
        self.assertEqual(self.public_entry_in_public_journal.title, 'Public Entry in Public Journal')
    
    ### Entry Privacy Tests ###
    
    # View own entries (private/public) (valid)
    def test_view_own_entries(self):
        """Test that a user can view their own entries (private and public)"""
        self.client.force_authenticate(user=self.user1)
        
        # Get all entries for private journal
        response = self.client.get(self.journal_entries_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should see both private and public entries
        entry_titles = [entry['title'] for entry in response.data]
        self.assertIn('Private Entry', entry_titles)
        self.assertIn('Public Entry in Private Journal', entry_titles)
    
    # View other's public entry in public journal (valid)
    def test_view_other_public_entry_in_public_journal(self):
        """Test that a user can view another user's public entry in a public journal"""
        self.client.force_authenticate(user=self.user1)
        
        # Get entries for public journal
        response = self.client.get(self.public_journal_entries_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only see public entries
        entry_titles = [entry['title'] for entry in response.data]
        self.assertIn('Public Entry in Public Journal', entry_titles)
        self.assertNotIn('Private Entry in Public Journal', entry_titles)
    
    # View other's private entry in public journal (invalid)
    def test_view_other_private_entry_in_public_journal(self):
        """Test that a user cannot view another user's private entry in a public journal"""
        self.client.force_authenticate(user=self.user1)
        
        # Get entries for public journal
        response = self.client.get(self.public_journal_entries_url)
        
        # Should not see private entries
        entry_titles = [entry['title'] for entry in response.data]
        self.assertNotIn('Private Entry in Public Journal', entry_titles)
    
    # View any entry in other's private journal (invalid)
    def test_view_entries_in_other_private_journal(self):
        """Test that a user cannot view any entries in another user's private journal"""
        self.client.force_authenticate(user=self.user2)
        
        # Try to get entries for user1's private journal
        response = self.client.get(self.journal_entries_url)
        
        # Should get 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    ### Sorting and Filtering Tests ###
    
    # Filter entries by page number (valid)
    def test_filter_entries_by_page_number(self):
        """Test filtering entries by page number"""
        self.client.force_authenticate(user=self.user1)
        
        # Add a few more entries with different page numbers
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Entry Page 15',
            content='Content',
            page_num=15
        )
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Entry Page 15 Again',
            content='More content',
            page_num=15  # Same page number
        )
        
        # Filter by page number
        response = self.client.get(f"{self.journal_entries_url}?page_num=15")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should have exactly 2 entries
        self.assertEqual(len(response.data), 2)
        entry_titles = [entry['title'] for entry in response.data]
        self.assertIn('Entry Page 15', entry_titles)
        self.assertIn('Entry Page 15 Again', entry_titles)
    
    # Sort entries by creation date (valid)
    def test_sort_entries_by_creation_date(self):
        """Test sorting entries by creation date"""
        self.client.force_authenticate(user=self.user1)
        
        # Get entries sorted by creation date (ascending)
        response = self.client.get(f"{self.journal_entries_url}?ordering=created_on")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # First entry should be the oldest
        self.assertEqual(response.data[0]['title'], 'Private Entry')
        
        # Get entries sorted by creation date (descending)
        response = self.client.get(f"{self.journal_entries_url}?ordering=-created_on")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # First entry should be the newest
        self.assertEqual(response.data[0]['title'], 'Public Entry in Private Journal')
    
    # Sort entries by page number (valid)
    def test_sort_entries_by_page_number(self):
        """Test sorting entries by page number"""
        self.client.force_authenticate(user=self.user1)
        
        # Get entries sorted by page number (ascending)
        response = self.client.get(f"{self.journal_entries_url}?ordering=page_num")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify order
        self.assertEqual(response.data[0]['page_num'], 10)
        self.assertEqual(response.data[1]['page_num'], 20)
        
        # Get entries sorted by page number (descending)
        response = self.client.get(f"{self.journal_entries_url}?ordering=-page_num")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify order
        self.assertEqual(response.data[0]['page_num'], 20)
        self.assertEqual(response.data[1]['page_num'], 10)
    
    # Filter entries by privacy (valid)
    def test_filter_entries_by_privacy(self):
        """Test filtering entries by privacy setting"""
        self.client.force_authenticate(user=self.user1)
        
        # Filter by private entries
        response = self.client.get(f"{self.journal_entries_url}?is_private=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only have private entries
        entry_titles = [entry['title'] for entry in response.data]
        self.assertIn('Private Entry', entry_titles)
        self.assertNotIn('Public Entry in Private Journal', entry_titles)
        
        # Filter by public entries
        response = self.client.get(f"{self.journal_entries_url}?is_private=false")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only have public entries
        entry_titles = [entry['title'] for entry in response.data]
        self.assertNotIn('Private Entry', entry_titles)
        self.assertIn('Public Entry in Private Journal', entry_titles)
    
    # Sort entries by word count (valid)
    def test_sort_entries_by_word_count(self):
        """Test sorting entries by word count"""
        self.client.force_authenticate(user=self.user1)
        
        # Add entries with varying word counts
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Short Entry',
            content='Few words.'
        )
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Long Entry',
            content='This entry has many more words than the short entry. It should have the highest word count of all entries in the test.'
        )
        
        # Get all entries
        response = self.client.get(self.journal_entries_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Get entries from the journal detail endpoint with word_count ordering
        journal_detail_url = reverse('journal-detail', kwargs={'pk': self.private_journal.pk})
        entries_url = f"{journal_detail_url}entries/?ordering=word_count"
        response = self.client.get(entries_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if entries are sorted by word count
        # Note: Since word_count is a property and ordering is done in the view,
        # we need to check if the entries are correctly sorted in the response
        word_counts = [entry['word_count'] for entry in response.data]
        self.assertEqual(word_counts, sorted(word_counts))
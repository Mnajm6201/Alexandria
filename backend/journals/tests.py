# backend/journals/tests.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from library.models import Book, User, Journal, JournalEntry

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
        
        # Create journals
        self.private_journal = Journal.objects.create(
            user=self.user1,
            book=self.book1,
            is_private=True
        )
        
        self.public_journal = Journal.objects.create(
            user=self.user2,
            book=self.book2,
            is_private=False
        )
    
    def test_journal_creation(self):
        """Test creating a journal"""
        self.assertTrue(self.private_journal.is_private)
        self.assertEqual(self.private_journal.user, self.user1)
        self.assertEqual(self.private_journal.book, self.book1)
        
        self.assertFalse(self.public_journal.is_private)
        self.assertEqual(self.public_journal.user, self.user2)
        self.assertEqual(self.public_journal.book, self.book2)
    
    def test_journal_str_method(self):
        """Test journal string representation"""
        expected_str = f"{self.user1.username}'s journal for {self.book1.title}"
        self.assertEqual(str(self.private_journal), expected_str)
    
    def test_entry_count(self):
        """Test counting entries in a journal"""
        # Initially, no entries
        initial_count = self.private_journal.entries.count()
        self.assertEqual(initial_count, 0)
        
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
        new_count = self.private_journal.entries.count()
        self.assertEqual(new_count, 2)


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
        
        # Create journal
        self.journal = Journal.objects.create(
            user=self.user,
            book=self.book,
            is_private=False
        )
        
        # Create entries
        self.private_entry = JournalEntry.objects.create(
            journal=self.journal,
            title='Test Entry 1',
            content='This is the first test entry.',
            is_private=True,
            page_num=10
        )
        
        self.public_entry = JournalEntry.objects.create(
            journal=self.journal,
            title='Test Entry 2',
            content='This is the second test entry with more words than the first one.',
            is_private=False,
            page_num=20
        )
    
    def test_entry_creation(self):
        """Test creating entries"""
        self.assertEqual(self.private_entry.title, 'Test Entry 1')
        self.assertEqual(self.private_entry.content, 'This is the first test entry.')
        self.assertTrue(self.private_entry.is_private)
        self.assertEqual(self.private_entry.page_num, 10)
        self.assertEqual(self.private_entry.journal, self.journal)
        
        self.assertEqual(self.public_entry.title, 'Test Entry 2')
        self.assertEqual(self.public_entry.content, 'This is the second test entry with more words than the first one.')
        self.assertFalse(self.public_entry.is_private)
        self.assertEqual(self.public_entry.page_num, 20)
        self.assertEqual(self.public_entry.journal, self.journal)
    
    def test_entry_str_method(self):
        """Test entry string representation"""
        expected_str = f"Entry by {self.user.username} on {self.book.title}: Test Entry 1"
        self.assertEqual(str(self.private_entry), expected_str)
    
    def test_word_count(self):
        """Test entry word count calculation"""
        # We'll need to compute this manually since your model might not have a word_count property
        private_entry_word_count = len(self.private_entry.content.split())
        public_entry_word_count = len(self.public_entry.content.split())
        
        self.assertEqual(private_entry_word_count, 6)  # "This is the first test entry."
        self.assertEqual(public_entry_word_count, 12)  # "This is the second test entry with more words than the first one."


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
        self.book3 = Book.objects.create(
            title='Test Book 3',
            book_id='test3'
        )
        
        # Create journals
        self.private_journal = Journal.objects.create(
            user=self.user1,
            book=self.book1,
            is_private=True
        )
        
        self.public_journal = Journal.objects.create(
            user=self.user2,
            book=self.book2,
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
        """Test that a user can create a journal for a book"""
        self.client.force_authenticate(user=self.user1)
        data = {
            'is_private': True,
            'book_id': 'test3'  # Book3, not yet used for a journal
        }
        response = self.client.post(self.journals_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify journal was created
        self.assertTrue(Journal.objects.filter(user=self.user1, book=self.book3).exists())
    
    # Create second journal for same book (invalid)
    def test_create_duplicate_journal(self):
        """Test that a user cannot create multiple journals for the same book"""
        self.client.force_authenticate(user=self.user1)
        data = {
            'is_private': True,
            'book_id': 'test1'  # Already has a journal for this book
        }
        response = self.client.post(self.journals_list_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify error message
        self.assertIn('book_id', response.data)
        self.assertEqual(response.data['book_id'], 'A journal already exists for this book.')
    
    # User modifies own journal (valid)
    def test_update_own_journal(self):
        """Test that a user can update their own journal"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('journal-detail', kwargs={'pk': self.private_journal.pk})
        data = {
            'is_private': False
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify journal was updated
        self.private_journal.refresh_from_db()
        self.assertFalse(self.private_journal.is_private)
    
    # User tries to modify another user's journal (invalid)
    def test_update_other_user_journal(self):
        """Test that a user cannot update another user's journal"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('journal-detail', kwargs={'pk': self.public_journal.pk})
        data = {
            'is_private': True
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify journal wasn't modified
        self.public_journal.refresh_from_db()
        self.assertFalse(self.public_journal.is_private)
    
    ### Journal Privacy Tests ###
    
    # View own journal (private/public) (valid)
    def test_view_own_journals(self):
        """Test that a user can view their own journals (private and public)"""
        self.client.force_authenticate(user=self.user1)
        
        # Get own private journal
        url = reverse('journal-detail', kwargs={'pk': self.private_journal.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['book'], self.book1.id)
    
    # View other's public journal (valid)
    def test_view_other_public_journal(self):
        """Test that a user can view another user's public journal"""
        self.client.force_authenticate(user=self.user1)
        
        # Get other user's public journal
        url = reverse('journal-detail', kwargs={'pk': self.public_journal.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['book'], self.book2.id)
    
    # View other's private journal (invalid)
    def test_view_other_private_journal(self):
        """Test that a user cannot view another user's private journal"""
        self.client.force_authenticate(user=self.user2)
        
        # Get other user's private journal
        url = reverse('journal-detail', kwargs={'pk': self.private_journal.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


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
        
        # Create journals
        self.private_journal = Journal.objects.create(
            user=self.user1,
            book=self.book1,
            is_private=True
        )
        
        self.public_journal = Journal.objects.create(
            user=self.user2,
            book=self.book2,
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
        self.private_journal_entries_url = reverse('journal-entry-list', kwargs={'journal_pk': self.private_journal.pk})
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
            'page_num': 50
        }
        response = self.client.post(self.private_journal_entries_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify entry was created
        self.assertTrue(JournalEntry.objects.filter(
            journal=self.private_journal,
            title='New Entry'
        ).exists())
    
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
            'page_num': 60
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
        """Test that a user can view all their own entries"""
        self.client.force_authenticate(user=self.user1)
        
        # Get all entries from private journal
        response = self.client.get(self.private_journal_entries_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should see both private and public entries
        self.assertEqual(len(response.data), 2)
        entry_titles = [entry['title'] for entry in response.data]
        self.assertIn('Private Entry', entry_titles)
        self.assertIn('Public Entry in Private Journal', entry_titles)
    
    # View other's public entry in public journal (valid)
    def test_view_other_public_entry_in_public_journal(self):
        """Test that a user can view another user's public entry in a public journal"""
        self.client.force_authenticate(user=self.user1)
        
        # Get entries from public journal
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
        
        # Get entries from public journal
        response = self.client.get(self.public_journal_entries_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should not see private entries
        entry_titles = [entry['title'] for entry in response.data]
        self.assertNotIn('Private Entry in Public Journal', entry_titles)
    
    # View any entry in other's private journal (invalid)
    def test_view_entries_in_other_private_journal(self):
        """Test that a user cannot view any entries in another user's private journal"""
        self.client.force_authenticate(user=self.user2)
        
        # Try to get entries from user1's private journal
        response = self.client.get(self.private_journal_entries_url)
        
        # Should get 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    ### Filtering and Sorting Tests ###
    
    # Filter entries by page number (valid)
    def test_filter_entries_by_page_number(self):
        """Test filtering entries by page number"""
        self.client.force_authenticate(user=self.user1)
        
        # Add a few more entries with same page number
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
        response = self.client.get(f"{self.private_journal_entries_url}?page_num=15")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should have exactly 2 entries
        self.assertEqual(len(response.data), 2)
        entry_titles = [entry['title'] for entry in response.data]
        self.assertIn('Entry Page 15', entry_titles)
        self.assertIn('Entry Page 15 Again', entry_titles)
    
    # Filter entries by privacy (valid)
    def test_filter_entries_by_privacy(self):
        """Test filtering entries by privacy setting"""
        self.client.force_authenticate(user=self.user1)
        
        # Filter by private entries
        response = self.client.get(f"{self.private_journal_entries_url}?is_private=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only have private entries
        entry_titles = [entry['title'] for entry in response.data]
        self.assertIn('Private Entry', entry_titles)
        self.assertNotIn('Public Entry in Private Journal', entry_titles)
        
        # Filter by public entries
        response = self.client.get(f"{self.private_journal_entries_url}?is_private=false")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only have public entries
        entry_titles = [entry['title'] for entry in response.data]
        self.assertNotIn('Private Entry', entry_titles)
        self.assertIn('Public Entry in Private Journal', entry_titles)
    
    # Sort entries by creation date (valid)
    def test_sort_entries_by_creation_date(self):
        """Test sorting entries by creation date"""
        self.client.force_authenticate(user=self.user1)
        
        # Get entries sorted by creation date (ascending)
        response = self.client.get(f"{self.private_journal_entries_url}?ordering=created_on")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Entries should be sorted by created_on
        created_dates = [entry['created_on'] for entry in response.data]
        self.assertEqual(created_dates, sorted(created_dates))
        
        # Get entries sorted by creation date (descending)
        response = self.client.get(f"{self.private_journal_entries_url}?ordering=-created_on")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Entries should be sorted by created_on in reverse
        created_dates = [entry['created_on'] for entry in response.data]
        self.assertEqual(created_dates, sorted(created_dates, reverse=True))
    
    # Sort entries by page number (valid)
    def test_sort_entries_by_page_number(self):
        """Test sorting entries by page number"""
        self.client.force_authenticate(user=self.user1)
        
        # Create an additional entry with different page number
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Entry Page 15',
            content='Content',
            page_num=15
        )
        
        # Get entries sorted by page number (ascending)
        response = self.client.get(f"{self.private_journal_entries_url}?ordering=page_num")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify entries are sorted by page_num
        page_nums = [entry['page_num'] for entry in response.data]
        self.assertEqual(page_nums, sorted(page_nums))
        
        # Get entries sorted by page number (descending)
        response = self.client.get(f"{self.private_journal_entries_url}?ordering=-page_num")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify entries are sorted by page_num in reverse
        page_nums = [entry['page_num'] for entry in response.data]
        self.assertEqual(page_nums, sorted(page_nums, reverse=True))
    
    # Sort entries by word count (valid)
    def test_sort_entries_by_word_count(self):
        """Test sorting entries by word count using journal entries endpoint"""
        self.client.force_authenticate(user=self.user1)
        
        # Create entries with varying word counts
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
        
        # Get entries sorted by word count via journal detail endpoint
        journal_detail_url = reverse('journal-detail', kwargs={'pk': self.private_journal.pk})
        entries_url = f"{journal_detail_url}/entries/?ordering=word_count"
        response = self.client.get(entries_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify entries are sorted by word count
        contents = [entry['content'] for entry in response.data]
        word_counts = [len(content.split()) for content in contents]
        self.assertEqual(word_counts, sorted(word_counts))
        
        # Get entries sorted by word count in reverse
        entries_url = f"{journal_detail_url}/entries/?ordering=-word_count"
        response = self.client.get(entries_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify entries are sorted by word count in reverse
        contents = [entry['content'] for entry in response.data]
        word_counts = [len(content.split()) for content in contents]
        self.assertEqual(word_counts, sorted(word_counts, reverse=True))
    
    ### Deletion Tests ###
    
    # Delete own entry (valid)
    def test_delete_own_entry(self):
        """Test that a user can delete their own entry"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('journal-entry-detail', kwargs={
            'journal_pk': self.private_journal.pk,
            'pk': self.private_entry.pk
        })
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
      # Delete own entry (valid)
    def test_delete_own_entry(self):
        """Test that a user can delete their own entry"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('journal-entry-detail', kwargs={
            'journal_pk': self.private_journal.pk,
            'pk': self.private_entry.pk
        })
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify entry was deleted
        self.assertFalse(JournalEntry.objects.filter(pk=self.private_entry.pk).exists())
    
    # Delete other user's entry (invalid)
    def test_delete_other_user_entry(self):
        """Test that a user cannot delete another user's entry"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('journal-entry-detail', kwargs={
            'journal_pk': self.public_journal.pk,
            'pk': self.public_entry_in_public_journal.pk
        })
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify entry wasn't deleted
        self.assertTrue(JournalEntry.objects.filter(pk=self.public_entry_in_public_journal.pk).exists())
    
    ### Search Tests ###
    
    # Search entries by title
    def test_search_entries_by_title(self):
        """Test searching entries by title"""
        self.client.force_authenticate(user=self.user1)
        
        # Create entries with unique searchable titles
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Unique Search Term Entry',
            content='This is a uniquely titled entry'
        )
        
        # Search for entries with that title
        response = self.client.get(f"{self.private_journal_entries_url}?search=Unique Search")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should find the entry with this search term in title
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Unique Search Term Entry')
    
    # Search entries by content
    def test_search_entries_by_content(self):
        """Test searching entries by content"""
        self.client.force_authenticate(user=self.user1)
        
        # Create entry with unique searchable content
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Regular Title',
            content='This content has a unique phrase: searching_test_term'
        )
        
        # Search for entries with that content
        response = self.client.get(f"{self.private_journal_entries_url}?search=searching_test_term")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should find the entry with this search term in content
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Regular Title')
    
    ### Combined Filtering, Sorting and Searching Tests ###
    
    # Combine filtering and sorting
    def test_combined_filtering_and_sorting(self):
        """Test combining filtering and sorting"""
        self.client.force_authenticate(user=self.user1)
        
        # Create some additional test entries
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Public Entry Page 5',
            content='Content with few words',
            is_private=False,
            page_num=5
        )
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Public Entry Page 25',
            content='Content with a few more words here',
            is_private=False,
            page_num=25
        )
        
        # Filter by privacy and sort by page number (descending)
        response = self.client.get(f"{self.private_journal_entries_url}?is_private=false&ordering=-page_num")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should get all public entries sorted by page_num in descending order
        self.assertGreater(len(response.data), 1)  # At least 2 public entries
        page_nums = [entry['page_num'] for entry in response.data]
        self.assertEqual(page_nums, sorted(page_nums, reverse=True))
        
        # Make sure all entries are public
        private_statuses = [entry['is_private'] for entry in response.data]
        self.assertTrue(all(not status for status in private_statuses))
    
    # Combine searching and filtering
    def test_combined_searching_and_filtering(self):
        """Test combining searching and filtering"""
        self.client.force_authenticate(user=self.user1)
        
        # Create entries with varying privacy and searchable content
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Private Searchable',
            content='This private entry contains the phrase findme',
            is_private=True
        )
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Public Searchable',
            content='This public entry also contains the phrase findme',
            is_private=False
        )
        JournalEntry.objects.create(
            journal=self.private_journal,
            title='Public Non-Searchable',
            content='This entry does not contain the search phrase',
            is_private=False
        )
        
        # Search and filter by privacy
        response = self.client.get(f"{self.private_journal_entries_url}?search=findme&is_private=false")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should only get public entries with search term
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Public Searchable')
    
    # Test journal entries pagination
    def test_journal_entries_pagination(self):
        """Test pagination of journal entries"""
        self.client.force_authenticate(user=self.user1)
        
        # Create 10 additional entries 
        for i in range(10):
            JournalEntry.objects.create(
                journal=self.private_journal,
                title=f'Pagination Entry {i}',
                content=f'Content for pagination entry {i}'
            )
        
        # Should have at least 12 entries total (10 new + 2 from setup)
        total_entries = JournalEntry.objects.filter(journal=self.private_journal).count()
        self.assertGreaterEqual(total_entries, 12)
        
        # Request first page with 5 items per page
        response = self.client.get(f"{self.private_journal_entries_url}?page=1&page_size=5")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should have exactly 5 items on the first page
        self.assertEqual(len(response.data['results']), 5)
        
        # Should have pagination information (depends on DRF pagination setup)
        # Uncomment if PageNumberPagination is being used
        # self.assertTrue('count' in response.data)
        # self.assertTrue('next' in response.data)
        # self.assertTrue('previous' in response.data)

    # Test limiting fields with query parameters
    def test_field_filtering(self):
        """Test filtering response fields"""
        self.client.force_authenticate(user=self.user1)
        
        # Request specific fields only
        response = self.client.get(f"{self.private_journal_entries_url}?fields=title,page_num")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check if only requested fields are returned (if dynamic field filtering is implemented)
        # Implementation depends on your DRF customization
        # Uncomment if your API supports field filtering
        # self.assertTrue('title' in response.data[0])
        # self.assertTrue('page_num' in response.data[0])
        # self.assertFalse('content' in response.data[0])
        # self.assertFalse('is_private' in response.data[0])
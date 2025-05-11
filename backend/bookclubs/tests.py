from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from library.models import (
    Book, BookClub, ClubMember, User, 
    BookClubHistory, Announcement, ReadingSchedule, ScheduleMilestone
)
from datetime import date, timedelta

class BookClubListAPITest(APITestCase):
    def setUp(self):
        # Create users
        self.user1 = User.objects.create_user(username="user1", password="password")
        self.user2 = User.objects.create_user(username="user2", password="password")
        
        # Create books
        self.book1 = Book.objects.create(title="Book 1", book_id="book1")
        self.book2 = Book.objects.create(title="Book 2", book_id="book2")
        
        # Create clubs
        self.public_club = BookClub.objects.create(
            name="Public Club",
            club_desc="A public club",
            is_private=False,
            book=self.book1
        )
        
        self.private_club = BookClub.objects.create(
            name="Private Club",
            club_desc="A private club",
            is_private=True,
            book=self.book2
        )
        
        # Add memberships
        ClubMember.objects.create(club=self.public_club, user=self.user1, is_admin=True)
        ClubMember.objects.create(club=self.private_club, user=self.user1, is_admin=True)
    
    def test_list_clubs_authenticated(self):
        """Test that authenticated users can list clubs they have access to"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('bookclubs:club-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # User1 can see both clubs
        
        # Test with user2 (should only see public club)
        self.client.force_authenticate(user=self.user2)
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # User2 can only see public club
    
    def test_list_clubs_unauthenticated(self):
        """Test that unauthenticated users can't list clubs"""
        url = reverse('bookclubs:club-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class BookClubDetailAPITest(APITestCase):
    def setUp(self):
        # Create similar setup as above
        self.user1 = User.objects.create_user(username="user1", password="password")
        self.user2 = User.objects.create_user(username="user2", password="password")
        
        self.book = Book.objects.create(title="Test Book", book_id="test123")
        self.previous_book = Book.objects.create(title="Previous Book", book_id="prev123")
        
        self.club = BookClub.objects.create(
            name="Test Club",
            club_desc="A test club",
            is_private=False,
            book=self.book,
            about_content="Detailed description"
        )
        
        # Add members
        self.membership1 = ClubMember.objects.create(
            club=self.club,
            user=self.user1,
            is_admin=True,
            reading_status='Reading',
            current_page=50
        )
        
        # Add reading history
        self.history = BookClubHistory.objects.create(
            club=self.club,
            book=self.previous_book,
            start_date=date.today() - timedelta(days=60),
            end_date=date.today() - timedelta(days=30),
            club_rating=4.5,
            order=1
        )
        
        # Add announcements
        self.announcement = Announcement.objects.create(
            club=self.club,
            title="Test Announcement",
            content="This is a test announcement",
            created_by=self.user1,
            is_pinned=True
        )
        
        # Add reading schedule
        self.schedule = ReadingSchedule.objects.create(
            club=self.club,
            book=self.book,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            is_active=True
        )
        
        # Add schedule milestones
        self.milestone = ScheduleMilestone.objects.create(
            schedule=self.schedule,
            title="Chapters 1-5",
            target_date=date.today() + timedelta(days=10),
            page_start=1,
            page_end=50
        )
    
    def test_club_detail(self):
        """Test viewing club details"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('bookclubs:club-detail', kwargs={'pk': self.club.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Test Club")
        
        # Check that the response includes new features
        self.assertIn('about_content', response.data)
        self.assertIn('reading_history', response.data)
        self.assertIn('announcements', response.data)
        self.assertIn('reading_schedules', response.data)
        
        # Check specific data
        self.assertEqual(response.data['about_content'], "Detailed description")
        self.assertEqual(len(response.data['reading_history']), 1)
        self.assertEqual(len(response.data['announcements']), 1)
        self.assertIsNotNone(response.data['reading_schedules'])

class BookClubHistoryAPITest(APITestCase):
    """Test the BookClubHistory API endpoints"""
    
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(username="historyuser", password="password")
        self.non_member = User.objects.create_user(username="nonmember", password="password")
        
        # Create books
        self.current_book = Book.objects.create(title="Current Book", book_id="current123")
        self.previous_book1 = Book.objects.create(title="Previous Book 1", book_id="prev123")
        self.previous_book2 = Book.objects.create(title="Previous Book 2", book_id="prev456")
        
        # Create book club
        self.club = BookClub.objects.create(
            name="History Test Club",
            club_desc="Testing history",
            is_private=False,
            book=self.current_book
        )
        
        # Add membership
        self.membership = ClubMember.objects.create(
            club=self.club,
            user=self.user,
            is_admin=True
        )
        
        # Add reading history entries
        self.history1 = BookClubHistory.objects.create(
            club=self.club,
            book=self.previous_book1,
            start_date=date.today() - timedelta(days=90),
            end_date=date.today() - timedelta(days=60),
            club_rating=4.5,
            order=1
        )
        
        self.history2 = BookClubHistory.objects.create(
            club=self.club,
            book=self.previous_book2,
            start_date=date.today() - timedelta(days=150),
            end_date=date.today() - timedelta(days=120),
            club_rating=3.8,
            order=2
        )
    
    def test_list_club_history(self):
        """Test listing a club's reading history"""
        self.client.force_authenticate(user=self.user)
        url = reverse('bookclubs:club-history', kwargs={'club_id': self.club.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that both history entries are returned
        self.assertEqual(len(response.data), 2)
        
        # Verify the order (most recent first)
        self.assertEqual(response.data[0]['book'], self.previous_book1.id)
        self.assertEqual(response.data[1]['book'], self.previous_book2.id)
        
        # Check that book details are included
        self.assertIn('book_details', response.data[0])
        self.assertEqual(response.data[0]['book_details']['title'], 'Previous Book 1')
    
    def test_non_member_can_view_public_club_history(self):
        """Test that non-members can view history of public clubs"""
        self.client.force_authenticate(user=self.non_member)
        url = reverse('bookclubs:club-history', kwargs={'club_id': self.club.id})
        response = self.client.get(url)
        
        # Since the club is public, non-members should be able to view
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_unauthenticated_user_cannot_view_history(self):
        """Test that unauthenticated users cannot view history"""
        url = reverse('bookclubs:club-history', kwargs={'club_id': self.club.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AnnouncementAPITest(APITestCase):
    """Test the Announcement API endpoints"""
    
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(username="adminuser", password="password")
        self.regular_user = User.objects.create_user(username="regularuser", password="password")
        
        # Create book and club
        self.book = Book.objects.create(title="Announcement Book", book_id="announce123")
        self.club = BookClub.objects.create(
            name="Announcement Club",
            club_desc="Testing announcements",
            is_private=False,
            book=self.book
        )
        
        # Add memberships
        self.admin_membership = ClubMember.objects.create(
            club=self.club,
            user=self.admin_user,
            is_admin=True
        )
        
        self.regular_membership = ClubMember.objects.create(
            club=self.club,
            user=self.regular_user,
            is_admin=False
        )
        
        # Create announcements
        self.pinned_announcement = Announcement.objects.create(
            club=self.club,
            title="Pinned Announcement",
            content="This is a pinned announcement",
            created_by=self.admin_user,
            is_pinned=True
        )
        
        self.regular_announcement = Announcement.objects.create(
            club=self.club,
            title="Regular Announcement",
            content="This is a regular announcement",
            created_by=self.admin_user,
            is_pinned=False
        )
    
    def test_list_announcements(self):
        """Test listing club announcements"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('bookclubs:club-announcements', kwargs={'club_id': self.club.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Check that pinned announcements come first
        self.assertEqual(response.data[0]['title'], 'Pinned Announcement')
        self.assertEqual(response.data[1]['title'], 'Regular Announcement')
        
        # Check announcement details
        self.assertEqual(response.data[0]['created_by'], self.admin_user.id)
        self.assertEqual(response.data[0]['created_by_username'], self.admin_user.username)
        self.assertTrue(response.data[0]['is_pinned'])
    
    def test_create_announcement_admin(self):
        """Test that admins can create announcements"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('bookclubs:club-announcement-create', kwargs={'club_id': self.club.id})
        data = {
            'title': 'New Announcement',
            'content': 'This is a new test announcement',
            'is_pinned': True
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the announcement was created
        self.assertEqual(Announcement.objects.count(), 3)
        
        # Check the new announcement details
        new_announcement = Announcement.objects.get(title='New Announcement')
        self.assertEqual(new_announcement.content, 'This is a new test announcement')
        self.assertEqual(new_announcement.created_by, self.admin_user)
        self.assertTrue(new_announcement.is_pinned)
    
    def test_create_announcement_regular_user(self):
        """Test that regular users cannot create announcements"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('bookclubs:club-announcement-create', kwargs={'club_id': self.club.id})
        data = {
            'title': 'Unauthorized Announcement',
            'content': 'This should not be allowed',
            'is_pinned': False
        }
        
        response = self.client.post(url, data, format='json')
        
        # Regular users should not be able to create announcements
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify no announcement was created
        self.assertEqual(Announcement.objects.count(), 2)


class ReadingScheduleAPITest(APITestCase):
    """Test the ReadingSchedule API endpoints"""
    
    def setUp(self):
        # Create users
        self.admin_user = User.objects.create_user(username="adminuser", password="password")
        self.regular_user = User.objects.create_user(username="regularuser", password="password")
        
        # Create books
        self.current_book = Book.objects.create(title="Schedule Book", book_id="schedule123")
        self.next_book = Book.objects.create(title="Next Book", book_id="next123")
        
        # Create book club
        self.club = BookClub.objects.create(
            name="Schedule Club",
            club_desc="Testing schedules",
            is_private=False,
            book=self.current_book
        )
        
        # Add memberships
        self.admin_membership = ClubMember.objects.create(
            club=self.club,
            user=self.admin_user,
            is_admin=True
        )
        
        self.regular_membership = ClubMember.objects.create(
            club=self.club,
            user=self.regular_user,
            is_admin=False
        )
        
        # Create reading schedule
        self.active_schedule = ReadingSchedule.objects.create(
            club=self.club,
            book=self.current_book,
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            is_active=True
        )
        
        # Create milestones
        self.milestone1 = ScheduleMilestone.objects.create(
            schedule=self.active_schedule,
            title="Chapters 1-5",
            target_date=date.today() + timedelta(days=10),
            page_start=1,
            page_end=50,
            chapter_start="1",
            chapter_end="5"
        )
        
        self.milestone2 = ScheduleMilestone.objects.create(
            schedule=self.active_schedule,
            title="Chapters 6-10",
            target_date=date.today() + timedelta(days=20),
            page_start=51,
            page_end=100,
            chapter_start="6",
            chapter_end="10"
        )
    
    def test_list_schedules(self):
        """Test listing reading schedules"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('bookclubs:club-schedules', kwargs={'club_id': self.club.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        
        # Check schedule details
        self.assertEqual(response.data[0]['book'], self.current_book.id)
        self.assertTrue(response.data[0]['is_active'])
        
        # Check book details
        self.assertIn('book_details', response.data[0])
        self.assertEqual(response.data[0]['book_details']['title'], 'Schedule Book')
    
    def test_create_schedule_admin(self):
        """Test that admins can create reading schedules"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('bookclubs:club-schedule-create', kwargs={'club_id': self.club.id})
        
        # Create a new schedule for the next book
        data = {
            'book': self.next_book.id,
            'start_date': (date.today() + timedelta(days=31)).isoformat(),
            'end_date': (date.today() + timedelta(days=60)).isoformat(),
            'is_active': True
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the schedule was created
        self.assertEqual(ReadingSchedule.objects.count(), 2)
        
        # Check that the old schedule is now inactive
        self.active_schedule.refresh_from_db()
        self.assertFalse(self.active_schedule.is_active)
        
        # Check the new schedule is active
        new_schedule = ReadingSchedule.objects.get(book=self.next_book)
        self.assertTrue(new_schedule.is_active)
    
    def test_create_schedule_regular_user(self):
        """Test that regular users cannot create reading schedules"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('bookclubs:club-schedule-create', kwargs={'club_id': self.club.id})
        
        data = {
            'book': self.next_book.id,
            'start_date': (date.today() + timedelta(days=31)).isoformat(),
            'end_date': (date.today() + timedelta(days=60)).isoformat(),
            'is_active': True
        }
        
        response = self.client.post(url, data, format='json')
        
        # Regular users should not be able to create schedules
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Verify no new schedule was created
        self.assertEqual(ReadingSchedule.objects.count(), 1)
    
    def test_list_schedule_milestones(self):
        """Test listing schedule milestones"""
        self.client.force_authenticate(user=self.regular_user)
        url = reverse('bookclubs:schedule-milestones', kwargs={
            'club_id': self.club.id,
            'schedule_id': self.active_schedule.id
        })
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        # Check milestone details
        self.assertEqual(response.data[0]['title'], 'Chapters 1-5')
        self.assertEqual(response.data[1]['title'], 'Chapters 6-10')
        
        # Check page ranges
        self.assertEqual(response.data[0]['page_start'], 1)
        self.assertEqual(response.data[0]['page_end'], 50)
        self.assertEqual(response.data[1]['page_start'], 51)
        self.assertEqual(response.data[1]['page_end'], 100)


class MemberProgressAPITest(APITestCase):
    """Test the member progress API endpoints"""
    
    def setUp(self):
        # Create users
        self.user = User.objects.create_user(username="progressuser", password="password")
        self.other_user = User.objects.create_user(username="otheruser", password="password")
        self.non_member = User.objects.create_user(username="nonmember", password="password")
        
        # Create book and club
        self.book = Book.objects.create(title="Progress Book", book_id="progress123")
        self.club = BookClub.objects.create(
            name="Progress Club",
            club_desc="Testing progress",
            is_private=False,
            book=self.book
        )
        
        # Add memberships
        self.membership = ClubMember.objects.create(
            club=self.club,
            user=self.user,
            is_admin=True,
            reading_status='Reading',
            current_page=50
        )
        
        self.other_membership = ClubMember.objects.create(
            club=self.club,
            user=self.other_user,
            is_admin=False,
            reading_status='Not Started',
            current_page=0
        )
    
    def test_get_member_progress(self):
        """Test getting a member's reading progress"""
        self.client.force_authenticate(user=self.user)
        url = reverse('bookclubs:member-progress', kwargs={'club_id': self.club.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reading_status'], 'Reading')
        self.assertEqual(response.data['current_page'], 50)
    
    def test_update_member_progress(self):
        """Test updating a member's reading progress"""
        self.client.force_authenticate(user=self.user)
        url = reverse('bookclubs:update-member-progress', kwargs={'club_id': self.club.id})
        
        data = {
            'reading_status': 'Completed',
            'current_page': 300
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reading_status'], 'Completed')
        self.assertEqual(response.data['current_page'], 300)
        
        # Verify database was updated
        self.membership.refresh_from_db()
        self.assertEqual(self.membership.reading_status, 'Completed')
        self.assertEqual(self.membership.current_page, 300)
    
    def test_update_with_invalid_status(self):
        """Test updating with an invalid status (should be ignored)"""
        self.client.force_authenticate(user=self.user)
        url = reverse('bookclubs:update-member-progress', kwargs={'club_id': self.club.id})
        
        data = {
            'reading_status': 'Invalid Status',
            'current_page': 200
        }
        
        response = self.client.post(url, data, format='json')
        
        # Should succeed but not update reading status
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['reading_status'], 'Reading')  # Unchanged
        self.assertEqual(response.data['current_page'], 200)  # Updated
        
        # Verify database was partially updated
        self.membership.refresh_from_db()
        self.assertEqual(self.membership.reading_status, 'Reading')
        self.assertEqual(self.membership.current_page, 200)
    
    def test_non_member_access(self):
        """Test that non-members cannot access progress endpoints"""
        self.client.force_authenticate(user=self.non_member)
        
        # Try to get progress
        url = reverse('bookclubs:member-progress', kwargs={'club_id': self.club.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Try to update progress
        url = reverse('bookclubs:update-member-progress', kwargs={'club_id': self.club.id})
        data = {'reading_status': 'Reading', 'current_page': 10}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
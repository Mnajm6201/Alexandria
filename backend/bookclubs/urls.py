from django.urls import path
from . import views

app_name = 'bookclubs'

urlpatterns = [
    # Existing Book Club routes
    path('clubs/', views.BookClubListView.as_view(), name='club-list'),
    path('clubs/create/', views.BookClubCreateView.as_view(), name='club-create'),
    path('clubs/<int:pk>/', views.BookClubDetailView.as_view(), name='club-detail'),
    path('clubs/<int:pk>/update/', views.BookClubUpdateView.as_view(), name='club-update'),
    path('clubs/<int:pk>/delete/', views.BookClubDeleteView.as_view(), name='club-delete'),
    
    # Existing Membership routes
    path('clubs/<int:pk>/join/', views.JoinClubView.as_view(), name='club-join'),
    path('clubs/<int:pk>/leave/', views.LeaveClubView.as_view(), name='club-leave'),
    path('clubs/<int:club_id>/members/', views.ClubMemberView.as_view(), name='club-members'),
    
    # Existing Post routes
    path('clubs/<int:club_id>/posts/', views.ClubPostView.as_view(), name='club-posts'),
    path('clubs/<int:club_id>/posts/create/', views.ClubPostCreateView.as_view(), name='club-post-create'),
    
    # Reading history
    path('clubs/<int:club_id>/history/', views.BookClubHistoryView.as_view(), name='club-history'),
    path('clubs/<int:club_id>/history/create/', views.BookClubHistoryCreateView.as_view(), name='club-history-create'),
    
     # Announcement
    path('clubs/<int:club_id>/announcements/', views.AnnouncementListView.as_view(), name='club-announcements'),
    path('clubs/<int:club_id>/announcements/create/', views.AnnouncementCreateView.as_view(), name='club-announcement-create'),
    path('announcements/<int:pk>/update/', views.AnnouncementUpdateView.as_view(), name='announcement-update'),
    path('announcements/<int:pk>/delete/', views.AnnouncementDeleteView.as_view(), name='announcement-delete'),

    # Reading schedules
    path('clubs/<int:club_id>/schedules/', views.ReadingScheduleListView.as_view(), name='club-schedules'),
    path('clubs/<int:club_id>/schedules/create/', views.ReadingScheduleCreateView.as_view(), name='club-schedule-create'),
    path('clubs/<int:club_id>/schedules/<int:schedule_id>/milestones/', views.ScheduleMilestoneView.as_view(), name='schedule-milestones'),

    # Milestone creation
    path('clubs/<int:club_id>/schedules/<int:schedule_id>/milestones/create/', views.ScheduleMilestoneCreateView.as_view(), name='schedule-milestone-create'),
    
    # Member progress
    path('clubs/<int:club_id>/progress/', views.MemberProgressView.as_view(), name='member-progress'),
    path('clubs/<int:club_id>/progress/update/', views.UpdateMemberProgressView.as_view(), name='update-member-progress'),

    # Commenting on discussions
    path('posts/<int:post_id>/comments/', views.PostCommentsListView.as_view(), name='post-comments'),
    path('posts/<int:post_id>/comments/create/', views.PostCommentCreateView.as_view(), name='post-comment-create'),
    path('posts/<int:pk>/', views.PostDetailView.as_view(), name='post-detail'),

    # Updating club image
    path('clubs/<int:pk>/update-image/', views.BookClubImageUpdateView.as_view(), name='club-update-image'),
    
    # Liking posts or comments
    path('posts/<int:pk>/like/', views.PostLikeView.as_view(), name='post-like'),
    path('comments/<int:pk>/like/', views.CommentLikeView.as_view(), name='comment-like'),

    # Update club book - Now using class-based view
    path('clubs/<int:club_id>/update-book/', views.BookClubUpdateBookView.as_view(), name='update-club-book'),

    path('books/<str:book_id>/book-clubs/', views.BookClubsReadingBookView.as_view(), name='books-reading-book'),

    
]
from django.urls import path
from .views import (UserRegistrationView, UserProfileView, UserProfileUpdateView, UserProfilePictureUpdateView, UserDeleteView, PasswordResetRequestView, PasswordResetConfirmView, ClerkVerificationView,
                    UserPublicProfileView, UserBookProgressView, UserCurrentlyReadingView, UserBookClubsView)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

app_name = 'accounts'

urlpatterns = [
    # Clerk authentication
    path('clerk/verify/', ClerkVerificationView.as_view(), name='clerk_verify'),

    # User profile update
    path('user/profile/update/', UserProfileUpdateView.as_view(), name='profile-update'),

    # User profile pic upload
    path('user/profile/update-picture/', UserProfilePictureUpdateView.as_view(), name='update-profile-picture'),

    # User profile delete
    path('user/delete', UserDeleteView.as_view(), name='user-delete'),

    # User profiles
    path("users/<int:pk>/", UserPublicProfileView.as_view(), name="user-public-profile"),
    
    # Authentication endpoints
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),

    # Checking user books progress
    path('books/<str:book_id>/progress/', UserBookProgressView.as_view(), name='book-progress'),

    # using query parameters instead of URL path segments
    path('users/currently-reading/', UserCurrentlyReadingView.as_view(), name='user-currently-reading'),
    path('users/book-clubs/', UserBookClubsView.as_view(), name='user-book-clubs'),
    
    # Password reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
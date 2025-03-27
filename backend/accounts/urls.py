# accounts/urls.py
from django.urls import path
from .views import UserRegistrationView, UserProfileView, UserProfileUpdateView, UserDeleteView, PasswordResetRequestView, PasswordResetConfirmView, ClerkVerificationView
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

    # User profile delete
    path('user/delete', UserDeleteView.as_view(), name='user-delete'),
    
    # Authentication endpoints
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='profile'),

    # Password reset
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]



import jwt
import requests
import json
from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from .models import User, UserProfile
from library.models import ClubMember
from .utils import get_book_cover
from .serializers import (UserRegistrationSerializer, UserProfileSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
                          PublicUserSerializer)


class ClerkVerificationView(APIView):
    """
    Verifies a Clerk session token and returns JWT tokens for API authentication.
    """
    
    def post(self, request):
        print("Received verification request")
        # Get Clerk session token from request
        session_token = request.data.get('session_token')
        if not session_token:
            return Response({'error': 'No session token provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            clerk_api_key = settings.CLERK_SECRET_KEY
            print(f"Using Clerk API key (first 5 chars): {clerk_api_key[:5]}...")
            
            # Log the token (first 10 chars only for security)
            token_preview = session_token[:10] + "..." if len(session_token) > 10 else "invalid token"
            print(f"Received token (preview): {token_preview}")
            
            # Decode the JWT token to extract claims
            # We're not verifying the signature here since we'll use Clerk's API to get user data
            try:
                # Try to decode without verification first to extract the user ID
                decoded_token = jwt.decode(session_token, options={"verify_signature": False})
                print(f"Decoded token claims: {json.dumps(decoded_token)}")
                
                # Get the user ID from the 'sub' claim
                user_id = decoded_token.get('sub')
                if not user_id:
                    return Response({'error': 'No user ID in token'}, status=status.HTTP_400_BAD_REQUEST)
                
                print(f"Found user ID in token: {user_id}")
                
                # Get user details from Clerk
                headers = {
                    'Authorization': f'Bearer {clerk_api_key}',
                    'Content-Type': 'application/json'
                }
                
                # Try api.clerk.dev instead of api.clerk.com if you're getting 404 errors
                user_url = f'https://api.clerk.dev/v1/users/{user_id}'
                print(f"Getting user details from: {user_url}")
                print(f"With headers: Authorization: Bearer sk_****{clerk_api_key[-4:]}, Content-Type: {headers['Content-Type']}")
                
                user_response = requests.get(
                    user_url,
                    headers=headers
                )
                
                print(f"Clerk user API response status: {user_response.status_code}")
                
                if user_response.status_code != 200:
                    print(f"Error getting user details: {user_response.text}")
                    return Response({'error': 'Failed to get user details'}, 
                                  status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                user_data = user_response.json()
                print(f"User data retrieved successfully")
                print(f"User data: {json.dumps(user_data, indent=2)}")
                
                # Extract email from user data
                primary_email_id = user_data.get('primary_email_address_id')
                email_addresses = user_data.get('email_addresses', [])
                
                email = None
                for email_obj in email_addresses:
                    if email_obj.get('id') == primary_email_id:
                        email = email_obj.get('email_address')
                        break
                
                if not email:
                    return Response({'error': 'No email found for user'}, 
                                   status=status.HTTP_400_BAD_REQUEST)
                
                # Normalize email to prevent case-sensitivity issues
                email = email.lower().strip()
                print(f"Found user email (normalized): {email}")
                
                # Get user name
                first_name = user_data.get('first_name', '')
                last_name = user_data.get('last_name', '')
                
                try:
                    print("Explicitly checking if user exists in database...")
                    existing_user = User.objects.filter(email=email).first()
                    created = False # More dynamic when user are creating their profile
                    if existing_user:
                        print(f"Found existing user in database: id={existing_user.id}, email={existing_user.email}")
                        user = existing_user
                    else:
                        print(f"No user found in database with email: {email}")
                        
                        print("Attempting to create new user...")
                        new_user = User(
                            email=email,
                            username=email,
                            first_name=first_name,
                            last_name=last_name
                        )
                        new_user.save()
                        print(f"Created new user with id: {new_user.id}")
                        user = new_user
                        created = True
                    
                except Exception as e:
                    print(f"Database operation error: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    return Response({'error': f'Database error: {str(e)}'}, 
                                  status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                # Generate JWT
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'user_id': user.id,
                    'email': user.email,
                    'is_new_user': created 
                })
                
            except jwt.DecodeError:
                print("Failed to decode token")
                return Response({'error': 'Invalid token format'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
        except requests.exceptions.RequestException as e:
            print(f"Request exception: {str(e)}")
            return Response({'error': f'Failed to verify token: {str(e)}'}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"General exception: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'Authentication error: {str(e)}'}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'success': True,
                'user_id': user.pk,
                'username': user.username
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.related_user_profile
        serializer = UserProfileSerializer(profile)

        # checking if the email == to the username
        response_data = serializer.data

        response_data['id'] = request.user.id  # Add this line
        response_data['need_setup'] = (request.user.username == request.user.email) # boolean flag
        response_data['profile_pic'] = request.user.profile_pic
        return Response(response_data)

    def put(self, request):
        profile = request.user.related_user_profile
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# To handle the update user profile changes on the front end
class UserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]  
    
    def post(self, request):
        user = request.user
        try:
            # Add detailed debugging 
            print("Request data received:", request.data)
            
            # Get or create the profile
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Update the profile data
            if 'displayName' in request.data:
                new_username = request.data['displayName']
                print(f"Attempting to update username to: {new_username}")

                # Check if the username already exists
                if not new_username or not new_username.strip():
                    return Response({
                        'success': False,
                        'message': 'Username cannot be empty',
                        'field': 'displayName'
                    }, status=status.HTTP_400_BAD_REQUEST)

                if User.objects.exclude(id=user.id).filter(username=new_username).exists():
                    return Response({
                        'success': False,
                        'message': 'Username already taken',
                        'field': 'displayName'
                    }, status=status.HTTP_400_BAD_REQUEST)

                user.username = new_username.strip()
                user.save()
                print(f"Username updated successfully to: {user.username}")
                
            if 'bio' in request.data:
                profile.bio = request.data['bio']
                print(f"Bio updated to: {profile.bio}")
                
            if 'zipCode' in request.data:
                profile.zip_code = request.data['zipCode']
                print(f"Zip code updated to: {profile.zip_code}")
                
            if 'socialLinks' in request.data:
                profile.social_links = request.data['socialLinks']
                print(f"Social links updated to: {profile.social_links}")

            profile.save()
            print("Profile saved successfully")

            return Response({
                'success': True,
                'message': 'Profile updated successfully'
            })
            
        except Exception as e:
            # Enhanced error logging
            import traceback
            print(f"Error in profile update: {str(e)}")
            print(traceback.format_exc())
            
            return Response({
                'success': False,
                'message': str(e)
            }, status=500)


# New endpoint for user uploading their profile picture
# Backend Fix: UserProfilePictureUpdateView

class UserProfilePictureUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user

        try:
            # Enhanced logging
            print("Full request headers:", request.headers)
            print("Content-Type:", request.META.get('CONTENT_TYPE'))
            print("Request FILES:", request.FILES)
            print("Request POST data:", request.POST)

            # More robust file field checking
            profile_pic = None
            found_field_name = None
            for field_name in ['profilePicture', 'profile_picture']:
                if field_name in request.FILES:
                    profile_pic = request.FILES[field_name]
                    found_field_name = field_name
                    print(f"Found profile picture in field: {field_name}")
                    break

            if not profile_pic:
                print("No profile picture found in request.FILES")
                return Response({
                    'success': False,
                    'message': 'No profile picture provided in request. Available fields: ' + ', '.join(request.FILES.keys())
                }, status=status.HTTP_400_BAD_REQUEST)

            # Detailed file logging
            print(f"File details for {found_field_name}:")
            print(f"  Name: {profile_pic.name}")
            print(f"  Size: {profile_pic.size} bytes")
            print(f"  Content Type: {profile_pic.content_type}")

            # Validate file type and size
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            max_size = 5 * 1024 * 1024
            min_size = 1 * 1024

            if profile_pic.content_type not in allowed_types:
                print(f"Invalid file type: {profile_pic.content_type}")
                return Response({
                    'success': False,
                    'message': f'Invalid file type. Allowed types: {", ".join(allowed_types)}'
                }, status=status.HTTP_400_BAD_REQUEST)

            if profile_pic.size > max_size:
                print(f"File too large: {profile_pic.size} bytes")
                return Response({
                    'success': False,
                    'message': 'File size exceeds 5MB limit'
                }, status=status.HTTP_400_BAD_REQUEST)

            if profile_pic.size < min_size:
                print(f"File too small: {profile_pic.size} bytes")
                return Response({
                    'success': False,
                    'message': 'File is too small (minimum 1KB)'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Ensure media directory exists
            import os
            import uuid

            profile_pic_dir = os.path.join(settings.MEDIA_ROOT, "profile_pics")
            os.makedirs(profile_pic_dir, exist_ok=True)

            # Generate unique filename
            file_extension = os.path.splitext(profile_pic.name)[1]
            unique_filename = f"{user.id}_{uuid.uuid4().hex}{file_extension}"
            full_file_path = os.path.join(profile_pic_dir, unique_filename)

            # Save the file
            with open(full_file_path, 'wb+') as destination:
                for chunk in profile_pic.chunks():
                    destination.write(chunk)

            # Construct the URL 
            uploaded_file_url = f"/media/profile_pics/{unique_filename}"

            # Update user's profile picture
            user.profile_pic = uploaded_file_url
            user.save()

            print(f"Profile picture saved: {uploaded_file_url}")

            return Response({
                'success': True,
                'message': 'Profile picture updated successfully',
                'profile_pic_url': uploaded_file_url
            })
        
        except Exception as e:
            import traceback
            print(f"Error in profile picture update: {str(e)}")
            print(traceback.format_exc())
            
            return Response({
                'success': False,
                'message': f'Failed to update profile picture: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        
# User delete view
class UserDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        print("Delete request received")
        user = request.user
        try:
            user.delete()
            return Response({"success": True, "message": "Account deleted successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"success": False, "message": str(e)}, status=500)

# Public profile views
class UserPublicProfileView(generics.RetrieveAPIView):
    """
    API view for retrieving public profile information for any user.
    """
    queryset = User.objects.all()
    serializer_class = PublicUserSerializer
    permission_classes = [AllowAny]
    
    def retrieve(self, request, *args, **kwargs):
        # Get the user instance
        instance = self.get_object()
        
        # Serialize the user data
        user_serializer = self.get_serializer(instance)
        user_data = user_serializer.data
        
        try:
            profile = UserProfile.objects.get(user=instance)
            profile_serializer = UserProfileSerializer(profile)
            profile_data = profile_serializer.data
        
            response_data = {
                **user_data,
                "bio": profile_data.get("bio", ""),
                "social_links": profile_data.get("social_links", "")
            }
            
            
            response_data["stats"] = {
                "books_read": 0, 
                "average_rating": "N/A",
                "favorite_genre": "N/A"
            }
            
            response_data["recently_read"] = [] 
            response_data["book_clubs"] = []
            
            return Response(response_data)
            
        except UserProfile.DoesNotExist:
            # Return only user data if profile doesn't exist
            return Response(user_data)


# Users currently reading view
class UserCurrentlyReadingView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the user_id from query parameter or use current user
            user_id = request.query_params.get('user_id')
            
            # If no user_id provided, use the current logged-in user
            if not user_id:
                user = request.user
            else:
                # Otherwise, get the specified user
                user = get_object_or_404(User, id=user_id)
            
            # Get club memberships where user is reading
            club_members = ClubMember.objects.filter(
                user=user,
                reading_status__in=['Reading', 'started']
            ).select_related('club__book')
            
            if user.id != request.user.id:
                filtered_memberships = []
                for membership in club_members:
                    club = membership.club
    
                    if not club.is_private or ClubMember.objects.filter(club=club, user=request.user).exists():
                        filtered_memberships.append(membership)
                club_members = filtered_memberships
            
            reading_data = []
            for membership in club_members:
                if not membership.club.book:
                    continue
                    
                book = membership.club.book
                authors = ", ".join([author.name for author in book.authors.all()])
                
                book_data = {
                    "id": book.book_id,
                    "title": book.title,
                    "author": authors,
                    "cover_image": get_book_cover(book),
                    "current_page": membership.current_page,
                    "total_pages": book.primary_edition.page_count if hasattr(book, 'primary_edition') and book.primary_edition else None,
                    "progress_percentage": (
                        (membership.current_page / book.primary_edition.page_count) * 100 
                        if membership.current_page and hasattr(book, 'primary_edition') and book.primary_edition and book.primary_edition.page_count 
                        else None
                    ),
                    "last_updated": membership.last_updated if hasattr(membership, 'last_updated') else None,
                    "club": {
                        "id": membership.club.id,
                        "name": membership.club.name
                    }
                }
                reading_data.append(book_data)
                
            return Response(reading_data)
        except Exception as e:
            import traceback
            print(f"Error in UserCurrentlyReadingView: {e}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Failed to fetch currently reading: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

            
# Password reset view
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data['email']

            try:
                user = User.objects.get(email=email)

                # Generate the token
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

                # Build reset URL -- Used for front end for resetting the password
                reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

                # Send email
                send_mail(
                    'Reset your password',
                    f'Click the link to reset your password : {reset_url}',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )

                return Response({"detail": "Password reset email has been sent."})

            except User.DoesNotExist:
                # Don't reveal that user does not exist
                return Response({"detail": "Password reset email has been sent."})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # getting the uid from the request data
                uid = request.data.get('uid')
                token = serializer.validated_data['token']

                # Decode the user id
                user_id = force_str(urlsafe_base64_decode(uid))
                user = User.objects.get(pk=user_id)

                # Verify the token
                if default_token_generator.check_token(user, token):
                    # Set new password
                    user.set_password(serializer.validated_data['password'])
                    user.save()
                    return Response({"detail": "Password has been reset successfully"})

                else:
                    return Response({'error': 'Invalid Token'}, status=status.HTTP_400_BAD_REQUEST)
            except (TypeError, ValueError, OverflowError, User.DoesNotExist):
                return Response({"error": "Invalid reset link"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserBookProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, book_id):
        try:
            # Log the request
            print(f"Fetching reading progress for book_id={book_id} and user={request.user.username}")
            
            # Check if book_id format is valid
            if not book_id:
                return Response(
                    {"error": "Invalid book_id"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if user is reading this book in any club
            club_members = ClubMember.objects.filter(
                user=request.user,
                club__book__book_id=book_id
            )
            
            # Log what we found
            print(f"Found {club_members.count()} club memberships for this user and book")
            
            if not club_members.exists():
                return Response({
                    "reading": False,
                    "message": "You are not currently reading this book in any club"
                })
            
            # Get reading progress from the most recent club
            club_member = club_members.order_by('-id').first()
            
            # Safely get the total pages
            total_pages = None
            try:
                if (club_member.club and 
                    club_member.club.book and 
                    hasattr(club_member.club.book, 'primary_edition') and 
                    club_member.club.book.primary_edition):
                    total_pages = club_member.club.book.primary_edition.page_count
            except Exception as e:
                print(f"Error getting total pages: {e}")
                
            return Response({
                "reading": True,
                "current_page": club_member.current_page or 0,
                "total_pages": total_pages,
                "reading_status": club_member.reading_status,
                "club": {
                    "id": club_member.club.id,
                    "name": club_member.club.name
                }
            })
        except Exception as e:
            import traceback
            print(f"Error in UserBookProgressView for book_id={book_id}: {e}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Failed to fetch reading progress: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserBookClubsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Get user_id from query parameter or use current user
            user_id = request.query_params.get('user_id')
            
            # If no user_id provided, use the current logged-in user
            if not user_id:
                user = request.user
            else:
                # Otherwise, get the specified user
                user = get_object_or_404(User, id=user_id)
            
            # Get all clubs the specified user is a member of
            memberships = ClubMember.objects.filter(user=user).select_related('club', 'club__book')
            
            # Format the data for API response
            clubs_data = []
            for membership in memberships:
                club = membership.club
                
                # For private clubs, only include if:
                # 1. The user is viewing their own profile, OR
                # 2. The requesting user is a member of this private club
                if (club.is_private and 
                    user.id != request.user.id and 
                    not ClubMember.objects.filter(club=club, user=request.user).exists()):
                    # Skip this private club
                    continue
                    
                club_data = {
                    'id': club.id,
                    'name': club.name,
                    'description': club.club_desc,
                    'is_private': club.is_private,
                    'member_count': club.users.count(),
                    'club_image': club.club_image,
                    'joined_date': membership.join_date,
                    'is_admin': membership.is_admin,
                    'reading_status': membership.reading_status,
                    'current_page': membership.current_page
                }
                
                # Add book info if available
                if club.book:
                    book = club.book
                    authors = [author.name for author in book.authors.all()]
                    
                    club_data['book'] = {
                        'id': book.id,
                        'book_id': book.book_id,
                        'title': book.title,
                        'authors': authors,
                        'cover_url': get_book_cover(book)
                    }
                
                clubs_data.append(club_data)
            
            return Response(clubs_data)
            
        except Exception as e:
            import traceback
            print(f"Error in UserBookClubsView: {e}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Failed to fetch user book clubs: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

# Maybe goign to list it as a ticket to create a webhook for clerk and database connection that way when admin want 
# to drop an user from database clerk will also


# Testing
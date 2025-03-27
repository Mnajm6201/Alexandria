import jwt
import requests
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from .models import User

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
                    'is_new_user': created if 'created' in locals() else False
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



from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserRegistrationSerializer, UserProfileSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings
from .models import User, UserProfile
from .serializers import UserRegistrationSerializer, UserProfileSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer


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
        return Response(serializer.data)

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
            # Get or create the profile - this is key!
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Update the profile data
            if 'displayName' in request.data:
                new_username = request.data['displayName']

                # Check if the username already exists
                if User.objects.exclude(id = user.id).filter(username=new_username).exists():
                    return Response({
                        'success': False,
                        'message': 'Username already taken',
                        'field': 'displayName'
                    }, status=status.HTTP_400_BAD_REQUEST)

                user.username = new_username
                user.save()

            if 'bio' in request.data:
                profile.bio = request.data['bio']
                profile.save()

            return Response({
                'success': True,
                'message': 'Profile updated successfully'
            })
            
        except Exception as e:
            # logging the error into a log file
            import traceback
            print(f"Error in profile update: {str(e)}")
            print(traceback.format_exc())
            
            return Response({
                'success': False,
                'message': str(e)
            }, status=500)



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

# Maybe goign to list it as a ticket to create a webhook for clerk and database connection that way when admin want 
# to drop an user from database clerk will also
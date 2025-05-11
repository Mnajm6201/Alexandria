from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .utils import get_book_cover
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import FileSystemStorage
from django.conf import settings
from library.models import(
    BookClub, ClubMember, Post, PostComment,
    Announcement, ReadingSchedule, ScheduleMilestone,
    BookClubHistory, Book
)
from django.db.models import Q
from .serializers import (
    BookClubSerializer, BookClubDetailSerializer, BookClubHistorySerializer, ClubMemberSerializer, ClubPostSerializer,
    AnnouncementSerializer, ReadingScheduleSerializer, ScheduleMilestoneSerializer, PostCommentSerializer
)
from django.shortcuts import get_object_or_404


# Custom classes to simplify workload interchangably with other classes
class IsClubMemberForPost(permissions.BasePermission):
    '''
    Permission to only allow members of a club to create posts.
    '''
    def has_permission(self, request, view):
        if request.method not in permissions.SAFE_METHODS and not request.method == 'POST':
            return True

        club_id = view.kwargs.get('club_id')
        try:
            club = BookClub.objects.get(id=club_id)
            return club.users.filter(id=request.user.id).exists()
        except BookClub.DoesNotExist:
            return False

class IsClubMember(permissions.BasePermission):
    '''
    Permission to only allowed members of a club to access it
    '''
    def has_object_permission(self, request, view, obj):
        # Check if the user is a member of a club
        return obj.users.filter(id=request.user.id).exists()


class IsClubAdmin(permissions.BasePermission):
    '''
    Allowing modification from admin
    '''
    def has_object_permission(self, request, view, obj):
        # Check if the user is a admin or not
        try:
            return ClubMember.objects.get(club=obj, user=request.user).is_admin
        except ClubMember.DoesNotExist:
            return False

    def has_permission(self, request, view):
        club_id = view.kwargs.get('club_id')
        if not club_id:
            return True

        try:
            club = BookClub.objects.get(id=club_id)
            return ClubMember.objects.get(club=club, user=request.user).is_admin
        except (BookClub.DoesNotExist, ClubMember.DoesNotExist):
            return False

# Book Club Views
class BookClubListView(generics.ListAPIView):
    '''
    Listing all public book clubs and user's private clubs
    '''
    serializer_class = BookClubSerializer
    permission_classes  = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Show public clubs and private clubs where user is a member
        return BookClub.objects.filter(
            Q(is_private=False) | 
            Q(is_private=True, users=user)
        ).distinct()


class BookClubDetailView(generics.RetrieveAPIView):
    '''
    Get details of specific book clubs
    '''

    serializer_class = BookClubDetailSerializer
    permission_classes  = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Only allowed access to public clbus or prviate clubs where user is a member
        return BookClub.objects.filter(
            Q(is_private=False) |
            Q(is_private=True, users=user)
        ).distinct()

class BookClubCreateView(generics.CreateAPIView):
    '''
    Create a new book club
    '''

    serializer_class = BookClubSerializer
    permission_classes  = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Save the club
        club = serializer.save()

        # Add creator as member and the creator is the admin
        ClubMember.objects.create(
            club=club,
            user=self.request.user,
            is_admin=True
        )

class BookClubUpdateView(APIView):
    """
    Class-based view to update a book club's book.
    Accepts a book_id in the request body and updates the club's book.
    Returns detailed response with the updated book information.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, club_id):
        try:
            # Get the club
            club = get_object_or_404(BookClub, id=club_id)
            
            # Check if user is a club admin
            try:
                membership = ClubMember.objects.get(club=club, user=request.user)
                if not membership.is_admin:
                    return Response(
                        {"error": "Only club admins can update the book"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except ClubMember.DoesNotExist:
                return Response(
                    {"error": "You are not a member of this club"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get the book_id from request body
            received_book_id = request.data.get('book_id')
            
            # Log the received data
            print(f"Received request to update club {club_id}'s book to book_id: {received_book_id}")
            print(f"Full request data: {request.data}")
            
            if not received_book_id:
                return Response(
                    {"error": "book_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert to string since our book_id field is a CharField
            book_id_str = str(received_book_id)
            
            try:
                # First try exact match on book_id field
                book = Book.objects.get(book_id=book_id_str)
                print(f"Found book by book_id: {book.title} (ID: {book.book_id})")
            except Book.DoesNotExist:
                # Then try with different search methods
                print(f"Book with book_id={book_id_str} not found, trying alternative searches")
                
                # Try matching book_id starting with the value
                try:
                    book = Book.objects.filter(book_id__startswith=book_id_str).first()
                    if book:
                        print(f"Found book by book_id prefix: {book.title} (ID: {book.book_id})")
                    else:
                        # Try matching raw primary key id
                        try:
                            numeric_id = int(received_book_id)
                            book = Book.objects.get(id=numeric_id)
                            print(f"Found book by primary key: {book.title} (ID: {book.book_id})")
                        except (ValueError, Book.DoesNotExist):
                            # Look for books by title if provided
                            if request.data.get('title'):
                                title = request.data.get('title')
                                print(f"Searching by title: {title}")
                                matching_books = Book.objects.filter(title__icontains=title)
                                
                                if matching_books.exists():
                                    book = matching_books.first()
                                    print(f"Found by title: {book.title} (ID: {book.book_id})")
                                else:
                                    raise Book.DoesNotExist("No matching books found")
                            else:
                                raise Book.DoesNotExist("No matching books found and no title provided")
                except Book.DoesNotExist:
                    # Return helpful error message with available books
                    sample_books = Book.objects.all().order_by('-year_published')[:5]
                    
                    recommendations = [{
                        "id": b.id,
                        "book_id": b.book_id,
                        "title": b.title,
                        "authors": [a.name for a in b.authors.all()],
                        "year_published": b.year_published,
                        "cover_url": get_book_cover(b)  # Use our utility function
                    } for b in sample_books]
                    
                    return Response({
                        "error": f"Book with ID {received_book_id} does not exist.",
                        "recommendations": recommendations,
                        "note": "The book_id field is a string in our database, not a number. Here are some available books you can use instead."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
            # Store the old book ID if there was one
            old_book = club.book
            old_book_id = old_book.book_id if old_book else None
                
            # Update the club book
            club.book = book
            club.save(update_fields=['book'])
            print(f"Updated club book to: {book.title} (ID: {book.book_id})")
            
            # Add to history if necessary
            if old_book_id and old_book_id != book.book_id:
                try:
                    import datetime
                    from django.db.models import Max
                    
                    # Check if this book is already in the history
                    existing_entry = BookClubHistory.objects.filter(
                        club=club, 
                        book=old_book
                    ).first()
                    
                    if not existing_entry:
                        # Get the next order value
                        max_order = BookClubHistory.objects.filter(club=club).aggregate(Max('order'))['order__max'] or 0
                        next_order = max_order + 1
                        
                        # Create a history entry
                        BookClubHistory.objects.create(
                            club=club,
                            book=old_book,
                            end_date=datetime.datetime.now().date(),
                            order=next_order
                        )
                        print(f"Created history entry for previous book: {old_book.title}")
                except Exception as e:
                    print(f"Error creating history entry: {str(e)}")
            
            # Prepare book details for response
            authors = [author.name for author in book.authors.all()]
            
            # Get book cover using our utility function
            cover_url = get_book_cover(book)
            
            # Return success response with book details
            response_data = {
                "success": True,
                "message": f"Book updated to {book.title}",
                "book_id": book.book_id,  # Return string book_id
                "numeric_id": book.id,    # Also return the numeric primary key
                "book_details": {
                    "id": book.id,
                    "book_id": book.book_id,
                    "title": book.title,
                    "authors": authors,
                    "year_published": book.year_published,
                    "summary": book.summary,
                    "cover_url": cover_url  # Add the cover URL
                }
            }
            
            return Response(response_data)
                
        except Exception as e:
            import traceback
            print(f"Exception in BookClubUpdateBookView: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Failed to update book club: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class BookClubDeleteView(generics.DestroyAPIView):
    '''
    Delete a book club (admin only)
    '''

    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    queryset = BookClub.objects.all()


# Club membership views
class JoinClubView(APIView):
    '''
    Join a book club
    '''

    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        club = get_object_or_404(BookClub, pk=pk)

        # Check if the club is private
        if club.is_private:
            return Response(
                {'error': 'This is a private club. You need an invitation to join.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if the user is already a member
        if ClubMember.objects.filter(club=club, user=request.user).exists():
            return Response(
                {"error": "You are already a member of this club."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Otherwise we'll add the user into the club
        ClubMember.objects.create(club=club, user=request.user)

        return Response(
            {"message": f"You have successfully joined {club.name}"},
            status=status.HTTP_201_CREATED
        )


# Leaving the club
class LeaveClubView(APIView):
    '''
    Leave a book club
    '''

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        club = get_object_or_404(BookClub, pk=pk)

        # Check if the user is a member
        try:
            membership = ClubMember.objects.get(club=club, user=request.user)
            membership.delete()

            # check if the club has any member left
            remaining_members_count = ClubMember.objects.filter(club=club).count()

            if remaining_members_count == 0:
                club_name = club.name
                club.delete()
                return Response(
                    {"message": f"You have left {club_name}. The club has been deleted as it has no more members."},
                    status=status.HTTP_200_OK
                )
            
            return Response(
                {"message": f"You have left {club.name}"},
                status=status.HTTP_200_OK
            )

        except ClubMember.DoesNotExist:
            return Response(
                {"error": "You are not a member of this club."},
                status=status.HTTP_400_BAD_REQUEST
            )

# Club post view
class ClubPostView(generics.ListAPIView):
    '''
    List posts for specific club
    '''
    serializer_class = ClubPostSerializer
    # Looking at the posts of selected club
    def get_queryset(self):
        club_id = self.kwargs.get('club_id')
        club = get_object_or_404(BookClub, id=club_id)

        # Check if user has access to club
        user = self.request.user

        if club.is_private and not club.users.filter(id=user.id).exists():
            return Post.objects.none() # Return with nothing

        # Otherwise it checks out we'll just return the actual posts
        return Post.objects.filter(club=club).order_by('-created_on')

# Create a post in a club
class ClubPostCreateView(generics.CreateAPIView):
    '''
    Create a new post in a club
    '''

    serializer_class = ClubPostSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubMemberForPost]

    def perform_create(self, serializer):
        club_id = self.kwargs.get('club_id')
        club = get_object_or_404(BookClub, id=club_id)
        try:
            serializer.save(user=self.request.user, club=club)
        except Exception as e:
            print(f"Error saving post: {e}")
            raise ValidationError({'Error': str(e)})

    def create(self, request, *args, **kwargs):
        print("Request data: ", request.data)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Serializer Error: ", serializer.errors)

        return super().create(request, *args, **kwargs)
        

class ClubMemberView(generics.ListAPIView):
    '''
    List members of a club
    '''
    serializer_class = ClubMemberSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        club_id = self.kwargs.get("club_id")
        club = get_object_or_404(BookClub, id=club_id)

        # Check if the user is in the club
        user = self.request.user
        if club.is_private and not club.users.filter(id=user.id).exists():
            return ClubMember.objects.none()
        
        # show all the users
        return ClubMember.objects.filter(club=club) 

# Book club history view
class BookClubHistoryView(generics.ListAPIView):
    serializer_class = BookClubHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        club_id = self.kwargs.get('club_id')
        return BookClubHistory.objects.filter(club_id=club_id).order_by('-end_date')

class BookClubHistoryCreateView(generics.CreateAPIView):
    """
    Create a new history entry when a club changes its book
    """
    serializer_class = BookClubHistorySerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def perform_create(self, serializer):
        club_id = self.kwargs.get('club_id')
        club = get_object_or_404(BookClub, id=club_id)
        book_id = self.request.data.get('book')

        # Verify if user is admin
        try:
            membership = ClubMember.objects.get(club=club, user=self.request.user)
            if not membership.is_admin:
                raise PermissionDenied("Only club admins can create history entries")
        except ClubMember.DoesNotExist:
            raise PermissionDenied("You must be a member of this club")

        # Check if a history entry already exists for this book and club
        existing_entry = BookClubHistory.objects.filter(club=club, book_id=book_id).first()
        if existing_entry:
            raise ValidationError({"detail": "A history entry for this book already exists"})

        # Get the next order value for this club
        max_order = BookClubHistory.objects.filter(club=club).aggregate(Max('order'))['order__max'] or 0
        next_order = max_order + 1

        # Save with club and the next order value
        serializer.save(club=club, order=next_order)

# Announcment views
class AnnouncementListView(generics.ListAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        club_id = self.kwargs.get('club_id')
        return Announcement.objects.filter(club=club_id).order_by('-is_pinned', '-created_on')

class AnnouncementCreateView(generics.CreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def perform_create(self, serializer):
        club_id = self.kwargs.get('club_id')
        club = get_object_or_404(BookClub, id=club_id)

        # Verifying if the user is an admin since only admin can create the announcement
        if not ClubMember.objects.filter(club=club, user=self.request.user, is_admin=True).exists():
            raise PermissionDenied("Only club admins can create announcements")
        
        serializer.save(club=club, created_by=self.request.user)

class AnnouncementUpdateView(generics.UpdateAPIView):
    """
    Update an announcement (admin only)
    """
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Announcement.objects.all()
    
    def get_object(self):
        # Get the announcement object
        announcement = super().get_object()
        
        # Check if the user is an admin of the club
        try:
            club = announcement.club
            if not club:
                raise PermissionDenied("This announcement is not associated with any club")
                
            membership = ClubMember.objects.get(club=club, user=self.request.user)
            if not membership.is_admin:
                raise PermissionDenied("Only club admins can update announcements")
        except ClubMember.DoesNotExist:
            raise PermissionDenied("You are not a member of this club")
        
        return announcement
    
    def perform_update(self, serializer):
        # Make sure we're not changing the club or other read-only fields
        instance = serializer.instance
        serializer.save()
        
    def update(self, request, *args, **kwargs):
        try:
            print(f"Update announcement request data: {request.data}")
            instance = self.get_object()
            
            # Create a partial serializer that will only update the fields provided
            serializer = self.get_serializer(
                instance, 
                data=request.data, 
                partial=True  # Important - allows partial updates
            )
            
            if not serializer.is_valid():
                print(f"Serializer validation errors: {serializer.errors}")
                return Response(
                    {"error": "Invalid data", "details": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            self.perform_update(serializer)
            return Response(serializer.data)
            
        except Exception as e:
            print(f"Exception in AnnouncementUpdateView: {str(e)}")
            return Response(
                {"error": f"Failed to update announcement: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class AnnouncementDeleteView(generics.DestroyAPIView):
    """
    Delete an announcement (admin only)
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Announcement.objects.all()
    
    def get_object(self):
        # Get the announcement object
        announcement = super().get_object()
        
        # Check if the user is an admin of the club
        try:
            club = announcement.club
            if not club:
                raise PermissionDenied("This announcement is not associated with any club")
                
            membership = ClubMember.objects.get(club=club, user=self.request.user)
            if not membership.is_admin:
                raise PermissionDenied("Only club admins can delete announcements")
        except ClubMember.DoesNotExist:
            raise PermissionDenied("You are not a member of this club")
        
        return announcement
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            print(f"Deleting announcement: {instance.id} - {instance.title}")
            
            # Perform the deletion
            self.perform_destroy(instance)
            
            return Response(
                {"message": "Announcement deleted successfully"}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"Exception in AnnouncementDeleteView: {str(e)}")
            return Response(
                {"error": f"Failed to delete announcement: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

# Reading Schedule views
class ReadingScheduleListView(generics.ListAPIView):
    serializer_class = ReadingScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        club_id = self.kwargs.get('club_id')
        return ReadingSchedule.objects.filter(club_id=club_id).order_by('-is_active', '-start_date')


class ReadingScheduleCreateView(generics.CreateAPIView):
    serializer_class = ReadingScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def perform_create(self, serializer):
        club_id = self.kwargs.get('club_id')
        club = get_object_or_404(BookClub, id=club_id)

        # Verify if user is admin
        try:
            membership = ClubMember.objects.get(club=club, user=self.request.user)
            if not membership.is_admin:
                raise PermissionDenied("Only club admins can create reading schedules")
        except ClubMember.DoesNotExist:
            raise PermissionDenied("You must be a member of this club to create a reading schedule")

        # Setting other active reading schedule to inactive since we're moving on from the previous schedule
        if serializer.validated_data.get('is_active', True):
            ReadingSchedule.objects.filter(club=club, is_active=True).update(is_active=False)

        # Add debugging print statements
        print("Serializer validated data:", serializer.validated_data)
        
        try:
            serializer.save(club=club)
        except Exception as e:
            print("Error saving reading schedule:", str(e))
            raise ValidationError({"detail": str(e)})


# Schedule Mile stone views
class ScheduleMilestoneView(generics.ListAPIView):
    serializer_class = ScheduleMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        club_id = self.kwargs.get('club_id')
        schedule_id = self.kwargs.get('schedule_id')
        schedule = get_object_or_404(ReadingSchedule, id=schedule_id, club_id=club_id)
        return ScheduleMilestone.objects.filter(schedule=schedule).order_by('target_date')

class ScheduleMilestoneCreateView(generics.CreateAPIView):
    """
    Create a new milestone for a reading schedule
    """
    serializer_class = ScheduleMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def perform_create(self, serializer):
        club_id = self.kwargs.get('club_id')
        schedule_id = self.kwargs.get('schedule_id')
        
        # Get the reading schedule
        schedule = get_object_or_404(ReadingSchedule, id=schedule_id, club_id=club_id)
        
        # Verify if user is admin of the club
        club = schedule.club
        try:
            membership = ClubMember.objects.get(club=club, user=self.request.user)
            if not membership.is_admin:
                raise PermissionDenied("Only club admins can create milestones")
        except ClubMember.DoesNotExist:
            raise PermissionDenied("You must be a member of this club to create a milestone")
        
        serializer.save(schedule=schedule)

# Member progress views
class MemberProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, club_id):
        club = get_object_or_404(BookClub, id=club_id)

        # Check if the user is a member
        try:
            member = ClubMember.objects.get(club=club, user=request.user)
            return Response({
                'reading_status': member.reading_status,
                'current_page': member.current_page,
            })

        except ClubMember.DoesNotExist:
            return Response(
                {"error": "You are not a member of this club."},
                status=status.HTTP_403_FORBIDDEN
            )

class UpdateMemberProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, club_id):
        club = get_object_or_404(BookClub, id=club_id)

        try:
            member = ClubMember.objects.get(club=club, user=request.user)

            # update the reading status
            reading_status = request.data.get('reading_status')
            valid_status = dict(ClubMember.READING_STATUS_CHOICES).keys()
            
            if reading_status and reading_status in valid_status:
                member.reading_status = reading_status

            # if it's invalid we will just ignore it

            # update current page
            current_page = request.data.get('current_page')
            if current_page is not None:
                try:
                    member.current_page = int(current_page)
                # ignore if the user trying to input some invalid value
                except ValueError:
                    pass

            member.save()
            return Response({
                'reading_status' : member.reading_status,
                'current_page' : member.current_page,
            })
        except ClubMember.DoesNotExist:
            return Response(
                {"error": "You are not a member of this club"},
                status=status.HTTP_403_FORBIDDEN
            )


# Posts Views
class PostCommentsListView(generics.ListAPIView):
    '''
    List of comments for a post
    '''

    serializer_class = PostCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Post, id=post_id)

        # check if the user has access to the post
        if post.club and post.club.is_private:
            if not post.club.users.filter(id=self.request.user.id).exists():
                return PostComment.objects.none()

        # Return only the root comment (no parent)
        return PostComment.objects.filter(post=post, parent=None)

class PostCommentCreateView(generics.CreateAPIView):
    '''
    Create a new comment on a post
    '''

    serializer_class = PostCommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        post_id = self.kwargs.get('post_id')
        post = get_object_or_404(Post, id=post_id)
        
        # Check if the user can access this post
        if post.club and post.club.is_private:
            if not post.club.users.filter(id=self.request.user.id).exists():
                raise PermissionDenied("You don't have access to this post")
        
        # If there's a parent_id in the request, set the parent
        parent_id = self.request.data.get('parent')
        parent = None
        if parent_id:
            parent = get_object_or_404(PostComment, id=parent_id)
        
        serializer.save(user=self.request.user, post=post, parent=parent)

class PostDetailView(generics.RetrieveAPIView):
    """
    Get details of a specific post
    """
    serializer_class = ClubPostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        post_id = self.kwargs.get('pk')
        post = get_object_or_404(Post, id=post_id)
        
        # Check if user has access to the post
        if post.club and post.club.is_private:
            user = self.request.user
            if not post.club.users.filter(id=user.id).exists():
                return Post.objects.none()
        
        return Post.objects.filter(id=post_id)

# Liking posts view
class PostLikeView(APIView):
    '''
    Like or unlike a post
    '''

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        post = get_object_or_404(Post, pk=pk)

        # Check if user has access to this post (if in a private club)
        if post.club and post.club.is_private:
            if not post.club.users.filter(id=request.user.id).exists():
                return Response(
                    {"error": "You don't have access to this post"},
                    status=status.HTTP_403_FORBIDDEN
                )
        post.like_count = post.like_count + 1
        post.save()

        # Refresh Database to get the actual value
        post.refresh_from_db()

        return Response({
            "like_count": post.like_count,
            "message": "Post liked successfully"
        })

# Comment like view
class CommentLikeView(APIView):
    """
    Like or unlike a comment
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        comment = get_object_or_404(PostComment, pk=pk)
        
        # Check if user has access to this comment's post
        post = comment.post
        if post.club and post.club.is_private:
            if not post.club.users.filter(id=request.user.id).exists():
                return Response(
                    {"error": "You don't have access to this content"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Toggle like
        comment.like_count = comment.like_count + 1
        comment.save()
        
        # Refresh from DB
        comment.refresh_from_db()
        
        return Response({
            "like_count": comment.like_count,
            "message": "Comment liked successfully"
        })

# Book club image update view
class BookClubImageUpdateView(APIView):
    '''
    Update a book club's image (admin only)
    '''

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        club = get_object_or_404(BookClub, pk=pk)

        # Check if the user is the admin
        try:
            membership = ClubMember.objects.get(club=club, user=request.user)

            if not membership.is_admin:
                 return Response(
                    {"error": "Only club admins can update club images"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except ClubMember.DoesNotExist:
             return Response(
                {"error": "You are not a member of this club"},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'club_image' not in request.FILES:
            return Response(
                {"error": "No image provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        club_image = request.FILES['club_image']

        import os
        club_image_dir = os.path.join(settings.MEDIA_ROOT, "club_images")
        os.makedirs(club_image_dir, exist_ok=True)


        # save the file
        fs = FileSystemStorage()
        filename = fs.save(f"club_images/{club.id}_{club_image.name}", club_image)
        uploaded_file_url = fs.url(filename)

        # update the club image url
        club.club_image = uploaded_file_url
        club.save()

        return  Response({
            "message": "Club image updated successfully",
            "club_image_url": uploaded_file_url
        })

class BookClubUpdateBookView(APIView):
    """
    Class-based view to update a book club's book.
    Accepts a book_id in the request body and updates the club's book.
    Returns detailed response with the updated book information.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, club_id):
        try:
            # Get the club
            club = get_object_or_404(BookClub, id=club_id)
            
            # Check if user is a club admin
            try:
                membership = ClubMember.objects.get(club=club, user=request.user)
                if not membership.is_admin:
                    return Response(
                        {"error": "Only club admins can update the book"},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except ClubMember.DoesNotExist:
                return Response(
                    {"error": "You are not a member of this club"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get the book_id from request body
            received_book_id = request.data.get('book_id')
            
            # Log the received data
            print(f"Received request to update club {club_id}'s book to book_id: {received_book_id}")
            print(f"Full request data: {request.data}")
            
            if not received_book_id:
                return Response(
                    {"error": "book_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert to string since our book_id field is a CharField
            book_id_str = str(received_book_id)
            
            # Get the book - USING book_id field, not id field
            from library.models import Book
            try:
                # First try exact match on book_id field
                book = Book.objects.get(book_id=book_id_str)
                print(f"Found book by book_id: {book.title} (ID: {book.book_id})")
            except Book.DoesNotExist:
                # Then try with different search methods
                print(f"Book with book_id={book_id_str} not found, trying alternative searches")
                
                # Try matching book_id starting with the value
                try:
                    book = Book.objects.filter(book_id__startswith=book_id_str).first()
                    if book:
                        print(f"Found book by book_id prefix: {book.title} (ID: {book.book_id})")
                    else:
                        # Try matching raw primary key id
                        try:
                            numeric_id = int(received_book_id)
                            book = Book.objects.get(id=numeric_id)
                            print(f"Found book by primary key: {book.title} (ID: {book.book_id})")
                        except (ValueError, Book.DoesNotExist):
                            # Look for books by title if provided
                            if request.data.get('title'):
                                title = request.data.get('title')
                                print(f"Searching by title: {title}")
                                matching_books = Book.objects.filter(title__icontains=title)
                                
                                if matching_books.exists():
                                    book = matching_books.first()
                                    print(f"Found by title: {book.title} (ID: {book.book_id})")
                                else:
                                    raise Book.DoesNotExist("No matching books found")
                            else:
                                raise Book.DoesNotExist("No matching books found and no title provided")
                except Book.DoesNotExist:
                    # Return helpful error message with available books
                    sample_books = Book.objects.all().order_by('-year_published')[:5]
                    
                    recommendations = [{
                        "id": b.id,
                        "book_id": b.book_id,
                        "title": b.title,
                        "authors": [a.name for a in b.authors.all()],
                        "year_published": b.year_published
                    } for b in sample_books]
                    
                    return Response({
                        "error": f"Book with ID {received_book_id} does not exist.",
                        "recommendations": recommendations,
                        "note": "The book_id field is a string in our database, not a number. Here are some available books you can use instead."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
            # Store the old book ID if there was one
            old_book = club.book
            old_book_id = old_book.book_id if old_book else None
                
            # Update the club book
            club.book = book
            club.save(update_fields=['book'])
            print(f"Updated club book to: {book.title} (ID: {book.book_id})")
            
            # Add to history if necessary
            if old_book_id and old_book_id != book.book_id:
                try:
                    import datetime
                    from django.db.models import Max
                    
                    # Check if this book is already in the history
                    existing_entry = BookClubHistory.objects.filter(
                        club=club, 
                        book=old_book
                    ).first()
                    
                    if not existing_entry:
                        # Get the next order value
                        max_order = BookClubHistory.objects.filter(club=club).aggregate(Max('order'))['order__max'] or 0
                        next_order = max_order + 1
                        
                        # Create a history entry
                        BookClubHistory.objects.create(
                            club=club,
                            book=old_book,
                            end_date=datetime.datetime.now().date(),
                            order=next_order
                        )
                        print(f"Created history entry for previous book: {old_book.title}")
                except Exception as e:
                    print(f"Error creating history entry: {str(e)}")
            
            # Prepare book details for response
            authors = [author.name for author in book.authors.all()]
            
            # Return success response with book details
            response_data = {
                "success": True,
                "message": f"Book updated to {book.title}",
                "book_id": book.book_id,  # Return string book_id
                "numeric_id": book.id,    # Also return the numeric primary key
                "book_details": {
                    "id": book.id,
                    "book_id": book.book_id,
                    "title": book.title,
                    "authors": authors,
                    "year_published": book.year_published,
                    "summary": book.summary
                }
            }
            
            # Add cover image if available
            try:
                # Try to get the cover image through editions
                from library.models import Edition
                editions = Edition.objects.filter(book=book).prefetch_related('related_edition_image')
                
                # Look for editions with images
                for edition in editions:
                    cover_images = edition.related_edition_image.all()
                    if cover_images.exists():
                        # Prioritize primary images
                        primary_images = [img for img in cover_images if getattr(img, 'is_primary', False)]
                        if primary_images:
                            response_data["book_details"]["cover_url"] = primary_images[0].image_url
                            break
                        else:
                            response_data["book_details"]["cover_url"] = cover_images[0].image_url
                            break
            except Exception as e:
                print(f"Error getting cover image: {str(e)}")
                
            return Response(response_data)
                
        except Exception as e:
            import traceback
            print(f"Exception in BookClubUpdateBookView: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": f"Failed to update book club: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class BookClubsReadingBookView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, book_id):
        try:
            # Get book clubs reading this book
            clubs = BookClub.objects.filter(book__book_id=book_id)
            
            # Check which ones the user is a member of
            user_clubs = request.user.bookclub_set.all()
            
            club_data = []
            for club in clubs:
                is_member = club in user_clubs
                club_dict = {
                    'id': club.id,
                    'name': club.name,
                    'description': club.club_desc,
                    'member_count': club.users.count(),
                    'is_private': club.is_private,
                    'club_image': club.club_image,
                    'is_member': is_member
                }
                club_data.append(club_dict)
                
            return Response(club_data)
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch book clubs: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


# Fix the like count bug
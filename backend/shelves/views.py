from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework.decorators import action
from rest_framework.response import Response

from library.models import Shelf, ShelfEdition, Edition, UserBook
from .serializers import ShelfSerializer, AddEditionToShelfSerializer, ShelfEditionSerializer
from .permissions import IsShelfOwnerOrReadOnly

User = get_user_model()

class ShelfViewSet(viewsets.ModelViewSet):
    """
    Extend Django's built in Model ViewSet for shelf management.
    
    Provides CRUD functionality for shelves:
    - list (GET): List user's shelves
    - retrieve (GET): Get a single shelf
    - create (POST): Create a new shelf
    - update (PUT): Update a shelf  
    - partial_update (PATCH): Partially update a shelf
    - destroy (DELETE): Delete a shelf
    
    Additional custom actions:
    - add_edition (POST): Add an edition to a shelf
    - remove_edition (DELETE): Remove an edition from a shelf
    - editions (GET): List all editions on a shelf
    
    We override perform_create and get_queryset to instill custom access and behavior.
    """
    # Define how objects converted from Python to JSON using custom serializer.
    serializer_class = ShelfSerializer
    # Define access with custom permission class
    permission_classes = [IsAuthenticated, IsShelfOwnerOrReadOnly]
    # Custom filtering and searching using Django libraries. 
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['shelf_type']
    search_fields = ['name', 'shelf_desc']
    
    def get_queryset(self):
        """
        Used for LIST (and possibly CREATE).
        
        - If no ?username=, show shelves belonging to the logged-in user.
        - If ?username=<this_user>, show all that user's shelves (public + private).
        - If ?username=<someone_else>, show only that other user's public shelves.
        """
        user = self.request.user
        username = self.request.query_params.get('username', None)

        if not username:
            # Default to current user's shelves (all)
            return Shelf.objects.filter(user=user)
        
        # If a username is specified
        if username == user.username:
            # Same user - public + private
            return Shelf.objects.filter(user=user)
        else:
            # Another user - only that user's public shelves
            target_user = get_object_or_404(User, username=username)
            return Shelf.objects.filter(user=target_user, is_private=False)

    def get_object(self):
        """
        Used for RETRIEVE, UPDATE, DESTROY.
        
        We look up the Shelf by pk from ALL shelves. That way, if it's public (or 
        owned by the current user), it's found and the permission check decides 
        whether to allow access.
        """
        obj = get_object_or_404(Shelf, pk=self.kwargs['pk'])
        self.check_object_permissions(self.request, obj)
        return obj

    def update(self, request, *args, **kwargs):
        """
        Full update (PUT): Only allowed if shelf's shelf_type == 'Custom'.
        Also disallow changing shelf_type away from 'Custom'.
        """
        shelf = self.get_object()
        if shelf.shelf_type != "Custom":
            return Response(
                {"detail": "Cannot update non-custom shelves."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """
        Partial update (PATCH): Only allowed if shelf's shelf_type == 'Custom'.
        Also disallow changing shelf_type away from 'Custom'.
        """
        shelf = self.get_object()
        if shelf.shelf_type != "Custom":
            return Response(
                {"detail": "Cannot update non-custom shelves."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    def perform_update(self, serializer):
        """
        Enforce that shelf_type stays 'Custom' by ignoring any attempted change.
        """
        validated_data = {**serializer.validated_data}

        # If the user tried to change shelf_type, drop that field
        if "shelf_type" in validated_data:
            validated_data.pop("shelf_type")

        serializer.save(**validated_data)

    def perform_create(self, serializer):
        """
        Associate new shelf with current user on creation
        """
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        """
        Prevent deleting shelves that are not 'Custom'.
        """
        shelf = self.get_object()
        if shelf.shelf_type != "Custom":
            return Response(
                {"detail": "Cannot delete non-custom shelves."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    def _update_userbook_after_add(self, shelf, edition):
        """
        Update UserBook after adding an edition to a shelf.
        
        Args:
            shelf: The Shelf object the edition was added to
            edition: The Edition object that was added
        """
        # Only handle special shelf types (Read, Reading, Want to Read, Owned)
        special_shelf_types = {
            "Read": "Read",
            "Reading": "Reading",
            "Want to Read": "Want to Read",
            "Owned": None  # Special case for is_owned=True
        }
        
        if shelf.shelf_type in special_shelf_types:
            # Get or create a UserBook record
            user_book, created = UserBook.objects.get_or_create(
                user=shelf.user,
                book=edition.book,
                defaults={
                    'read_status': special_shelf_types.get(shelf.shelf_type, "Want to Read"),
                    'is_owned': shelf.shelf_type == "Owned"
                }
            )
            
            # If not created, update the fields
            if not created:
                if shelf.shelf_type in ["Read", "Reading", "Want to Read"]:
                    user_book.read_status = special_shelf_types[shelf.shelf_type]
                
                if shelf.shelf_type == "Owned":
                    user_book.is_owned = True
                
                user_book.save()
    
    def _update_userbook_after_remove(self, shelf, edition):
        """
        Update UserBook after removing an edition from a shelf.
        
        Args:
            shelf: The Shelf object the edition was removed from
            edition: The Edition object that was removed
        """
        # Only handle special shelf types (Read, Reading, Want to Read, Owned)
        special_shelf_types = ["Read", "Reading", "Want to Read", "Owned"]
        
        if shelf.shelf_type in special_shelf_types:
            try:
                # Try to get the UserBook
                user_book = UserBook.objects.get(user=shelf.user, book=edition.book)
                
                # Check if we need to update ownership
                if shelf.shelf_type == "Owned":
                    # Check if there are any other editions of this book on Owned shelves
                    other_owned_editions = ShelfEdition.objects.filter(
                        shelf__user=shelf.user,
                        shelf__shelf_type="Owned",
                        edition__book=edition.book
                    ).exists()
                    
                    if not other_owned_editions:
                        user_book.is_owned = False
                
                # Check if we need to update read status
                if shelf.shelf_type in ["Read", "Reading", "Want to Read"]:
                    # Find if this book is on any other status shelves
                    other_status_shelf = ShelfEdition.objects.filter(
                        shelf__user=shelf.user,
                        shelf__shelf_type__in=["Read", "Reading", "Want to Read"],
                        edition__book=edition.book
                    ).exclude(
                        shelf=shelf
                    ).values_list('shelf__shelf_type', flat=True).first()
                    
                    if other_status_shelf:
                        # Update to the status of the other shelf
                        user_book.read_status = other_status_shelf
                    else:
                        # If no other status shelf and not owned, delete the UserBook
                        if not user_book.is_owned:
                            user_book.delete()
                            return
                
                # Save the updated UserBook
                user_book.save()
                
            except UserBook.DoesNotExist:
                # No UserBook to update
                pass
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsShelfOwnerOrReadOnly])
    def add_edition(self, request, pk=None):
        """
        Add an edition to this shelf.
        
        Path: /api/shelves/{shelf_id}/add_edition/
        Method: POST
        Data: {"edition_id": id}
        
        Returns the created ShelfEdition object or error if validation fails.
        """
        shelf = self.get_object()
        
        # Only the shelf owner can add books
        if request.user != shelf.user:
            return Response(
                {"detail": "Only the shelf owner can add books."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create serializer with the shelf in context
        serializer = AddEditionToShelfSerializer(
            data=request.data,
            context={'shelf': shelf}
        )
        
        if serializer.is_valid():
            # Create the shelf-edition relationship
            shelf_edition = serializer.save()
            
            # Get the edition object
            edition = Edition.objects.get(pk=shelf_edition.edition_id)
            
            # Update UserBook after adding edition
            self._update_userbook_after_add(shelf, edition)
            
            # Return the created ShelfEdition with complete details
            return_serializer = ShelfEditionSerializer(shelf_edition)
            return Response(
                return_serializer.data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated, IsShelfOwnerOrReadOnly])
    def remove_edition(self, request, pk=None):
        """
        Remove an edition from this shelf.
        
        Path: /api/shelves/{shelf_id}/remove_edition/{edition_id}/
        Method: DELETE
        
        Returns 204 No Content on success.
        """
        shelf = self.get_object()
        
        # Only the shelf owner can remove books
        if request.user != shelf.user:
            return Response(
                {"detail": "Only the shelf owner can remove books."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get the edition ID from the URL
        edition_id = request.query_params.get('edition_id')
        if not edition_id:
            return Response(
                {"detail": "Edition ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the ShelfEdition or return 404
        shelf_edition = get_object_or_404(
            ShelfEdition, 
            shelf=shelf,
            edition_id=edition_id
        )
        
        # Get the edition object before deleting the relationship
        edition = shelf_edition.edition
        
        # Delete the relationship
        shelf_edition.delete()
        
        # Update UserBook after removing edition
        self._update_userbook_after_remove(shelf, edition)
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def editions(self, request, pk=None):
        """
        List all editions on this shelf.
        
        Path: /api/shelves/{shelf_id}/editions/
        Method: GET
        
        Returns a list of editions on this shelf.
        """
        shelf = self.get_object()
        
        # If the shelf is private and the user is not the owner, return 403
        if shelf.is_private and request.user != shelf.user:
            return Response(
                {"detail": "You do not have permission to view this shelf's editions."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all ShelfEdition objects for this shelf
        shelf_editions = ShelfEdition.objects.filter(shelf=shelf)
        
        # Serialize the results
        serializer = ShelfEditionSerializer(shelf_editions, many=True)
        
        return Response(serializer.data)
    
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from library.models import Journal, JournalEntry, Book, UserBook
from .serializers import JournalSerializer, JournalEntrySerializer, JournalListSerializer
from .permissions import IsJournalOwnerOrReadOnlyIfPublic, IsEntryOwnerOrReadOnlyIfPublic
from django.shortcuts import get_object_or_404
from django.utils import timezone



class JournalViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing journals.
    
    Allows users to create, view, update, and delete their journals.
    Public journals can be viewed by any authenticated user.
    """
    serializer_class = JournalSerializer
    permission_classes = [IsJournalOwnerOrReadOnlyIfPublic]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_private']
    search_fields = ['user_book__book__title']
    ordering_fields = ['created_on', 'updated_on', 'user_book__book__title']
    ordering = ['-updated_on']
    
    def get_serializer_class(self):
        """Return different serializers based on the action"""
        if self.action == 'list':
            return JournalListSerializer
        return JournalSerializer
    
    def get_queryset(self):
        """
        Return journals based on permissions:
        - Owner sees all their journals
        - Others only see public journals
        """
        user = self.request.user
        if user.is_authenticated:
            # Show all of the user's journals plus other public journals
            return Journal.objects.filter(
                Q(user_book__user=user) | Q(is_private=False)
            ).select_related('user_book__user', 'user_book__book')
        return Journal.objects.none()
    
    def perform_create(self, serializer):
        book_id = self.request.data.get('book')
        
        if book_id:
            try:
                # Look up the book by book_id (string field), not by pk
                book = Book.objects.get(book_id=book_id)
                
                # Get or create UserBook
                user_book, created = UserBook.objects.get_or_create(
                    user=self.request.user,
                    book=book
                )
                
                serializer.save(user_book=user_book)
            except Book.DoesNotExist:
                raise ValidationError({"book": "Book not found"})
        else:
            serializer.save()
    
    @action(detail=True, methods=['get'])
    def entries(self, request, pk=None):
        """
        Get all entries for a specific journal
        """
        journal = self.get_object()
        
        # Filter entries based on permissions
        if journal.user_book.user == request.user:
            # User can see all their own entries
            entries = journal.entries.all()
        else:
            # Others can only see public entries in public journals
            if journal.is_private:
                return Response(
                    {"detail": "You don't have permission to view entries of this journal."},
                    status=status.HTTP_403_FORBIDDEN
                )
            entries = journal.entries.filter(is_private=False)
        
        # Apply sorting
        sort_by = request.query_params.get('sort_by', 'updated_on')
        order = request.query_params.get('order', 'desc')
        
        valid_sort_fields = {
            'created_on': 'created_on',
            'updated_on': 'updated_on',
            'page_num': 'page_num',
        }
        
        if sort_by in valid_sort_fields:
            order_prefix = '-' if order == 'desc' else ''
            entries = entries.order_by(f'{order_prefix}{valid_sort_fields[sort_by]}')
        
        page = self.paginate_queryset(entries)
        if page is not None:
            serializer = JournalEntrySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = JournalEntrySerializer(entries, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_journals(self, request):
        """
        Get only the current user's journals
        """
        journals = Journal.objects.filter(user_book__user=request.user)
        
        # Apply filters
        book_id = request.query_params.get('book_id')
        if book_id:
            journals = journals.filter(user_book__book__book_id=book_id)
            
        # Add filter for is_private parameter
        is_private = request.query_params.get('is_private')
        if is_private is not None:
            # Convert string to boolean
            is_private_bool = is_private.lower() == 'true'
            journals = journals.filter(is_private=is_private_bool)
        
        # Apply sorting
        sort_by = request.query_params.get('sort_by', 'updated_on')
        order = request.query_params.get('order', 'desc')
        
        valid_sort_fields = {
            'created_on': 'created_on',
            'updated_on': 'updated_on',
            'book_title': 'user_book__book__title'
        }
        
        if sort_by in valid_sort_fields:
            order_prefix = '-' if order == 'desc' else ''
            journals = journals.order_by(f'{order_prefix}{valid_sort_fields[sort_by]}')
        
        page = self.paginate_queryset(journals)
        if page is not None:
            serializer = JournalListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = JournalListSerializer(journals, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def for_book(self, request):
        """
        Get journals for a specific book
        """
        book_id = request.query_params.get('book_id')
        if not book_id:
            return Response(
                {"detail": "Book ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        book = get_object_or_404(Book, book_id=book_id)
        
        # Filter journals based on permissions
        if request.user.is_authenticated:
            journals = Journal.objects.filter(
                Q(user_book__book=book) & (Q(user_book__user=request.user) | Q(is_private=False))
            )
        else:
            journals = Journal.objects.none()
        
        serializer = JournalListSerializer(journals, many=True)
        return Response(serializer.data)
    
# This is correct indentation - JournalEntryViewSet should be at the same level as JournalViewSet
class JournalEntryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing journal entries.
    
    Allows users to create, view, update, and delete entries in their journals.
    Public entries in public journals can be viewed by any authenticated user.
    """
    serializer_class = JournalEntrySerializer
    permission_classes = [IsEntryOwnerOrReadOnlyIfPublic]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_private', 'page_num', 'journal']
    search_fields = ['title', 'content']
    ordering_fields = ['created_on', 'updated_on', 'page_num']
    ordering = ['-updated_on']
    
    def get_queryset(self):
        """
        Return entries based on permissions:
        - Owner sees all their entries
        - Others only see public entries in public journals
        """
        user = self.request.user
        if user.is_authenticated:
            # Show all of the user's entries plus other public entries in public journals
            return JournalEntry.objects.filter(
                Q(journal__user_book__user=user) | 
                (Q(is_private=False) & Q(journal__is_private=False))
            ).select_related('journal', 'journal__user_book__user', 'journal__user_book__book')
        return JournalEntry.objects.none()
    
    def perform_create(self, serializer):
        """Set additional validation before creating"""
        journal_id = self.request.data.get('journal')
        journal = get_object_or_404(Journal, id=journal_id)
        
        # Ensure user can only add entries to their own journals
        if journal.user_book.user != self.request.user:
            # Fixed: Raise a ValidationError instead of returning a Response
            raise ValidationError({"detail": "You can only add entries to your own journals."})
        
        serializer.save()
# backend/journals/views.py

from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from library.models import Journal, JournalEntry
from .serializers import (
    JournalSerializer, JournalEntrySerializer, JournalCreateSerializer
)
from .permissions import IsOwnerOrReadOnlyIfPublic, IsJournalOwnerOrReadOnlyIfPublic


class JournalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Journal model
    
    Allows users to create, read, update, and delete journals.
    Users can only see their own private journals, but can see other users' public journals.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnlyIfPublic]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_private']
    search_fields = ['book__title']
    ordering_fields = ['created_on', 'updated_on']
    ordering = ['-updated_on']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return JournalCreateSerializer
        return JournalSerializer
    
    def get_queryset(self):
        user = self.request.user
        # Users can see all their own journals plus public journals from others
        return Journal.objects.filter(
            user=user
        ) | Journal.objects.filter(
            is_private=False
        ).distinct()
    
    @action(detail=True, methods=['get'])
    def entries(self, request, pk=None):
        """
        List all entries for a specific journal
        """
        journal = self.get_object()
        
        # Determine which entries the user can see
        if journal.user == request.user:
            # User owns the journal, so can see all entries
            entries = journal.entries.all()
        else:
            # User doesn't own the journal, so can only see public entries
            entries = journal.entries.filter(is_private=False)
        
        # Apply filters and ordering
        page_num = request.query_params.get('page_num')
        if page_num:
            entries = entries.filter(page_num=page_num)
        
        is_private = request.query_params.get('is_private')
        if is_private is not None:
            is_private = is_private.lower() == 'true'
            entries = entries.filter(is_private=is_private)
        
        # Apply search
        search = request.query_params.get('search')
        if search:
            entries = entries.filter(
                models.Q(title__icontains=search) | 
                models.Q(content__icontains=search)
            )
        
        # Ordering
        ordering = request.query_params.get('ordering')
        if ordering:
            if ordering == 'word_count':
                # Sort by word count (Python-side since it's a property)
                entries = sorted(entries, key=lambda x: len(x.content.split()))
            elif ordering == '-word_count':
                entries = sorted(entries, key=lambda x: len(x.content.split()), reverse=True)
            else:
                entries = entries.order_by(ordering)
        
        serializer = JournalEntrySerializer(entries, many=True)
        return Response(serializer.data)


class JournalEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for JournalEntry model within a Journal
    
    Allows users to create, read, update, and delete journal entries.
    Users can only see their own private entries, but can see other users' public entries
    in public journals.
    """
    serializer_class = JournalEntrySerializer
    permission_classes = [permissions.IsAuthenticated, IsJournalOwnerOrReadOnlyIfPublic]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['is_private', 'page_num']
    search_fields = ['title', 'content']
    ordering_fields = ['created_on', 'updated_on', 'page_num']
    ordering = ['-created_on']
    
    def get_queryset(self):
        journal_pk = self.kwargs.get('journal_pk')
        if not journal_pk:
            return JournalEntry.objects.none()
        
        user = self.request.user
        
        try:
            journal = Journal.objects.get(pk=journal_pk)
            
            # User can see all entries of their own journal
            if journal.user == user:
                return journal.entries.all()
            
            # For other users' journals, they can only see public entries
            # if the journal itself is public
            if not journal.is_private:
                return journal.entries.filter(is_private=False)
            
            # If journal is private and user is not the owner, return empty queryset
            return JournalEntry.objects.none()
            
        except Journal.DoesNotExist:
            return JournalEntry.objects.none()
    
    def perform_create(self, serializer):
        journal_pk = self.kwargs.get('journal_pk')
        journal = Journal.objects.get(pk=journal_pk)
        serializer.save(journal=journal)
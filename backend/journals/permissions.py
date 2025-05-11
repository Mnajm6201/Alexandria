# backend/journals/permissions.py

from rest_framework import permissions

class IsOwnerOrReadOnlyIfPublic(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    Others can only view it if it's public.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to anyone if the object is public
        if request.method in permissions.SAFE_METHODS:
            # Check if object has user attribute (Journal/JournalEntry)
            if hasattr(obj, 'user'):
                if obj.user == request.user:
                    return True
                return not obj.is_private
            
            # Check if object has journal attribute (JournalEntry)
            if hasattr(obj, 'journal'):
                if obj.journal.user == request.user:
                    return True
                # Others can only see public entries in public journals
                return not obj.is_private and not obj.journal.is_private
        
        # Write permissions are only allowed to the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'journal'):
            return obj.journal.user == request.user
        
        return False


class IsJournalOwnerOrReadOnlyIfPublic(permissions.BasePermission):
    """
    Custom permission for journal entries within a journal.
    Only allows journal owners to create/edit entries.
    Others can only view public entries in public journals.
    """
    
    def has_permission(self, request, view):
        journal_pk = view.kwargs.get('journal_pk')
        if not journal_pk:
            return True  # Will be handled by has_object_permission
        
        try:
            from library.models import Journal
            journal = Journal.objects.get(pk=journal_pk)
            
            # For reading operations
            if request.method in permissions.SAFE_METHODS:
                if journal.user == request.user:
                    return True
                return not journal.is_private
            
            # For write operations, only the journal owner can modify
            return journal.user == request.user
            
        except Journal.DoesNotExist:
            return False
    
    def has_object_permission(self, request, view, obj):
        # For entries, check both entry privacy and journal privacy
        if request.method in permissions.SAFE_METHODS:
            if obj.journal.user == request.user:
                return True
            # Others can only see public entries in public journals
            return not obj.is_private and not obj.journal.is_private
        
        # Write permissions only for the journal owner
        return obj.journal.user == request.user
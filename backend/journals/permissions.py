from rest_framework import permissions

class IsJournalOwnerOrReadOnlyIfPublic(permissions.BasePermission):
    """
    Custom permission to only allow owners of a journal to edit it.
    Others can only view if the journal is public.
    """
    
    def has_permission(self, request, view):
        # Allow all authenticated users to list or create journals
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Always allow GET, HEAD or OPTIONS requests if the journal is public
        if request.method in permissions.SAFE_METHODS and not obj.is_private:
            return True
        
        # Write permissions are only allowed to the owner of the journal
        return obj.user_book.user == request.user


class IsEntryOwnerOrReadOnlyIfPublic(permissions.BasePermission):
    """
    Custom permission to only allow owners of an entry to edit it.
    Others can only view if both the journal and entry are public.
    """
    
    def has_permission(self, request, view):
        # Allow all authenticated users
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Allow GET, HEAD or OPTIONS requests if both journal and entry are public
        if request.method in permissions.SAFE_METHODS and not obj.is_private and not obj.journal.is_private:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.journal.user_book.user == request.user
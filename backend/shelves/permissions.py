from rest_framework import permissions

class IsShelfOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a shelf to edit or delete it.
    Others can view if the shelf is public.
    """
    
    def has_object_permission(self, request, view, obj):
        # Allow GET, HEAD or OPTIONS requests for public shelves
        if request.method in permissions.SAFE_METHODS:
            return not obj.is_private or obj.user == request.user
            
        # Write permissions only for shelf owner
        return obj.user == request.user
"""
Custom permissions for multi-tenant catalogue system.
Ensures strict data isolation between users.
"""
from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to view/edit it.
    Ensures no data leakage across user accounts.
    
    This permission checks:
    1. User is authenticated (handled by IsAuthenticated)
    2. Object has an 'owner' attribute
    3. Object's owner matches the requesting user
    """
    
    message = "You do not have permission to access this resource."

    def has_permission(self, request, view):
        """
        Check if user has permission to access the view at all.
        This is checked before has_object_permission.
        """
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        """
        Check if user owns the specific object.
        Called for detail views (retrieve, update, delete).
        """
        # Ensure object has owner attribute
        if not hasattr(obj, 'owner'):
            return False
        
        # Check if owner matches request user
        return obj.owner == request.user


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow read-only access to all,
    but write access only to the owner.
    
    Currently not used but available for future features.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for owner
        return hasattr(obj, 'owner') and obj.owner == request.user

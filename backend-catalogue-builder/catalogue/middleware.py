"""
Custom middleware for catalogue app.
Ensures StoreSettings exists for authenticated users.
"""
from django.utils.deprecation import MiddlewareMixin
from .models import StoreSettings


class EnsureStoreSettingsMiddleware(MiddlewareMixin):
    """
    Middleware to ensure every authenticated user has StoreSettings.
    Creates settings on-the-fly if missing.
    
    This runs on every request, but only creates settings once per user.
    """
    
    def process_request(self, request):
        """
        Check if authenticated user has StoreSettings.
        Create if missing.
        """
        if request.user.is_authenticated:
            # Check if user has store_settings
            if not hasattr(request.user, 'store_settings'):
                try:
                    # Try to get existing settings
                    StoreSettings.objects.get(owner=request.user)
                except StoreSettings.DoesNotExist:
                    # Create settings if missing
                    StoreSettings.objects.create(owner=request.user)
        
        return None

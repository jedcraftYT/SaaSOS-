"""
Views for multi-tenant catalogue system.
Includes consistent API responses and enhanced security.
"""
from rest_framework import viewsets, status, generics, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import NotFound, PermissionDenied
from django.contrib.auth.models import User
from django.shortcuts import render
from django.db import transaction

from .models import Product, StoreSettings
from .serializers import (
    ProductSerializer,
    StoreSettingsSerializer,
    UserSerializer,
    RegisterSerializer
)
from .permissions import IsOwner


def api_response(success=True, message="", data=None, status_code=status.HTTP_200_OK):
    """
    Standardized API response format.
    All API endpoints return this structure.
    """
    response_data = {
        "success": success,
        "message": message,
    }
    if data is not None:
        response_data["data"] = data
    
    return Response(response_data, status=status_code)


class RegisterView(generics.CreateAPIView):
    """
    User registration endpoint.
    POST /auth/register/
    
    Returns:
        - success: bool
        - message: str
        - data: {user, tokens}
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Registration failed. Please check your input.",
                data={"errors": serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return api_response(
            success=True,
            message="Registration successful. Welcome!",
            data={
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            },
            status_code=status.HTTP_201_CREATED
        )


class LogoutView(views.APIView):
    """
    Logout endpoint.
    POST /auth/logout/
    
    Blacklists the refresh token (if using token blacklist).
    Client should also clear tokens from localStorage.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                message = "Logout successful. Token blacklisted."
            else:
                message = "Logout successful. Please clear tokens on client side."
            
            return api_response(
                success=True,
                message=message,
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return api_response(
                success=True,  # Still success even if blacklist fails
                message="Logout successful. Please clear tokens on client side.",
                status_code=status.HTTP_200_OK
            )


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    User profile endpoint.
    GET/PATCH /auth/profile/
    
    Returns:
        - success: bool
        - message: str
        - data: user object
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(
            success=True,
            message="Profile retrieved successfully.",
            data=serializer.data
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Profile update failed.",
                data={"errors": serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_update(serializer)
        
        return api_response(
            success=True,
            message="Profile updated successfully.",
            data=serializer.data
        )


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product model with full multi-tenant isolation.
    
    List: GET /api/products/ - Returns ONLY products belonging to the logged-in user
    Create: POST /api/products/ - Creates product with owner=request.user
    Retrieve: GET /api/products/{id}/ - Only if user owns it
    Update: PUT/PATCH /api/products/{id}/ - Only if user owns it
    Delete: DELETE /api/products/{id}/ - Only if user owns it
    
    All responses follow standardized format:
        - success: bool
        - message: str
        - data: payload
    """
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        """
        CRITICAL: Return ONLY products belonging to the logged-in user.
        This prevents data leakage across accounts.
        """
        return Product.objects.filter(owner=self.request.user).select_related('owner')

    def get_object(self):
        """
        Override to ensure user can only access their own products.
        Returns 404 if product doesn't exist or doesn't belong to user.
        """
        queryset = self.get_queryset()
        pk = self.kwargs.get('pk')
        
        try:
            obj = queryset.get(pk=pk)
        except Product.DoesNotExist:
            raise NotFound("Product not found or you don't have permission to access it.")
        
        # Check object permissions
        self.check_object_permissions(self.request, obj)
        return obj

    def list(self, request, *args, **kwargs):
        """List all products for the authenticated user"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return api_response(
            success=True,
            message=f"Retrieved {len(serializer.data)} products.",
            data=serializer.data
        )

    def create(self, request, *args, **kwargs):
        """Create a new product"""
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Product creation failed.",
                data={"errors": serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        
        return api_response(
            success=True,
            message="Product created successfully.",
            data=serializer.data,
            status_code=status.HTTP_201_CREATED
        )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a single product"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return api_response(
            success=True,
            message="Product retrieved successfully.",
            data=serializer.data
        )

    def update(self, request, *args, **kwargs):
        """Update a product (PUT/PATCH)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Product update failed.",
                data={"errors": serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_update(serializer)
        
        return api_response(
            success=True,
            message="Product updated successfully.",
            data=serializer.data
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a product"""
        instance = self.get_object()
        product_name = instance.name
        self.perform_destroy(instance)
        
        return api_response(
            success=True,
            message=f"Product '{product_name}' deleted successfully.",
            status_code=status.HTTP_200_OK
        )

    def perform_create(self, serializer):
        """Automatically set owner to the logged-in user"""
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        """
        Ensure owner cannot be changed during update.
        Extra safety layer beyond serializer validation.
        """
        instance = serializer.instance
        if instance.owner != self.request.user:
            raise PermissionDenied("You cannot update products you don't own.")
        serializer.save()


class StoreSettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for StoreSettings model.
    Each user has exactly one settings object.
    
    List: GET /api/settings/ - Returns current user's settings (auto-creates if missing)
    Retrieve: GET /api/settings/{id}/ - Only if user owns it
    Update: PUT/PATCH /api/settings/{id}/ - Only if user owns it
    
    Note: Create and Delete are disabled as each user should have exactly one settings object.
    """
    serializer_class = StoreSettingsSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    http_method_names = ['get', 'patch', 'put', 'head', 'options']  # Disable POST and DELETE

    def get_queryset(self):
        """
        CRITICAL: Return ONLY settings belonging to the logged-in user.
        """
        return StoreSettings.objects.filter(owner=self.request.user).select_related('owner')

    def get_object(self):
        """
        Override to ensure user can only access their own settings.
        Auto-creates settings if missing.
        """
        # For detail routes (with pk)
        if 'pk' in self.kwargs:
            queryset = self.get_queryset()
            pk = self.kwargs.get('pk')
            
            try:
                obj = queryset.get(pk=pk)
            except StoreSettings.DoesNotExist:
                raise NotFound("Settings not found or you don't have permission to access them.")
            
            # Check object permissions
            self.check_object_permissions(self.request, obj)
            return obj
        
        # For non-detail routes, get or create
        settings, created = StoreSettings.objects.get_or_create(owner=self.request.user)
        return settings

    def list(self, request, *args, **kwargs):
        """
        Return the user's settings object.
        Auto-create if it doesn't exist.
        """
        settings, created = StoreSettings.objects.get_or_create(owner=request.user)
        serializer = self.get_serializer(settings)
        
        message = "Settings created successfully." if created else "Settings retrieved successfully."
        
        return api_response(
            success=True,
            message=message,
            data=serializer.data
        )

    def retrieve(self, request, *args, **kwargs):
        """Retrieve settings by ID"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return api_response(
            success=True,
            message="Settings retrieved successfully.",
            data=serializer.data
        )

    def update(self, request, *args, **kwargs):
        """Update settings (PUT/PATCH)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            return api_response(
                success=False,
                message="Settings update failed.",
                data={"errors": serializer.errors},
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_update(serializer)
        
        return api_response(
            success=True,
            message="Settings updated successfully.",
            data=serializer.data
        )

    def perform_update(self, serializer):
        """
        Ensure owner cannot be changed during update.
        Extra safety layer beyond serializer validation.
        """
        instance = serializer.instance
        if instance.owner != self.request.user:
            raise PermissionDenied("You cannot update settings you don't own.")
        serializer.save()

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Convenience endpoint: GET /api/settings/me/
        Returns current user's settings (auto-creates if missing).
        """
        settings, created = StoreSettings.objects.get_or_create(owner=request.user)
        serializer = self.get_serializer(settings)
        
        message = "Settings created successfully." if created else "Settings retrieved successfully."
        
        return api_response(
            success=True,
            message=message,
            data=serializer.data
        )


class HealthCheckView(views.APIView):
    """
    Health check endpoint for frontend connectivity testing.
    GET /api/health/
    
    No authentication required.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return api_response(
            success=True,
            message="API is healthy and running.",
            data={
                "status": "ok",
                "version": "1.0.0",
                "authenticated": request.user.is_authenticated,
                "user": request.user.username if request.user.is_authenticated else None
            }
        )


# ============================================
# FRONTEND TEMPLATE VIEWS
# ============================================

def login_view(request):
    """
    Render the login page.
    Route: / and /login.html
    """
    return render(request, 'catalogue/login.html')


def register_view(request):
    """
    Render the registration page.
    Route: /register.html
    """
    return render(request, 'catalogue/register.html')


def dashboard_view(request):
    """
    Render the front-end dashboard.
    Route: /app/
    """
    return render(request, 'catalogue/index.html')

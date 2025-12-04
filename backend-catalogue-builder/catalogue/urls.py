"""
URL configuration for catalogue app.
Includes authentication, API endpoints, and frontend views.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    ProductViewSet,
    StoreSettingsViewSet,
    RegisterView,
    LogoutView,
    ProfileView,
    HealthCheckView,
    dashboard_view,
    login_view,
    register_view
)

# DRF Router for ViewSets
router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'settings', StoreSettingsViewSet, basename='settings')

urlpatterns = [
    # ============================================
    # FRONTEND TEMPLATE VIEWS
    # ============================================
    path('', login_view, name='home'),
    path('login.html', login_view, name='login_page'),
    path('register.html', register_view, name='register_page'),
    path('app/', dashboard_view, name='dashboard'),
    
    # ============================================
    # AUTHENTICATION ENDPOINTS
    # ============================================
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    
    # ============================================
    # API ENDPOINTS
    # ============================================
    path('api/health/', HealthCheckView.as_view(), name='health_check'),
    path('api/', include(router.urls)),
]

from django.contrib import admin
from .models import Product, StoreSettings


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'sku', 'price', 'category', 'created_at']
    list_filter = ['owner', 'category', 'created_at']
    search_fields = ['name', 'sku', 'description', 'owner__username']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        """
        Superusers see all products.
        Staff users only see their own products.
        """
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(owner=request.user)


@admin.register(StoreSettings)
class StoreSettingsAdmin(admin.ModelAdmin):
    list_display = ['owner', 'brand_name', 'currency', 'cta_style', 'catalogue_template']
    list_filter = ['currency', 'cta_style', 'catalogue_template']
    search_fields = ['owner__username', 'brand_name']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        """
        Superusers see all settings.
        Staff users only see their own settings.
        """
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(owner=request.user)

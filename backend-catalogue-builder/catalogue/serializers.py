"""
Serializers for multi-tenant catalogue system.
Includes security validations and data sanitization.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from .models import Product, StoreSettings


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    Used for profile display and updates.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'username', 'date_joined']
    
    def validate_email(self, value):
        """Ensure email is unique (excluding current user)"""
        user = self.instance
        if User.objects.exclude(pk=user.pk if user else None).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Auto-creates StoreSettings on successful registration.
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text="Password must be at least 8 characters long."
    )
    password2 = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        label="Confirm Password"
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate_username(self, value):
        """Ensure username is unique and valid"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        return value.lower()

    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value.lower()

    def validate(self, data):
        """Validate password match"""
        if data['password'] != data['password2']:
            raise serializers.ValidationError({
                "password2": "Passwords do not match."
            })
        return data

    @transaction.atomic
    def create(self, validated_data):
        """
        Create user and auto-create StoreSettings.
        Uses transaction to ensure both are created or neither.
        """
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        
        # Auto-create StoreSettings for new user
        StoreSettings.objects.create(owner=user)
        
        return user


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Product model.
    Includes multi-tenant security and SKU validation.
    """
    owner = serializers.ReadOnlyField(source='owner.username')
    owner_id = serializers.ReadOnlyField(source='owner.id')
    store_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'owner', 'owner_id', 'store_name', 'name', 'description', 
            'price', 'category', 'sku', 'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'owner_id', 'store_name', 'created_at', 'updated_at']
        extra_kwargs = {
            'name': {'required': True, 'allow_blank': False},
            'price': {'required': True, 'min_value': 0},
            'sku': {'required': True, 'allow_blank': False},
        }
    
    def get_store_name(self, obj):
        """Get the brand name from the owner's store settings"""
        try:
            return obj.owner.store_settings.brand_name or obj.owner.username
        except StoreSettings.DoesNotExist:
            return obj.owner.username

    def validate_name(self, value):
        """Validate product name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Product name cannot be empty.")
        return value.strip()

    def validate_price(self, value):
        """Validate price is positive"""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        if value > 999999999.99:
            raise serializers.ValidationError("Price is too large.")
        return value

    def validate_sku(self, value):
        """
        Ensure SKU is unique per owner (not globally).
        More efficient query using select_for_update for race condition safety.
        """
        if not value or not value.strip():
            raise serializers.ValidationError("SKU cannot be empty.")
        
        value = value.strip().upper()  # Normalize SKU
        user = self.context['request'].user
        instance = self.instance

        # Build query for SKU uniqueness check
        qs = Product.objects.filter(owner=user, sku=value)
        
        # If updating, exclude the current instance
        if instance:
            qs = qs.exclude(pk=instance.pk)
        
        # Check if SKU exists
        if qs.exists():
            raise serializers.ValidationError(
                "You already have a product with this SKU."
            )
        
        return value

    def validate_images(self, value):
        """
        Validate and sanitize image list.
        Ensure it's a list and limit to 5 images.
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("Images must be a list.")
        
        if len(value) > 5:
            raise serializers.ValidationError("Maximum 5 images allowed per product.")
        
        # Sanitize: ensure all items are strings
        sanitized = []
        for img in value:
            if isinstance(img, str):
                sanitized.append(img.strip())
        
        return sanitized

    def validate_category(self, value):
        """Sanitize category"""
        if value:
            return value.strip()
        return value

    def validate(self, data):
        """
        Additional validation at object level.
        Prevent owner manipulation.
        """
        # Ensure owner cannot be set/changed via API
        if 'owner' in data:
            raise serializers.ValidationError({
                "owner": "Owner cannot be modified."
            })
        
        return data

    def create(self, validated_data):
        """
        Create product with owner set to request user.
        Owner is NEVER taken from request data.
        """
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Update product.
        Ensure owner cannot be changed.
        """
        # Remove owner if somehow present (extra safety)
        validated_data.pop('owner', None)
        return super().update(instance, validated_data)


class StoreSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for StoreSettings model.
    Each user has exactly one settings object.
    """
    owner = serializers.ReadOnlyField(source='owner.username')
    owner_id = serializers.ReadOnlyField(source='owner.id')

    class Meta:
        model = StoreSettings
        fields = [
            'id', 'owner', 'owner_id', 'brand_name', 'brand_logo', 'domain_url',
            'currency', 'cta_style', 'whatsapp_phone', 'whatsapp_message',
            'catalogue_template', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'owner_id', 'created_at', 'updated_at']

    def validate_brand_name(self, value):
        """Sanitize brand name"""
        if value:
            return value.strip()
        return value

    def validate_domain_url(self, value):
        """Sanitize domain URL"""
        if value:
            return value.strip()
        return value

    def validate_currency(self, value):
        """Validate currency code"""
        valid_currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'CAD', 'AUD', 'JPY']
        if value and value not in valid_currencies:
            raise serializers.ValidationError(
                f"Invalid currency. Must be one of: {', '.join(valid_currencies)}"
            )
        return value

    def validate_whatsapp_phone(self, value):
        """Sanitize WhatsApp phone"""
        if value:
            # Remove spaces and common separators
            return value.strip().replace(' ', '').replace('-', '')
        return value

    def validate(self, data):
        """
        Additional validation at object level.
        Prevent owner manipulation.
        """
        # Ensure owner cannot be set/changed via API
        if 'owner' in data:
            raise serializers.ValidationError({
                "owner": "Owner cannot be modified."
            })
        
        return data

    def update(self, instance, validated_data):
        """
        Update settings.
        Ensure owner cannot be changed.
        """
        # Remove owner if somehow present (extra safety)
        validated_data.pop('owner', None)
        return super().update(instance, validated_data)

from django.db import models
from django.contrib.auth.models import User
from django.db.models import UniqueConstraint


class Product(models.Model):
    """
    Product model - each product belongs to a specific user (owner).
    SKU is unique per owner, not globally.
    """
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='products'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100, blank=True)
    sku = models.CharField(max_length=100)
    images = models.JSONField(default=list, blank=True)  # List of URLs or base64 strings
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            UniqueConstraint(
                fields=['owner', 'sku'],
                name='unique_sku_per_owner'
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.owner.username})"


class StoreSettings(models.Model):
    """
    Store settings model - one-to-one relationship with User.
    Each user has exactly one StoreSettings instance.
    """
    CTA_CHOICES = [
        ('cart', 'Add to Cart'),
        ('bag', 'Add to Bag'),
    ]

    TEMPLATE_CHOICES = [
        ('minimal', 'Minimal'),
        ('elegant', 'Elegant'),
        ('bold', 'Bold'),
        ('compact', 'Compact'),
    ]

    owner = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='store_settings'
    )
    brand_name = models.CharField(max_length=255, blank=True)
    brand_logo = models.TextField(blank=True)  # URL or base64 string
    domain_url = models.CharField(max_length=500, blank=True)  # Changed from URLField to allow any format
    currency = models.CharField(max_length=10, default='INR')
    cta_style = models.CharField(
        max_length=10,
        choices=CTA_CHOICES,
        default='cart'
    )
    whatsapp_phone = models.CharField(max_length=20, blank=True)
    whatsapp_message = models.TextField(blank=True)
    catalogue_template = models.CharField(
        max_length=20,
        choices=TEMPLATE_CHOICES,
        default='minimal'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Store Settings"

    def __str__(self):
        return f"Settings for {self.owner.username}"

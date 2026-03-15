from django.db import models
from django.conf import settings

# Create your models here.

class Enhancer(models.Model):
    """Model to store different types of enhancers with their pricing"""
    ENHANCER_TYPES = [
        ('pro_tag', 'Pro Tag'),
        ('hacker_tag', 'Hacker Tag'),
        ('exposer', 'Exposer'),
    ]
    
    enhancer_type = models.CharField(max_length=50, choices=ENHANCER_TYPES, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="Discount percentage (0-100)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Enhancer'
        verbose_name_plural = 'Enhancers'
        ordering = ['price']

    def __str__(self):
        return f"{self.name} - ${self.price}"


class UserEnhancer(models.Model):
    """Model to track which enhancers each user owns"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_enhancers"
    )
    enhancer = models.ForeignKey(
        Enhancer,
        on_delete=models.CASCADE,
        related_name="user_owners"
    )
    purchased_at = models.DateTimeField(auto_now_add=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price paid at time of purchase")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'User Enhancer'
        verbose_name_plural = 'User Enhancers'
        unique_together = ('user', 'enhancer')  # Prevent duplicate ownership
        ordering = ['-purchased_at']

    def __str__(self):
        return f"{self.user.email} owns {self.enhancer.name}"


# Utility function to get user's enhancer data
def get_user_enhancer_data(user):
    """Utility function to get user's enhancer data"""
    # Get all user enhancers (both active and inactive for display)
    all_user_enhancers = UserEnhancer.objects.filter(user=user).select_related('enhancer')
    
    # Get only active enhancers for display
    active_user_enhancers = all_user_enhancers.filter(is_active=True)
    
    # Get all owned enhancer types (regardless of active status)
    all_owned_types = [ue.enhancer.enhancer_type for ue in all_user_enhancers]
    
    # Get only active enhancer types for display
    active_types = [ue.enhancer.enhancer_type for ue in active_user_enhancers]
    
    # Build response data
    enhancer_data = {
        # Ownership status (user owns these enhancers)
        'have_pro_tag': 'pro_tag' in all_owned_types,
        'have_hacker_tag': 'hacker_tag' in all_owned_types,
        'have_exposer': 'exposer' in all_owned_types,
        
        # Active status (currently displayed tags)
        'active_pro_tag': 'pro_tag' in active_types,
        'active_hacker_tag': 'hacker_tag' in active_types,
        'active_exposer': 'exposer' in active_types,
        
        # Legacy fields for backward compatibility
        'active_tags': active_types,
        'has_any_enhancer': len(all_owned_types) > 0,
        'has_active_enhancer': len(active_types) > 0,
        
        # Detailed information
        'owned_enhancers': [
            {
                'type': ue.enhancer.enhancer_type,
                'name': ue.enhancer.name,
                'purchased_at': ue.purchased_at,
                'purchase_price': ue.purchase_price,
                'is_active': ue.is_active,
            } for ue in all_user_enhancers
        ]
    }
    
    return enhancer_data

from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings

class CustomUserManager(BaseUserManager):
    def create_user(self, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        # Remove username from extra_fields if it exists
        extra_fields.pop('username', None)
        user = self.model(
            email=email,
            username=email,  # Set username to email
            full_name=full_name,
            **extra_fields
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        """
        Create superuser with admin limit enforcement
        Maximum 5 admins allowed (1 superadmin + 4 regular admins)
        """
        from django.db.models import Q
        
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        
        # Check current admin count
        admin_count = self.filter(
            Q(is_staff=True) | Q(is_superuser=True) | Q(role='admin')
        ).count()
        
        # Enforce 5 admin limit
        if admin_count >= 5:
            raise ValueError('Unable to create admin user.')
        
        return self.create_user(email, full_name, password, **extra_fields)

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('customer', 'Customer'),
    )
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, db_index=True)  # Index for search
    wallet_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    ads_count = models.PositiveIntegerField(default=0, editable=False)
    user_access_code = models.CharField(max_length=20, blank=True, null=True, db_index=True)  # Index for search
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer', db_index=True)  # Index for filtering
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Index for ordering and filtering
    is_negative = models.BooleanField(default=False, db_index=True)  # Index for filtering banned users
    
    # Free matches tracking (5 per week limit for customers)
    weekly_free_matches_count = models.PositiveIntegerField(default=0, editable=False)
    free_matches_week_start = models.DateTimeField(null=True, blank=True, editable=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()
    
    class Meta:
        indexes = [
            models.Index(fields=['-created_at'], name='user_created_at_desc_idx'),
            models.Index(fields=['is_negative', 'role'], name='user_negative_role_idx'),
            models.Index(fields=['role', '-created_at'], name='user_role_created_idx'),
        ]

    def __str__(self):
        return f'{self.email}  {self.id}'


class DeletionReason(models.Model):

    
    deleted_user_full_name = models.CharField(max_length=255)
    deleted_user_email = models.EmailField()
    reason = models.CharField(max_length=100)
    other_reason_text = models.TextField(blank=True, null=True)
    deleted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-deleted_at']
        verbose_name = 'Deletion Reason'
        verbose_name_plural = 'Deletion Reasons'
    
    def __str__(self):
        return f'{self.deleted_user_email} - {self.reason}'


class Block(models.Model):
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="blocked_users",
        on_delete=models.CASCADE,
        db_index=True  # Index for faster lookups
    )
    blocked = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="blocked_by",
        on_delete=models.CASCADE,
        db_index=True  # Index for faster lookups
    )
    reason = models.TextField(blank=True, null=True)  # e.g. "Inappropriate Name", optional
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Index for ordering

    class Meta:
        unique_together = ("blocker", "blocked")  # prevent duplicate blocks
        ordering = ['-created_at']
        verbose_name = 'Block'
        verbose_name_plural = 'Blocks'
        indexes = [
            models.Index(fields=['blocker', '-created_at'], name='block_blocker_created_idx'),
            models.Index(fields=['blocked', '-created_at'], name='block_blocked_created_idx'),
        ]

    def __str__(self):
        return f"{self.blocker.email} blocked {self.blocked.email}"
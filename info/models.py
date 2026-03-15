from django.db import models
from django.conf import settings


class AdminActivityLog(models.Model):
    """
    Tracks all admin activities for auditing and security purposes.
    This model is READ-ONLY and cannot be edited or deleted via admin.
    """
    
    ACTION_CHOICES = (
        # CRUD Operations
        ('create', 'Create'),
        ('read', 'Read/View'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        
        # Model Access
        ('view_list', 'View List'),
        ('view_detail', 'View Detail'),
        
        # Transaction Actions
        ('approve_credit', 'Approve Credit Transaction'),
        ('approve_withdraw', 'Approve Withdraw Transaction'),
        ('reject_credit', 'Reject Credit Transaction'),
        ('reject_withdraw', 'Reject Withdraw Transaction'),
        
        # Result Verification
        ('magic_verify', 'Magic Verifier'),
        ('verify_result', 'Verify Result'),
        ('reject_result', 'Reject Result'),
        
        # Game Setting Issues
        ('resolve_issue', 'Resolve Game Setting Issue'),
        ('reject_issue', 'Reject Game Setting Issue'),
        
        # Notifications & Alerts
        ('send_alert', 'Send Alert'),
        ('broadcast_alert', 'Broadcast Alert'),
        ('send_notification', 'Send Notification'),
        
        # Tournament Actions
        ('create_tournament', 'Create Tournament'),
        ('send_credentials', 'Send Tournament Credentials'),
        ('update_tournament', 'Update Tournament'),
        
        # User Management
        ('view_user_stats', 'View User Statistics'),
        ('ban_user', 'Ban User'),
        ('unban_user', 'Unban User'),
        
        # Admin Actions
        ('login', 'Admin Login'),
        ('logout', 'Admin Logout'),
        ('toggle_auto_verification', 'Toggle Auto Verification'),
        
        # System Actions
        ('export_data', 'Export Data'),
        ('import_data', 'Import Data'),
        ('change_settings', 'Change Settings'),
    )
    
    # Who performed the action (stored as plain text, no FK dependency)
    admin_email = models.EmailField(
        verbose_name='Admin Email',
        help_text='Email of the admin who performed the action',
        db_index=True
    )
    admin_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Admin Name',
        help_text='Full name of the admin who performed the action'
    )
    admin_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Admin User ID',
        help_text='ID of the admin user (for reference only, not a foreign key)'
    )
    
    # What action was performed
    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES,
        verbose_name='Action Type',
        db_index=True
    )
    
    # Description of the action
    description = models.TextField(
        verbose_name='Description',
        help_text='Detailed description of the action performed'
    )
    
    # Optional: What model/object was affected
    content_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Model Name',
        help_text='Name of the model that was affected'
    )
    object_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Object ID',
        help_text='ID of the object that was affected'
    )
    
    # When it happened
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Timestamp',
        db_index=True
    )
    
    # Additional metadata
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        verbose_name='IP Address'
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name='User Agent'
    )
    
    class Meta:
        verbose_name = 'Learn'
        verbose_name_plural = 'Learn'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at'], name='info_created_idx'),
            models.Index(fields=['admin_email', '-created_at'], name='info_admin_created_idx'),
            models.Index(fields=['action', '-created_at'], name='info_action_created_idx'),
            models.Index(fields=['admin_id', '-created_at'], name='info_admin_id_created_idx'),
        ]
        # Prevent deletion and modification
        permissions = [
            ('view_all_logs', 'Can view all activity logs'),
        ]
    
    def __str__(self):
        return f"{self.admin_email} - {self.get_action_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        # Only allow creation, not updates
        if self.pk is not None:
            raise ValueError("Admin Activity Logs cannot be modified once created")
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # Prevent deletion
        raise ValueError("Admin Activity Logs cannot be deleted")

from django.db import models
from django.conf import settings


class Qr(models.Model):
    """
    Model to store QR code images.
    """
    qr_image = models.ImageField(upload_to='qr_images/')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "QR Code"
        verbose_name_plural = "QR Codes"
    
    def __str__(self):
        return f"QR Code {self.id} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"


class Phrase(models.Model):
    """
    Model to store text phrases.
    """
    text = models.TextField()
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Phrase"
        verbose_name_plural = "Phrases"
    
    def __str__(self):
        return self.text[:50] + "..." if len(self.text) > 50 else self.text


class SystemSettings(models.Model):
    """
    System-wide configuration settings
    Singleton model - only one instance exists
    """
    auto_magic_verification_enabled = models.BooleanField(
        default=True,
        verbose_name="Auto Magic Verification",
        help_text="Enable automatic magic verification every 5 minutes via Celery Beat"
    )
    
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='system_settings_updates'
    )
    
    class Meta:
        verbose_name = "System Settings"
        verbose_name_plural = "System Settings"
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists (Singleton pattern)
        if not self.pk and SystemSettings.objects.exists():
            # If trying to create a new instance, update the existing one instead
            existing = SystemSettings.objects.first()
            existing.auto_magic_verification_enabled = self.auto_magic_verification_enabled
            existing.updated_by = self.updated_by
            existing.save()
            return existing
        return super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """Get or create the singleton settings instance"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings
    
    def __str__(self):
        return f"System Settings (Auto Verification: {'ON' if self.auto_magic_verification_enabled else 'OFF'})"


class ActiveIOSDevice(models.Model):
    """
    Model to on/off ios UI. # Used for conditional Rendering
    """
    is_ios_active = models.BooleanField(default=False)


class ActiveLoadWay(models.Model):
    """
    Model to on/off load ways. # Used for conditional Rendering
    """
    is_static_active = models.BooleanField(default=False)
    is_dynamic_active = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Active Load Way"
        verbose_name_plural = "Active Load Ways"

    def __str__(self):
        return f"Active Load Way {self.id}"


class ActiveStore(models.Model):
    """
    Model to on/off game stores. # Used for conditional Rendering
    """
    is_efootball_store_active = models.BooleanField(default=False)
    is_freefire_store_active = models.BooleanField(default=False)
    is_pubg_store_active = models.BooleanField(default=False)
    is_mlbb_store_active = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Active Store"
        verbose_name_plural = "Active Stores"

    def __str__(self):
        return f"Active Store {self.id}"


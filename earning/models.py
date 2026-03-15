from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Earning(models.Model):
    class Source(models.TextChoices):
        OPEN_GAME = 'OPEN_GAME', 'Open Game'  # 10% service fee per completed open game
        TOURNAMENT = 'TOURNAMENT', 'Tournament'  # Remaining after prize distribution
        ENHANCEMENT = 'ENHANCEMENT', 'Enhancement Sale'  # Selling tags, exposure, etc.
        AD_WATCH = 'AD_WATCH', 'Ad Watch'  # 1 ad = 0.03

    source = models.CharField(max_length=20, choices=Source.choices, db_index=True)

    # Monetary amounts stored as Decimal for precision
    # Base amount: gross amount before fees/prize distribution (e.g., total tournament pot)
    base_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    # Net earning amount for the platform (after calculations)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    # Optional percentage (e.g., 10% service fee for open games)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                     help_text="If applicable, the percentage used to derive amount (e.g. 10 for 10%).")

    # Generic relation to reference the originating object: Challenge/Game, Tournament, Enhancement purchase, Ad log
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.PositiveBigIntegerField(null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')

    note = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['source']),
            models.Index(fields=['created_at']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['source', 'content_type', 'object_id'], name='unique_earning_per_object_source')
        ]

    def __str__(self):
        return f"{self.get_source_display()} - {self.amount}"
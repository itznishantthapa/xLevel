from django.db import models
from user.models import CustomUser


class Product(models.Model):
    GAME_CHOICES = [
        ('freefire', 'Free Fire'),
        ('pubg', 'PUBG'),
        ('mlbb', 'MLBB'),
        ('efootball', 'eFootball'),
    ]

    TYPE_CHOICES = [
        ('diamond', 'Diamond'),
        ('uc', 'UC'),
        ('coin', 'Coin'),
        ('membership', 'Membership'),
        ('levelup', 'Level Up'),
        ('evoaccess', 'Evo Access'),
        ('pass', 'Pass'),
    ]

    game = models.CharField(max_length=20, choices=GAME_CHOICES, db_index=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)
    label = models.CharField(max_length=50)
    quantity = models.IntegerField(null=True, blank=True)
    points = models.IntegerField()
    image = models.ImageField(upload_to='store/', null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['game', 'type', 'points']

    def __str__(self):
        return f"{self.get_game_display()} – {self.label}"


class TopupRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='topup_requests')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests')

    # Game identity fields — only the relevant ones are filled per game
    uid = models.CharField(max_length=100, blank=True, null=True)         # Free Fire, PUBG, MLBB
    zone_id = models.CharField(max_length=50, blank=True, null=True)      # MLBB only
    username = models.CharField(max_length=100, blank=True, null=True)    # eFootball (account email)
    password = models.CharField(max_length=100, blank=True, null=True)    # eFootball
    request_item_image = models.ImageField(upload_to='store/requests/', null=True, blank=True)  # eFootball item screenshot

    points_deducted = models.IntegerField()  # snapshot at purchase time
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    admin_notes = models.TextField(blank=True, null=True)
    processed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='processed_topup_requests',
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        product_label = str(self.product) if self.product else 'eFootball Custom'
        return f"{self.user.full_name} – {product_label} – {self.get_status_display()}"

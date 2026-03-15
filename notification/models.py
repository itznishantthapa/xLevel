from django.db import models
from user.models import CustomUser
from challenge.models import Challenge

class Notification(models.Model):
    TYPE_CHOICES = (
        ('game', 'Game'),
        ('credited', 'Credited'),
        ('normal', 'Normal'),
        ('store', 'Store'),
    )
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    message = models.TextField()
    room_id = models.CharField(max_length=100, blank=True, null=True)
    room_pass = models.CharField(max_length=100, blank=True, null=True)
    join_url = models.URLField(blank=True, null=True)
    team_code = models.CharField(max_length=100, blank=True, null=True)
    lobby_id = models.CharField(max_length=100, blank=True, null=True, help_text="Lobby ID for MLBB game joining")
    challenge = models.ForeignKey(Challenge, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.full_name} - {self.notification_type}"






class Banner(models.Model):
    image = models.ImageField(upload_to='banners/',blank=True,null=True)
    url = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"Banner {self.id}"





class FCMToken(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='fcm_tokens')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=False)


    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}'s FCM Token"

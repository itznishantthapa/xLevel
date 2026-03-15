from django.db import models
from game.models import Game


class Guide(models.Model):
    """
    Model to store guide images for submitting results.
    Provides visual instructions for users on how to properly submit screenshots.
    """
    GUIDE_TYPE_CHOICES = (
        ('result', 'Result'),
    )
    
    # Foreign Keys
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='guides')
    
    # Guide details
    game_mode = models.CharField(max_length=100)
    guide_type = models.CharField(max_length=20, choices=GUIDE_TYPE_CHOICES)
    
    # Guide images
    image1 = models.ImageField(upload_to='guide_images/')
    image2 = models.ImageField(upload_to='guide_images/')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['game', 'game_mode', 'guide_type']
        unique_together = ['game', 'game_mode', 'guide_type']  # Each guide should be unique per game/mode/type
        verbose_name = "Guide"
        verbose_name_plural = "Guides"
    
    def __str__(self):
        return f"{self.game.name} - {self.game_mode} - {self.get_guide_type_display()}"

from django.db import models
from django.utils import timezone
from challenge.models import Challenge, ChallengeParticipant

class Result(models.Model):
    """
    Simple model to store challenge results with screenshots for review
    """
    RESULT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    GAME_RESULT_CHOICES = (
        ('win', 'Win'),
        ('lose', 'Lose'),
        ('draw', 'Draw'),
    )

    # Core relationships
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='results')
    participant = models.ForeignKey(ChallengeParticipant, on_delete=models.CASCADE, related_name='result')
    
    # Screenshots (screenshot_2 is optional for chess games)
    screenshot_1 = models.ImageField(upload_to='result_screenshots/')
    screenshot_2 = models.ImageField(upload_to='result_screenshots/', null=True, blank=True)
    
    # Status and timestamps
    status = models.CharField(max_length=20, choices=RESULT_STATUS_CHOICES, default='pending')
    submission_count = models.IntegerField(default=1)  # Track number of submissions
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Game outcome (win/lose/draw)
    game_result = models.CharField(max_length=10, choices=GAME_RESULT_CHOICES, null=True, blank=True)
    
    class Meta:
        # Ensure each participant can only submit one result per challenge
        unique_together = ['challenge', 'participant']
    
    def __str__(self):
        return f"Result for {self.challenge} ({self.status})"

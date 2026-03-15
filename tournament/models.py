from django.db import models
from user.models import CustomUser
from game.models import Game


class Tournament(models.Model):
    """
    Official tournaments/challenges created by admin.
    Main tournament model with multiple time slots support.
    """
    STATUS_CHOICES = (
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    WIN_TYPE_CHOICES = (
        ('placement', 'Placement'),
        ('per_kill', 'Per Kill'),
    )
    
    # Basic Information
    title = models.CharField(max_length=100)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    game_mode = models.CharField(max_length=50, null=True, blank=True)
    game_date = models.DateField(help_text="Date when the tournament will be held")
    
    # Entry Configuration
    entry_fee = models.IntegerField(default=0)
    is_free = models.BooleanField(default=False)
    max_player = models.IntegerField(help_text="Maximum players allowed in tournament")
    player_joined = models.IntegerField(default=0)
    
    # Win Type & Prize Configuration
    win_type = models.CharField(max_length=20, choices=WIN_TYPE_CHOICES, default='placement')
    prize = models.CharField(max_length=100, null=True, blank=True, help_text="Prize description")
    
    # Placement-based prizes
    prize_position_upto = models.IntegerField(null=True, blank=True, help_text="Number of top positions that get prizes")
    top_position_prize = models.IntegerField(null=True, blank=True, help_text="Prize for top position")
    
    # Per-kill prizes
    per_kill_point = models.IntegerField(null=True, blank=True, help_text="Points awarded per kill")
    
    # Tournament Features
    access_based = models.BooleanField(default=False, help_text="Restrict based on user access level")
    enable_slots = models.BooleanField(default=False, help_text="Enable slot assignment for participants")
    
    # Status & Tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='tournaments_created')
    winner = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='tournaments_won')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Result tracking
    at_least_one_result_submitted = models.BooleanField(default=False)
    
    class Meta:
        indexes = [
            models.Index(fields=['game']),
            models.Index(fields=['game_mode']),
            models.Index(fields=['game_date']),
            models.Index(fields=['status']),
            models.Index(fields=['created_by']),
            models.Index(fields=['created_at']),
            models.Index(fields=['game', 'game_date']),
        ]
        ordering = ['-game_date', '-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.game_date}"
    
    @property
    def is_full(self):
        """Check if tournament has reached max players"""
        return self.player_joined >= self.max_player
    
    @property
    def available_slots(self):
        """Return number of available slots"""
        return max(0, self.max_player - self.player_joined)


class TournamentTime(models.Model):
    """
    Time slots for tournaments. Players can register for specific time slots.
    Each time slot has its own game room details.
    """
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='time_slots')
    time_slot = models.CharField(max_length=20, help_text="Time in format like '9:00 AM', '2:30 PM'")
    
    # Slot capacity
    max_players = models.IntegerField(default=0, help_text="Max players for this time slot")
    players_registered = models.IntegerField(default=0)
    
    # Game Room Details (specific to this time slot)
    room_id = models.CharField(max_length=50, null=True, blank=True, help_text="Room ID for this time slot")
    room_pass = models.CharField(max_length=50, null=True, blank=True, help_text="Room password for this time slot")
    join_url = models.URLField(null=True, blank=True, help_text="Join URL for this time slot")
    
    # Status
    is_active = models.BooleanField(default=True)
    is_full = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['tournament']),
            models.Index(fields=['time_slot']),
            models.Index(fields=['is_active']),
        ]
        unique_together = [('tournament', 'time_slot')]
        ordering = ['time_slot']
    
    def __str__(self):
        return f"{self.tournament.title} - {self.time_slot}"
    
    @property
    def available_slots(self):
        """Return number of available slots for this time"""
        return max(0, self.max_players - self.players_registered)
    
    def check_and_update_full_status(self):
        """Update is_full based on registrations"""
        self.is_full = self.players_registered >= self.max_players
        self.save(update_fields=['is_full'])


class TournamentParticipant(models.Model):
    """
    Participants registered for tournaments with their selected time slots.
    """
    RESULT_CHOICES = (
        ('pending', 'Pending'),
        ('won', 'Won'),
        ('lost', 'Lost'),
        ('draw', 'Draw'),
        ('disqualified', 'Disqualified'),
    )
    
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='participants')
    tournament_time = models.ForeignKey(TournamentTime, on_delete=models.SET_NULL, null=True, blank=True, 
                                       related_name='participants', help_text="Selected time slot")
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='tournament_participations')
    
    # Registration info
    registered_at = models.DateTimeField(auto_now_add=True)
    is_confirmed = models.BooleanField(default=False)
    
    # Result tracking
    result_status = models.CharField(max_length=20, choices=RESULT_CHOICES, default='pending')
    
    # Prize tracking
    is_winner = models.BooleanField(default=False)
    is_top_positioned = models.BooleanField(default=False)
    prize_awarded = models.IntegerField(null=True, blank=True, help_text="Total prize credited in crowns/points")
    
    # Per-kill tracking
    kill_count = models.IntegerField(default=0, help_text="Number of kills (for per_kill tournaments)")
    
    # Slot assignment
    slot_number = models.IntegerField(null=True, blank=True, help_text="Assigned slot number for tournament")
    
    # Timestamps
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['tournament']),
            models.Index(fields=['tournament_time']),
            models.Index(fields=['user']),
            models.Index(fields=['result_status']),
            models.Index(fields=['registered_at']),
        ]
        # Allow same user to join different time slots of same tournament
        # but prevent duplicate registration for same time slot
        unique_together = [('tournament', 'tournament_time', 'user')]
        ordering = ['-registered_at']
    
    def __str__(self):
        user_name = self.user.full_name if self.user else "Unknown User"
        return f"{user_name} - {self.tournament.title}"

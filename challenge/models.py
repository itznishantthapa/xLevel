 




        # models.py
from django.db import models
from user.models import CustomUser
from game.models import Game

class Challenge(models.Model):
    STATUS_CHOICES = (
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    )
    WIN_TYPE_CHOICES = (
        ('placement', 'Placement'),
        ('per_kill', 'Per Kill'),

    )
    
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    game_mode = models.CharField(max_length=50, null=True, blank=True)
    is_accepted = models.BooleanField(default=False)
    entry_fee = models.IntegerField(null=True, blank=True)
    is_free = models.BooleanField(default=False)
    max_player = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='created_challenges')
    winner = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_challenges')
    created_at = models.DateTimeField(auto_now_add=True)
    resend_limit = models.IntegerField(default=2)
    accept_limit = models.IntegerField(default=1)
    cancelled = models.BooleanField(default=False)
    cancelled_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_challenges')
    player_joined = models.IntegerField(default=0)
    start_time = models.CharField(max_length=20, null=True, blank=True)
    title = models.CharField(max_length=100, null=True, blank=True)
    win_type=models.CharField(max_length=20, choices=WIN_TYPE_CHOICES, default='placement')
    access_based = models.BooleanField(default=False)
    prize=models.CharField(max_length=100, null=True, blank=True)
    prize_position_upto=models.IntegerField(null=True, blank=True)
    top_position_prize=models.IntegerField(null=True, blank=True)
    per_kill_point=models.IntegerField(null=True, blank=True)
    at_least_one_result_submitted=models.BooleanField(default=False,blank=True)
    enable_slots = models.BooleanField(default=False, help_text="Enable slot assignment for tournament participants")


        # New fields for team/room joining
    team_code = models.CharField(max_length=50, null=True, blank=True)
    room_id = models.CharField(max_length=50, null=True, blank=True)
    room_pass = models.CharField(max_length=50, null=True, blank=True)
    join_url = models.URLField(null=True, blank=True)
    lobby_id = models.CharField(max_length=50, null=True, blank=True, help_text="Lobby ID for MLBB game joining")

    class Meta:
        indexes = [
            models.Index(fields=['game']),
            models.Index(fields=['game_mode']),
            models.Index(fields=['created_by']),
            models.Index(fields=['winner']),
            models.Index(fields=['cancelled_by']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['game', 'game_mode']),
        ]

    def __str__(self):
        return self.title or f"Challenge {self.id}"


class ChallengeParticipant(models.Model):
    RESULT_CHOICES = (
        ('pending', 'Pending'),
        ('won', 'Won'),
        ('lost', 'Lost'),
        ('draw', 'Draw'),
        ('left', 'Left')
    )
    
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    attempt_no = models.IntegerField(default=1)
    is_confirmed = models.BooleanField(default=False)
    result_status = models.CharField(max_length=20, choices=RESULT_CHOICES, default='pending')
    joined_at = models.DateTimeField(auto_now_add=True)
    # Prize tracking fields
    is_winner = models.BooleanField(default=False)
    is_top_positioned = models.BooleanField(default=False)
    prize_awarded = models.IntegerField(null=True, blank=True, help_text="Total prize credited in crowns/points")
    kill_count = models.IntegerField(default=0, help_text="Number of kills (for per_kill win_type challenges)")
    # Tournament slot assignment
    slot_number = models.IntegerField(null=True, blank=True, help_text="Assigned slot number for tournament participation")

    class Meta:
        indexes = [
            models.Index(fields=['challenge']),
            models.Index(fields=['user']),
            models.Index(fields=['result_status']),
            models.Index(fields=['joined_at']),
        ]
        unique_together = [('challenge', 'user', 'attempt_no')]

    def __str__(self):
        challenge_title = self.challenge.title if self.challenge else "Unknown Challenge"
        user_name = self.user.full_name if self.user else "Unknown User"
        return f"{user_name} - {challenge_title}"


class Refund(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    )
    
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    amount = models.IntegerField()  # Refund amount in points
    reason = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['challenge']),
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['challenge', 'user']),
        ]

    def __str__(self):
        return f"Refund {self.id} - {self.user.full_name} - {self.amount} points"


# Game-specific settings models
class ChessSettings(models.Model):
    COLOR_CHOICES = (
        ('white', 'White'),
        ('black', 'Black'),
        ('random', 'Random'),
    )
    
    challenge = models.OneToOneField(Challenge, on_delete=models.CASCADE)
    time_control = models.CharField(max_length=50)
    game_type = models.CharField(max_length=50)
    rated = models.BooleanField(default=False)
    opponent_color = models.CharField(max_length=20, choices=COLOR_CHOICES)

    def __str__(self):
        return f"Chess Settings - Challenge {self.challenge.id}"


class EFootballSettings(models.Model):
    challenge = models.OneToOneField(Challenge, on_delete=models.CASCADE)
    team_type = models.CharField(max_length=50)
    match_type = models.CharField(max_length=50)
    match_time = models.IntegerField(default=90)
    injuries = models.BooleanField(default=True)
    extra_time = models.BooleanField(default=False)
    penalties = models.BooleanField(default=False)
    substitution = models.IntegerField(default=3)
    sub_interval = models.IntegerField(default=3)
    home_condition = models.CharField(max_length=50, null=True, blank=True)
    away_condition = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"eFootball Settings - Challenge {self.challenge.id}"


class PubgTdmSettings(models.Model):
    challenge = models.OneToOneField(Challenge, on_delete=models.CASCADE)
    fight_type = models.CharField(max_length=50)
    gun_to_use = models.CharField(max_length=100, null=True, blank=True)
    grenade = models.BooleanField(default=False)
    slide = models.BooleanField(default=False)
    mode = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"PUBG TDM Settings - Challenge {self.challenge.id}"


class PubgWowSettings(models.Model):
    challenge = models.OneToOneField(Challenge, on_delete=models.CASCADE)
    fight_type = models.CharField(max_length=50)
    map_code = models.CharField(max_length=50, null=True, blank=True)
    fight_range = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"PUBG WoW Settings - Challenge {self.challenge.id}"


class FreefireClashSettings(models.Model):
    challenge = models.OneToOneField(Challenge, on_delete=models.CASCADE)
    fight_type = models.CharField(max_length=50)
    character_skill = models.BooleanField(default=False)
    headshot = models.BooleanField(default=False)
    limited_ammo = models.BooleanField(default=False)
    round = models.CharField(max_length=50, null=True, blank=True)
    gun_attribute = models.BooleanField(default=False)
    default_coin = models.IntegerField(null=True, blank=True)
    ep = models.IntegerField(null=True, blank=True)
    device_type = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"FreeFire Clash Settings - Challenge {self.challenge.id}"


class FreefireLonewolfSettings(models.Model):
    challenge = models.OneToOneField(Challenge, on_delete=models.CASCADE)
    fight_type = models.CharField(max_length=50)

    def __str__(self):
        return f"FreeFire Lonewolf Settings - Challenge {self.challenge.id}"


class MlbbBrawlSettings(models.Model):
    challenge = models.OneToOneField(Challenge, on_delete=models.CASCADE)
    fight_type = models.CharField(max_length=50)

    def __str__(self):
        return f"MLBB Brawl Settings - Challenge {self.challenge.id}"


class MlbbClassicSettings(models.Model):
    challenge = models.OneToOneField(Challenge, on_delete=models.CASCADE)
    fight_type = models.CharField(max_length=50)
    lane = models.CharField(max_length=50, null=True, blank=True)
    hero_class = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"MLBB Classic Settings - Challenge {self.challenge.id}"

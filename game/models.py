from django.db import models
from user.models import CustomUser

class Game(models.Model):
    name = models.CharField(max_length=100, unique=True)
    game_modes = models.CharField(max_length=255, blank=True, null=True)  # Store as comma-separated values
    game_logo = models.ImageField(upload_to='game_logos/', blank=True, null=True)

    def __str__(self):
        return self.name + " - " + str(self.id)
    
    class Meta:
        ordering = ['name']


class GameModeRules(models.Model):
    """
    Stores rules for different game modes of each game.
    Each game can have multiple modes (e.g., Clash Squad, Battle Royale)
    and each mode can have multiple rules.
    """
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='mode_rules')
    game_mode = models.CharField(max_length=100)
    rule1 = models.TextField(help_text="First rule of the game mode", blank=True, null=True)
    rule2 = models.TextField(help_text="Second rule of the game mode", blank=True, null=True)
    rule3 = models.TextField(help_text="Third rule of the game mode", blank=True, null=True)
    rule4 = models.TextField(help_text="Fourth rule of the game mode", blank=True, null=True)
    rule5 = models.TextField(help_text="Fifth rule of the game mode", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['game', 'game_mode']
        unique_together = ['game', 'game_mode']  # Each game mode should be unique per game
        verbose_name = "Game Mode Rules"
        verbose_name_plural = "Game Mode Rules"

    def __str__(self):
        return f"{self.game.name} - {self.game_mode}"

    def get_rules(self):
        """Returns rules as a dictionary for API responses"""
        return {
            "rule1": self.rule1,
            "rule2": self.rule2,
            "rule3": self.rule3
        }

class PlayerGameProfile(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    game_username = models.CharField(max_length=100,blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.full_name} - {self.game.name} "



class ChessGameProfile(models.Model):
    profile = models.OneToOneField(PlayerGameProfile, on_delete=models.CASCADE, related_name="chess_profile")
    total_games_played = models.IntegerField(blank=True, null=True)
    rapid_rating = models.IntegerField(blank=True, null=True)
    blitz_rating = models.IntegerField(blank=True, null=True)
    bullet_rating = models.IntegerField(blank=True, null=True)


class FreeFireGameProfile(models.Model):
    profile = models.OneToOneField(PlayerGameProfile, on_delete=models.CASCADE, related_name="freefire_profile")
    uid = models.CharField(max_length=100, blank=True, null=True)
    level = models.IntegerField(blank=True, null=True)


class PubgGameProfile(models.Model):
    profile = models.OneToOneField(PlayerGameProfile, on_delete=models.CASCADE, related_name="pubg_profile")
    uid = models.CharField(max_length=100, blank=True, null=True)
    level = models.IntegerField(blank=True, null=True)


class EFootballGameProfile(models.Model):
    profile = models.OneToOneField(PlayerGameProfile, on_delete=models.CASCADE, related_name="efootball_profile")
    uid = models.CharField(max_length=100, blank=True, null=True)
    current_division = models.IntegerField(blank=True, null=True)
    highest_division = models.IntegerField(blank=True, null=True)
    courtesy_rating = models.CharField(max_length=3, blank=True, null=True)


class MLBBGameProfile(models.Model):
    profile = models.OneToOneField(PlayerGameProfile, on_delete=models.CASCADE, related_name="mlbb_profile")
    uid = models.CharField(max_length=100, blank=True, null=True)
    server_id = models.CharField(max_length=50, blank=True, null=True)
    current_rank = models.CharField(max_length=50, blank=True, null=True)
    highest_rank = models.CharField(max_length=50, blank=True, null=True)
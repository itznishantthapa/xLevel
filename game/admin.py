from django.contrib import admin
from info.admin_base import LoggingModelAdmin
from .models import Game, PlayerGameProfile, GameModeRules, PubgGameProfile, ChessGameProfile, EFootballGameProfile, FreeFireGameProfile, MLBBGameProfile

# Game Admin Configuration
@admin.register(Game)
class GameAdmin(LoggingModelAdmin):
    list_display = ['name', 'id', 'game_modes']
    search_fields = ['name', 'game_modes']
    list_filter = ['name']
    ordering = ['name']

# Game Mode Rules Admin Configuration
@admin.register(GameModeRules)
class GameModeRulesAdmin(LoggingModelAdmin):
    list_display = ['game', 'game_mode', 'created_at']
    search_fields = ['game__name', 'game_mode']
    list_filter = ['game', 'game_mode', 'created_at']
    ordering = ['game', 'game_mode']

# Inline admin for game-specific profiles
class ChessGameProfileInline(admin.StackedInline):
    model = ChessGameProfile
    extra = 0
    can_delete = False
    fields = ['total_games_played', 'rapid_rating', 'blitz_rating', 'bullet_rating']
    verbose_name = "Chess Profile Details"
    verbose_name_plural = "Chess Profile Details"

class FreeFireGameProfileInline(admin.StackedInline):
    model = FreeFireGameProfile
    extra = 0
    can_delete = False
    fields = ['uid', 'level']
    verbose_name = "Free Fire Profile Details"
    verbose_name_plural = "Free Fire Profile Details"

class PubgGameProfileInline(admin.StackedInline):
    model = PubgGameProfile
    extra = 0
    can_delete = False
    fields = ['uid', 'level']
    verbose_name = "PUBG Profile Details"
    verbose_name_plural = "PUBG Profile Details"

class EFootballGameProfileInline(admin.StackedInline):
    model = EFootballGameProfile
    extra = 0
    can_delete = False
    fields = ['uid', 'current_division', 'highest_division', 'courtesy_rating']
    verbose_name = "eFootball Profile Details"
    verbose_name_plural = "eFootball Profile Details"

class MLBBGameProfileInline(admin.StackedInline):
    model = MLBBGameProfile
    extra = 0
    can_delete = False
    fields = ['uid', 'server_id', 'current_rank', 'highest_rank']
    verbose_name = "MLBB Profile Details"
    verbose_name_plural = "MLBB Profile Details"

# Player Game Profile Admin Configuration with Enhanced Search and Inline Editing
@admin.register(PlayerGameProfile)
class PlayerGameProfileAdmin(LoggingModelAdmin):
    list_display = ['user', 'game', 'game_username', 'created_at', 'updated_at']
    search_fields = [
        'user__username',           # Search by username
        'user__full_name',          # Search by full name
        'user__email',              # Search by email
        'user__user_access_code',   # Search by user access code
        'game__name',               # Search by game name
        'game_username',            # Search by game username
    ]
    list_filter = [
        'game',                     # Filter by game
        'created_at',               # Filter by creation date
        'updated_at',               # Filter by update date
    ]
    ordering = ['-created_at']     # Most recent first
    date_hierarchy = 'created_at'  # Date navigation
    list_per_page = 50             # Pagination
    
    # Allow quick editing of game_username directly from list view
    list_editable = ['game_username']
    
    # Show related fields in the form
    autocomplete_fields = ['user', 'game']
    
    # Make all fields editable in detail view
    fields = ['user', 'game', 'game_username', 'created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    
    # Add inline editing for game-specific profiles
    inlines = [ChessGameProfileInline, FreeFireGameProfileInline, PubgGameProfileInline, EFootballGameProfileInline, MLBBGameProfileInline]
    
    def get_queryset(self, request):
        # Optimize queries by selecting related objects
        return super().get_queryset(request).select_related('user', 'game')
    
    def get_inline_instances(self, request, obj=None):
        """Only show the inline that matches the game type"""
        if obj is None:
            return []
        
        inlines = []
        game_name = obj.game.name.lower()
        
        if 'chess' in game_name:
            inlines.append(ChessGameProfileInline(self.model, self.admin_site))
        elif 'free fire' in game_name:
            inlines.append(FreeFireGameProfileInline(self.model, self.admin_site))
        elif 'pubg' in game_name:
            inlines.append(PubgGameProfileInline(self.model, self.admin_site))
        elif 'efootball' in game_name or 'football' in game_name:
            inlines.append(EFootballGameProfileInline(self.model, self.admin_site))
        elif 'mlbb' in game_name:
            inlines.append(MLBBGameProfileInline(self.model, self.admin_site))
        
        return inlines

# Chess Game Profile Admin Configuration
@admin.register(ChessGameProfile)
class ChessGameProfileAdmin(LoggingModelAdmin):
    list_display = ['get_user', 'get_game_username', 'rapid_rating', 'blitz_rating', 'bullet_rating', 'total_games_played']
    search_fields = [
        'profile__user__username',
        'profile__user__full_name',
        'profile__user__email',
        'profile__user__user_access_code',
        'profile__game_username',
    ]
    list_filter = ['rapid_rating', 'blitz_rating', 'bullet_rating']
    ordering = ['-rapid_rating']
    
    # Allow quick editing from list view
    list_editable = ['rapid_rating', 'blitz_rating', 'bullet_rating', 'total_games_played']
    
    # Make all fields editable in detail view
    fields = ['profile', 'total_games_played', 'rapid_rating', 'blitz_rating', 'bullet_rating']
    autocomplete_fields = ['profile']
    
    def get_user(self, obj):
        return obj.profile.user.full_name
    get_user.short_description = 'Player'
    get_user.admin_order_field = 'profile__user__full_name'
    
    def get_game_username(self, obj):
        return obj.profile.game_username
    get_game_username.short_description = 'Chess Username'
    get_game_username.admin_order_field = 'profile__game_username'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile__user', 'profile__game')

# Free Fire Game Profile Admin Configuration
@admin.register(FreeFireGameProfile)
class FreeFireGameProfileAdmin(LoggingModelAdmin):
    list_display = ['get_user', 'get_game_username', 'uid', 'level']
    search_fields = [
        'profile__user__username',
        'profile__user__full_name',
        'profile__user__email',
        'profile__user__user_access_code',
        'profile__game_username',
        'uid',
    ]
    list_filter = ['level']
    ordering = ['-level']
    
    # Allow quick editing from list view
    list_editable = ['uid', 'level']
    
    # Make all fields editable in detail view
    fields = ['profile', 'uid', 'level']
    autocomplete_fields = ['profile']
    
    def get_user(self, obj):
        return obj.profile.user.full_name
    get_user.short_description = 'Player'
    get_user.admin_order_field = 'profile__user__full_name'
    
    def get_game_username(self, obj):
        return obj.profile.game_username
    get_game_username.short_description = 'FreeFire Username'
    get_game_username.admin_order_field = 'profile__game_username'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile__user', 'profile__game')

# PUBG Game Profile Admin Configuration
@admin.register(PubgGameProfile)
class PubgGameProfileAdmin(LoggingModelAdmin):
    list_display = ['get_user', 'get_game_username', 'uid', 'level']
    search_fields = [
        'profile__user__username',
        'profile__user__full_name',
        'profile__user__email',
        'profile__user__user_access_code',
        'profile__game_username',
        'uid',
    ]
    list_filter = ['level']
    ordering = ['-level']
    
    # Allow quick editing from list view
    list_editable = ['uid', 'level']
    
    # Make all fields editable in detail view
    fields = ['profile', 'uid', 'level']
    autocomplete_fields = ['profile']
    
    def get_user(self, obj):
        return obj.profile.user.full_name
    get_user.short_description = 'Player'
    get_user.admin_order_field = 'profile__user__full_name'
    
    def get_game_username(self, obj):
        return obj.profile.game_username
    get_game_username.short_description = 'PUBG Username'
    get_game_username.admin_order_field = 'profile__game_username'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile__user', 'profile__game')

# eFootball Game Profile Admin Configuration
@admin.register(EFootballGameProfile)
class EFootballGameProfileAdmin(LoggingModelAdmin):
    list_display = ['get_user', 'get_game_username', 'uid', 'current_division', 'highest_division', 'courtesy_rating']
    search_fields = [
        'profile__user__username',
        'profile__user__full_name',
        'profile__user__email',
        'profile__user__user_access_code',
        'profile__game_username',
        'uid',
        'courtesy_rating',
    ]
    list_filter = ['current_division', 'highest_division', 'courtesy_rating']
    ordering = ['-highest_division']
    
    # Allow quick editing from list view
    list_editable = ['uid', 'current_division', 'highest_division', 'courtesy_rating']
    
    # Make all fields editable in detail view
    fields = ['profile', 'uid', 'current_division', 'highest_division', 'courtesy_rating']
    autocomplete_fields = ['profile']
    
    def get_user(self, obj):
        return obj.profile.user.full_name
    get_user.short_description = 'Player'
    get_user.admin_order_field = 'profile__user__full_name'
    
    def get_game_username(self, obj):
        return obj.profile.game_username
    get_game_username.short_description = 'eFootball Username'
    get_game_username.admin_order_field = 'profile__game_username'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile__user', 'profile__game')

# MLBB Game Profile Admin Configuration
@admin.register(MLBBGameProfile)
class MLBBGameProfileAdmin(LoggingModelAdmin):
    list_display = ['get_user', 'get_game_username', 'uid', 'server_id', 'current_rank', 'highest_rank']
    search_fields = [
        'profile__user__username',
        'profile__user__full_name',
        'profile__user__email',
        'profile__user__user_access_code',
        'profile__game_username',
        'uid',
    ]
    list_filter = ['current_rank', 'highest_rank']
    ordering = ['-highest_rank']
    
    # Allow quick editing from list view
    list_editable = ['uid', 'server_id', 'current_rank', 'highest_rank']
    
    # Make all fields editable in detail view
    fields = ['profile', 'uid', 'server_id', 'current_rank', 'highest_rank']
    autocomplete_fields = ['profile']
    
    def get_user(self, obj):
        return obj.profile.user.full_name
    get_user.short_description = 'Player'
    get_user.admin_order_field = 'profile__user__full_name'
    
    def get_game_username(self, obj):
        return obj.profile.game_username
    get_game_username.short_description = 'MLBB Username'
    get_game_username.admin_order_field = 'profile__game_username'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile__user', 'profile__game')
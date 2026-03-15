from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
from django.utils import timezone
from django.utils.html import format_html
from .models import Tournament, TournamentTime, TournamentParticipant
import json


class TournamentTimeInline(admin.TabularInline):
    model = TournamentTime
    extra = 1
    fields = ('time_slot', 'max_players', 'players_registered', 'room_id', 'room_pass', 'join_url', 'is_active', 'is_full')
    readonly_fields = ('is_full',)


class TournamentParticipantInline(admin.TabularInline):
    model = TournamentParticipant
    extra = 0
    fields = ('user', 'tournament_time', 'is_confirmed', 'result_status', 'kill_count', 'prize_awarded', 'slot_number')
    readonly_fields = ('registered_at',)
    autocomplete_fields = ['user']


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'view_participants_button',
        'title',
        'game',
        'game_mode',
        'game_date',
        'status',
        'win_type',
        'entry_fee',
        'is_free',
        'player_joined',
        'max_player',
        'get_capacity_display',
        'created_at',
    )
    
    list_filter = (
        'status',
        'win_type',
        'is_free',
        'access_based',
        'enable_slots',
        'game',
        'game_date',
        'created_at',
    )
    
    search_fields = (
        'title',
        'game__name',
        'game_mode',
    )
    
    readonly_fields = (
        'created_at',
        'updated_at',
        'player_joined',
        'at_least_one_result_submitted',
        'get_capacity_display',
    )
    
    autocomplete_fields = ['created_by', 'winner']
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('create-tournament/',
                 self.admin_site.admin_view(self.create_tournament),
                 name='tournament_tournament_create'),
            path('<int:game_id>/game-modes/',
                 self.admin_site.admin_view(self.game_modes_api),
                 name='tournament_game_modes'),
        ]
        return custom_urls + urls
    
    def create_tournament(self, request):
        """AJAX endpoint to create a tournament with time slots."""
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'}, status=405)
        if not request.user.is_staff:
            return JsonResponse({'success': False, 'error': 'Only staff can create tournaments'}, status=403)
        
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({'success': False, 'error': 'Invalid JSON payload'}, status=400)

        # Required fields validation
        required = ['title', 'game_id', 'game_date', 'win_type', 'max_player']
        missing = [r for r in required if not data.get(r)]
        if missing:
            return JsonResponse({'success': False, 'error': f'Missing fields: {", ".join(missing)}'}, status=400)

        from game.models import Game
        try:
            game = Game.objects.get(pk=data['game_id'])
        except Game.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid game id'}, status=400)

        win_type = data['win_type'] if data['win_type'] in ['placement', 'per_kill'] else 'placement'

        # Parse game_date
        try:
            from datetime import datetime
            game_date = datetime.strptime(data['game_date'], '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Invalid game_date format. Use YYYY-MM-DD'}, status=400)

        # Parse numeric fields
        try:
            max_player = int(data['max_player'])
            prize_position_upto = int(data.get('prize_position_upto')) if data.get('prize_position_upto') else None
            top_position_prize = int(data.get('top_position_prize')) if data.get('top_position_prize') else None
            per_kill_point = int(data.get('per_kill_point')) if data.get('per_kill_point') else None
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Invalid numeric field'}, status=400)

        # Entry fee handling
        is_free = bool(data.get('is_free'))
        entry_fee = 0
        if not is_free and data.get('entry_fee'):
            try:
                entry_fee = int(data['entry_fee'])
            except ValueError:
                return JsonResponse({'success': False, 'error': 'entry_fee must be integer'}, status=400)

        # Create tournament
        try:
            tournament = Tournament.objects.create(
                title=data['title'],
                game=game,
                game_mode=data.get('game_mode') or None,
                game_date=game_date,
                win_type=win_type,
                prize=data.get('prize') or None,
                prize_position_upto=prize_position_upto,
                top_position_prize=top_position_prize,
                per_kill_point=per_kill_point,
                entry_fee=entry_fee,
                is_free=is_free,
                access_based=bool(data.get('access_based')),
                enable_slots=bool(data.get('enable_slots')),
                max_player=max_player,
                created_by=request.user,
                status='not_started',
            )
            
            # Create time slots if provided (with room details per slot)
            time_slots_data = data.get('time_slots', [])
            if time_slots_data:
                for slot_data in time_slots_data:
                    time_slot = slot_data.get('time_slot')
                    max_players_per_slot = slot_data.get('max_players', max_player)
                    
                    if time_slot:
                        TournamentTime.objects.create(
                            tournament=tournament,
                            time_slot=time_slot,
                            max_players=int(max_players_per_slot) if max_players_per_slot else max_player,
                            room_id=slot_data.get('room_id') or None,
                            room_pass=slot_data.get('room_pass') or None,
                            join_url=slot_data.get('join_url') or None,
                            is_active=True,
                        )
            
            return JsonResponse({'success': True, 'tournament_id': tournament.id})
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)

    def game_modes_api(self, request, game_id):
        """API endpoint to get game modes for a specific game."""
        from game.models import Game
        try:
            game = Game.objects.get(pk=game_id)
        except Game.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid game id'}, status=404)
        modes_raw = game.game_modes or ''
        modes = [m.strip() for m in modes_raw.split(',') if m.strip()]
        return JsonResponse({'success': True, 'modes': modes})
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'title',
                'game',
                'game_mode',
                'game_date',
                'status',
            )
        }),
        ('Entry & Capacity', {
            'fields': (
                'entry_fee',
                'is_free',
                'access_based',
                'max_player',
                'player_joined',
                'get_capacity_display',
            )
        }),
        ('Win Type & Prizes', {
            'fields': (
                'win_type',
                'prize',
                'prize_position_upto',
                'top_position_prize',
                'per_kill_point',
            )
        }),
        ('Tournament Features', {
            'fields': (
                'enable_slots',
            )
        }),
        ('Tracking & Results', {
            'fields': (
                'created_by',
                'winner',
                'at_least_one_result_submitted',
                'created_at',
                'updated_at',
            )
        }),
    )
    
    inlines = [TournamentTimeInline, TournamentParticipantInline]
    
    date_hierarchy = 'game_date'
    
    def get_capacity_display(self, obj):
        """Display capacity as joined/max"""
        if obj.max_player is None or obj.player_joined is None:
            return '-'
        percentage = (obj.player_joined / obj.max_player * 100) if obj.max_player > 0 else 0
        color = 'red' if percentage >= 100 else 'orange' if percentage >= 80 else 'green'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}/{} ({}%)</span>',
            color, obj.player_joined, obj.max_player, f'{percentage:.0f}'
        )
    get_capacity_display.short_description = 'Capacity'
    
    def view_participants_button(self, obj):
        """Button to view all time slots and their participants"""
        from django.urls import reverse
        if obj.pk:
            url = reverse('view_tournament_all_participants', args=[obj.pk])
            return format_html(
                '<a href="{}" style="background: #000; color: #fff; padding: 8px 16px; '
                'text-decoration: none; border-radius: 6px; display: inline-block; '
                'font-size: 13px; font-weight: 600; transition: all 0.2s; letter-spacing: 0.3px;" '
                'onmouseover="this.style.background=\'#333\'" '
                'onmouseout="this.style.background=\'#000\'"'
                '>PARTICIPANTS</a>',
                url
            )
        return '-'
    view_participants_button.short_description = 'Participants'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('game', 'created_by', 'winner')


@admin.register(TournamentTime)
class TournamentTimeAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'tournament',
        'time_slot',
        'max_players',
        'players_registered',
        'get_capacity_display',
        'is_active',
        'is_full',
        'view_participants_link',
    )
    
    list_filter = (
        'is_active',
        'is_full',
        'tournament__game',
        'created_at',
    )
    
    search_fields = (
        'tournament__title',
        'time_slot',
        'room_id',
    )
    
    readonly_fields = ('is_full', 'created_at', 'updated_at', 'view_participants_link')
    
    autocomplete_fields = ['tournament']
    
    fieldsets = (
        ('Time Slot Info', {
            'fields': (
                'tournament',
                'time_slot',
                'max_players',
                'players_registered',
                'is_active',
                'is_full',
                'view_participants_link',
            )
        }),
        ('Room Details', {
            'fields': (
                'room_id',
                'room_pass',
                'join_url',
            ),
            'description': 'Game room details specific to this time slot'
        }),
        ('Timestamps', {
            'fields': (
                'created_at',
                'updated_at',
            )
        }),
    )
    
    def get_capacity_display(self, obj):
        """Display capacity as registered/max"""
        if obj.max_players is None or obj.players_registered is None:
            return '-'
        percentage = (obj.players_registered / obj.max_players * 100) if obj.max_players > 0 else 0
        color = 'red' if percentage >= 100 else 'orange' if percentage >= 80 else 'green'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}/{} ({}%)</span>',
            color, obj.players_registered, obj.max_players, f'{percentage:.0f}'
        )
    get_capacity_display.short_description = 'Capacity'
    
    def view_participants_link(self, obj):
        """Link to view participants for this time slot"""
        from django.urls import reverse
        from django.utils.html import format_html
        
        if obj.pk:
            url = reverse('view_tournament_time_participants', args=[obj.pk])
            return format_html(
                '<a href="{}" style="background: #000; color: #fff; padding: 6px 12px; '
                'text-decoration: none; border-radius: 4px; display: inline-block; font-size: 12px;">'
                '👥 View Participants ({})</a>',
                url, obj.players_registered
            )
        return '-'
    view_participants_link.short_description = 'Participants'
    view_participants_link.allow_tags = True
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('tournament')


@admin.register(TournamentParticipant)
class TournamentParticipantAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'tournament',
        'tournament_time',
        'registered_at',
        'is_confirmed',
        'result_status',
        'is_winner',
        'kill_count',
        'prize_awarded',
        'slot_number',
    )
    
    list_filter = (
        'result_status',
        'is_confirmed',
        'is_winner',
        'is_top_positioned',
        'tournament__game',
        'registered_at',
    )
    
    search_fields = (
        'user__full_name',
        'user__email',
        'tournament__title',
        'user__uid',
    )
    
    readonly_fields = ('registered_at', 'updated_at')
    
    autocomplete_fields = ['tournament', 'tournament_time', 'user']
    
    fieldsets = (
        ('Registration Details', {
            'fields': (
                'tournament',
                'tournament_time',
                'user',
                'registered_at',
                'is_confirmed',
            )
        }),
        ('Results & Performance', {
            'fields': (
                'result_status',
                'kill_count',
                'slot_number',
            )
        }),
        ('Prize Information', {
            'fields': (
                'is_winner',
                'is_top_positioned',
                'prize_awarded',
            )
        }),
    )
    
    date_hierarchy = 'registered_at'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('tournament', 'tournament_time', 'user')

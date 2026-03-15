from django.contrib import admin
from django.urls import path, reverse
from django.utils.html import format_html
from django.shortcuts import render, get_object_or_404
from django.db.models import Count, Q
from django.http import JsonResponse
from django.db import transaction as db_transaction
from django.core.exceptions import ValidationError
from notification.utils.fcm import send_push_notification
from notification.models import FCMToken
from core.admin_filters import TodayDefaultDateFilter
from info.admin_base import LoggingModelAdmin  # 📊 Auto activity logging
from .models import (
    Challenge,
    ChallengeParticipant,
    ChessSettings,
    EFootballSettings,
    FreefireClashSettings,
    FreefireLonewolfSettings,
    PubgTdmSettings,
    PubgWowSettings,
    MlbbBrawlSettings,
    MlbbClassicSettings,
    Refund,
)


class AdminCreatedFilter(admin.SimpleListFilter):
    title = 'Creator Type'
    parameter_name = 'creator_type'

    def lookups(self, request, model_admin):
        return [
            ('staff', 'Admin (staff) Created'),
            ('me', 'Created By Me'),
        ]

    def queryset(self, request, queryset):
        value = self.value()
        if value == 'staff':
            return queryset.filter(created_by__is_staff=True)
        if value == 'me':
            return queryset.filter(created_by=request.user)
        return queryset

@admin.register(Challenge)
class ChallengeAdmin(LoggingModelAdmin):
    """Custom admin interface for Challenge with participant management"""
    # NOTE (Admin inline create feature assumptions):
    # - For placement challenges we capture: prize_position_upto (Top N), top_position_prize (each *numeric*), and winner_prize which is now FREE TEXT (could be numeric or description).
    # - For per_kill challenges we accept per_kill_value (numeric for textual summary) and winner_prize (free text bonus descriptor) – both summarized in Challenge.prize string only.
    # - If structured analytics are later needed add explicit model fields (e.g. per_kill_value_int, winner_bonus_text).

    # List view configuration
    list_display = (
        'id', 'title', 'game', 'status_badge', 'created_by_info',
        'participants_progress', 'entry_fee_display', 'created_at', 'participants_action'
    )
    list_filter = ('status', 'is_free', 'game', TodayDefaultDateFilter, AdminCreatedFilter)
    search_fields = ('id', 'title', 'created_by__full_name', 'created_by__username')
    ordering = ('-created_at',)
    readonly_fields = ('player_joined', 'created_at')
    list_per_page = 25

    # Remove bulk actions for a cleaner UI (optional)
    actions = None

    # Disable the "Add Challenge" button - use dashboard "Create Tournament" page instead
    def has_add_permission(self, request):
        return False

    # ------------------ Custom column renderers ------------------ #
    def status_badge(self, obj):
        colors = {
            'not_started': '#6c757d',
            'in_progress': '#17a2b8',
            'resolved': '#007bff',
            'completed': '#28a745',
            'cancelled': '#dc3545',
            'expired': '#ffc107',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html('<span style="color:{}; font-weight:600;">{}</span>', color, obj.get_status_display())
    status_badge.short_description = 'Status'

    def created_by_info(self, obj):
        return format_html(
            '<div style="line-height:1.2;">'
            '<strong style="color:#222;">{}</strong><br>'
            '<small style="color:#555;">@{}</small>'
            '</div>',
            obj.created_by.full_name, obj.created_by.username
        )
    created_by_info.short_description = 'Created By'

    def participants_progress(self, obj):
        current = obj.player_joined or 0
        max_p = obj.max_player or 0
        # simple linear bar
        width_pct = 0
        if max_p:
            width_pct = min(100, int((current / max_p) * 100))
        bar_color = '#28a745' if width_pct == 100 else '#17a2b8'
        return format_html(
            '<div style="min-width:110px">'
            '<div style="display:flex; justify-content:space-between; font-size:11px; color:#555;">'
            '<span>{}</span><span>{}</span>'
            '</div>'
            '<div style="position:relative; background:#f1f3f5; border-radius:4px; height:6px; overflow:hidden;">'
            '<div style="position:absolute; left:0; top:0; bottom:0; width:{}%; background:{};"></div>'
            '</div>'
            '</div>',
            current, max_p, width_pct, bar_color
        )
    participants_progress.short_description = 'Players'

    def entry_fee_display(self, obj):
        if obj.is_free or not obj.entry_fee:
            return format_html('<span style="color:#28a745;font-weight:600;">Free</span>')
        return format_html('<span style="color:#111; font-weight:600;">{}<small style="color:#666;font-weight:400;"> crowns</small></span>', obj.entry_fee)
    entry_fee_display.short_description = 'Entry'

    def participants_action(self, obj):
        url = reverse('admin:challenge_challenge_participants', args=[obj.pk])
        return format_html(
            '<a href="{}" style="background:#007bff;color:#fff;padding:4px 10px;border-radius:4px;'
            'text-decoration:none;font-size:11px; font-weight:500; display:inline-block;">👥 View ({}/{})</a>',
            url, obj.player_joined or 0, obj.max_player or '-'
        )
    participants_action.short_description = 'Participants'

    # ------------------ Custom URLs & Views ------------------ #
    def get_urls(self):
        base_urls = super().get_urls()
        custom = [
            path('<int:challenge_id>/participants/',
                 self.admin_site.admin_view(self.view_participants),
                 name='challenge_challenge_participants'),
            path('<int:challenge_id>/release-prizes/',
                 self.admin_site.admin_view(self.release_prizes),
                 name='challenge_challenge_release_prizes'),
            # Removed: send-credentials - now handled via dashboard Celery task
            path('<int:challenge_id>/refund-participants/',
                 self.admin_site.admin_view(self.refund_participants),
                 name='challenge_challenge_refund_participants'),
            path('admin-create/',
                 self.admin_site.admin_view(self.create_admin_challenge),
                 name='challenge_challenge_admin_create'),
            path('<int:game_id>/game-modes/',
                 self.admin_site.admin_view(self.game_modes_api),
                 name='challenge_game_modes'),
        ]
        return custom + base_urls

    def view_participants(self, request, challenge_id):
        challenge = get_object_or_404(Challenge.objects.select_related('created_by', 'game'), pk=challenge_id)
        # Only admin/staff created challenges can have multi-winner prize release features
        has_prize_features = bool(getattr(challenge.created_by, 'is_staff', False) or getattr(challenge.created_by, 'role', '') == 'admin')
        is_per_kill = challenge.win_type == 'per_kill'

        q = request.GET.get('q', '').strip()
        participants_qs = (ChallengeParticipant.objects
                            .filter(challenge=challenge)
                            .select_related('user'))
        if q:
            participants_qs = participants_qs.filter(
                Q(user__full_name__icontains=q) |
                Q(user__username__icontains=q) |
                Q(user__email__icontains=q) |
                Q(id__iexact=q)
            )

        participants_list = list(participants_qs.order_by('-joined_at'))

        # Attempt to fetch game usernames for these users for this challenge's game
        try:
            from game.models import PlayerGameProfile
            profiles = PlayerGameProfile.objects.filter(
                user__in=[p.user for p in participants_list], game=challenge.game
            ).only('user_id', 'game_username')
            profile_map = {pr.user_id: pr.game_username for pr in profiles if pr.game_username}
        except Exception:
            profile_map = {}

        for p in participants_list:
            p.in_game_name = profile_map.get(p.user_id) or p.user.username or p.user.full_name

        total = participants_qs.count()

        # Credentials notification removed - now handled via dashboard Celery task
        # Refund functionality - available for paid challenges with participants
        can_refund = (
            has_prize_features and 
            challenge.status not in ['completed', 'cancelled'] and 
            not challenge.is_free and 
            challenge.entry_fee and 
            challenge.entry_fee > 0 and
            total > 0
        )
        refund_url = reverse('admin:challenge_challenge_refund_participants', args=[challenge.id]) if can_refund else None

        context = dict(
            self.admin_site.each_context(request),
            title=f'Participants • {challenge}',
            challenge=challenge,
            participants=participants_list,
            total=total,
            q=q,
            show_ign=True,
            release_url=reverse('admin:challenge_challenge_release_prizes', args=[challenge.id]) if has_prize_features else None,
            can_release=has_prize_features and challenge.status not in ['completed', 'cancelled'],
            show_prize_column=has_prize_features and challenge.status == 'completed',
            has_prize_features=has_prize_features,
            is_per_kill=is_per_kill,
            can_refund=can_refund,
            refund_url=refund_url,
        )
        return render(request, 'admin/challenge/participants_list.html', context)

    def release_prizes(self, request, challenge_id):
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'}, status=405)

        challenge = get_object_or_404(Challenge, pk=challenge_id)
        if not (getattr(challenge.created_by, 'is_staff', False) or getattr(challenge.created_by, 'role', '') == 'admin'):
            return JsonResponse({'success': False, 'error': 'Prize release not allowed for customer-created challenges'})
        if challenge.status in ['completed', 'cancelled']:
            return JsonResponse({'success': False, 'error': 'Challenge already finalized'})

        try:
            import json
            payload = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({'success': False, 'error': 'Invalid JSON payload'})

        # Branch logic based on challenge.win_type
        if challenge.win_type == 'per_kill':
            winner_id = payload.get('winner_id')  # Optional
            kills = payload.get('kills', {})  # {participant_id: kill_count}
            per_kill_value = payload.get('per_kill_value')
            winner_extra_prize = payload.get('winner_extra_prize')

            # Winner is now optional
            if not isinstance(kills, dict):
                return JsonResponse({'success': False, 'error': 'kills must be an object/dict'})
            if not per_kill_value:
                return JsonResponse({'success': False, 'error': 'Per kill value required'})
            try:
                per_kill_value = int(per_kill_value)
                if per_kill_value <= 0:
                    raise ValueError
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid per kill value'})

            if winner_extra_prize:
                try:
                    winner_extra_prize = int(winner_extra_prize)
                    if winner_extra_prize < 0:
                        raise ValueError
                except ValueError:
                    return JsonResponse({'success': False, 'error': 'Invalid winner extra prize'})
            else:
                winner_extra_prize = 0

            # Filter positive kills only (zero or negative ignored)
            valid_kill_items = []
            for pid_str, kc in kills.items():
                try:
                    pid = int(pid_str)
                    kc_int = int(kc)
                    if kc_int < 0:
                        return JsonResponse({'success': False, 'error': f'Negative kills not allowed (participant {pid})'})
                    if kc_int > 0:
                        valid_kill_items.append((pid, kc_int))
                except (TypeError, ValueError):
                    return JsonResponse({'success': False, 'error': f'Invalid kill count for participant id {pid_str}'})

            if not valid_kill_items:
                return JsonResponse({'success': False, 'error': 'At least one participant must have kills > 0'})

            participant_ids = [pid for pid, _ in valid_kill_items]
            if winner_id and winner_id not in participant_ids:
                # Winner must be among participants with kill entries (business rule)
                participant_ids.append(winner_id)

            participants = list(ChallengeParticipant.objects.filter(challenge=challenge, id__in=participant_ids).select_related('user'))
            p_map = {p.id: p for p in participants}
            missing = [pid for pid in participant_ids if pid not in p_map]
            if missing:
                return JsonResponse({'success': False, 'error': f'Invalid participant ids: {missing}'})

            from notification.models import Notification
            awarded = []
            try:
                with db_transaction.atomic():
                    # Persist winner & complete challenge (winner is optional)
                    winner_participant = None
                    if winner_id:
                        winner_participant = p_map.get(winner_id)
                        if not winner_participant:
                            return JsonResponse({'success': False, 'error': 'Winner participant not found'})
                        challenge.winner = winner_participant.user
                    challenge.status = 'completed'
                    challenge.save(update_fields=['winner', 'status'])

                    total_distributed = 0
                    for pid, kc in valid_kill_items:
                        part = p_map.get(pid)
                        if not part:
                            continue
                        # Compute prize
                        prize_for_player = kc * per_kill_value
                        if pid == winner_id:
                            prize_for_player += winner_extra_prize

                        user = part.user
                        user.wallet_balance += prize_for_player
                        user.save(update_fields=['wallet_balance'])
                        total_distributed += prize_for_player

                        # Flags & kill count update
                        part.kill_count = kc
                        part.prize_awarded = prize_for_player
                        part.is_top_positioned = True  # treat as prize earner
                        if pid == winner_id:
                            part.is_winner = True
                        part.save(update_fields=['kill_count', 'prize_awarded', 'is_top_positioned', 'is_winner'])

                        # Create notification based on whether user is winner or just prize recipient
                        if pid == winner_id:
                            notif_message = f'Congratulations! You won Tournament #{challenge.id} "{challenge.title}" and earned {prize_for_player} points!'
                            notif_title = 'Tournament Won!'
                        else:
                            notif_message = f'You won {prize_for_player} points from Tournament #{challenge.id} "{challenge.title}"'
                            notif_title = 'Prize Earned!'
                        
                        Notification.objects.create(
                            user=user,
                            notification_type='credited',
                            message=notif_message,
                            challenge=challenge
                        )
                        try:
                            # Send push notification using FCM
                            fcm_tokens = FCMToken.objects.filter(user=user, is_active=True)
                            for fcm_token in fcm_tokens:
                                send_push_notification(
                                    token=fcm_token.token,
                                    title=notif_title,
                                    body=notif_message
                                )
                        except Exception:
                            pass
                        awarded.append({'participant_id': part.id, 'user_id': user.id, 'amount': prize_for_player, 'kills': kc})

                    # Send notifications to all other participants (losers) who didn't get prizes
                    awarded_participant_ids = [pid for pid, _ in valid_kill_items]
                    losing_participants = ChallengeParticipant.objects.filter(
                        challenge=challenge
                    ).exclude(
                        id__in=awarded_participant_ids
                    ).select_related('user')

                    for losing_participant in losing_participants:
                        loser_message = f'Tournament #{challenge.id} completed - Thank you for participating in "{challenge.title}"'
                        Notification.objects.create(
                            user=losing_participant.user,
                            notification_type='tournament',
                            message=loser_message,
                            challenge=challenge
                        )
                        try:
                            # Send push notification using FCM
                            fcm_tokens = FCMToken.objects.filter(user=losing_participant.user, is_active=True)
                            for fcm_token in fcm_tokens:
                                send_push_notification(
                                    token=fcm_token.token,
                                    title='Tournament Completed',
                                    body=loser_message
                                )
                        except Exception:
                            pass

            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)})

            # Record tournament earning (remaining pot) after distribution
            try:
                # Prevent duplicate tournament earning if already recorded
                if not getattr(challenge, 'tournament_earning_recorded', False):
                    from earning.utils import record_tournament_remaining_earning
                    record_tournament_remaining_earning(challenge, total_distributed)
                    # Mark in-memory to reduce chance double in same request (persist optional if field added later)
                    setattr(challenge, 'tournament_earning_recorded', True)
            except Exception as earn_err:
                import logging
                logging.getLogger(__name__).error(f"Earning record failed (per_kill) challenge {challenge.id}: {earn_err}")

            return JsonResponse({
                'success': True,
                'message': f'Prizes released (per-kill). Total distributed: {total_distributed}',
                'awarded': awarded
            })

        # ---------- placement flow (default) ---------- #
        winner_id = payload.get('winner_id')
        top_ids = payload.get('top_ids', [])
        top_prize_amount = payload.get('top_prize_amount')  # Base prize each top player gets
        winner_extra_prize = payload.get('winner_extra_prize')  # Additional winner bonus (optional)

        # Basic validation
        if not isinstance(top_ids, list):
            return JsonResponse({'success': False, 'error': 'top_ids must be a list'})
        # Winner is now optional
        if not top_prize_amount:
            return JsonResponse({'success': False, 'error': 'Top prize amount required'})
        try:
            top_prize_amount = int(top_prize_amount)
            if top_prize_amount <= 0:
                raise ValueError
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Invalid top prize amount'})

        if winner_extra_prize:
            try:
                winner_extra_prize = int(winner_extra_prize)
                if winner_extra_prize < 0:
                    raise ValueError
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid winner extra prize'})
        else:
            winner_extra_prize = 0

        # Ensure winner is in top list (business rule - winner counts among top positions)
        if winner_id and winner_id not in top_ids:
            top_ids.append(winner_id)

        # Fetch participants ensuring they belong to challenge
        participants = list(ChallengeParticipant.objects.filter(challenge=challenge, id__in=top_ids).select_related('user'))
        participants_map = {p.id: p for p in participants}
        missing = [pid for pid in top_ids if pid not in participants_map]
        if missing:
            return JsonResponse({'success': False, 'error': f'Invalid participant ids: {missing}'})

        # All good -> process awards
        from notification.models import Notification
        awarded = []
        try:
            with db_transaction.atomic():
                # Update winner field (optional)
                winner_participant = None
                if winner_id:
                    winner_participant = participants_map.get(winner_id)
                    if winner_participant:
                        challenge.winner = winner_participant.user
                challenge.status = 'completed'
                challenge.save(update_fields=['winner', 'status'])

                total_distributed = 0
                for p in participants:
                    prize_for_player = top_prize_amount
                    if p.id == winner_id:
                        prize_for_player += winner_extra_prize

                    # Credit wallet
                    user = p.user
                    user.wallet_balance += prize_for_player
                    user.save(update_fields=['wallet_balance'])
                    total_distributed += prize_for_player

                    # Update participant flags
                    p.is_top_positioned = True
                    if p.id == winner_id:
                        p.is_winner = True
                    p.prize_awarded = prize_for_player
                    p.save(update_fields=['is_top_positioned', 'is_winner', 'prize_awarded'])

                    # Create notification based on whether user is winner or just top positioned
                    if p.id == winner_id:
                        notif_message = f'Congratulations! You won Tournament #{challenge.id}, +{prize_for_player} points credited.'
                        notif_title = 'Tournament Won!'
                    else:
                        notif_message = f'You finished in top positions in Tournament #{challenge.id} "{challenge.title}" and won {prize_for_player} points!'
                        notif_title = 'Top Position Prize!'
                    
                    Notification.objects.create(
                        user=user,
                        notification_type='credited',
                        message=notif_message,
                        challenge=challenge
                    )
                    # Push notification (safe, non-blocking)
                    try:
                        # Send push notification using FCM
                        fcm_tokens = FCMToken.objects.filter(user=user, is_active=True)
                        for fcm_token in fcm_tokens:
                            send_push_notification(
                                token=fcm_token.token,
                                title=notif_title,
                                body=notif_message
                            )
                    except Exception:
                        pass
                    awarded.append({'participant_id': p.id, 'user_id': user.id, 'amount': prize_for_player})

                # Send notifications to all other participants (losers) who didn't get prizes
                losing_participants = ChallengeParticipant.objects.filter(
                    challenge=challenge
                ).exclude(
                    id__in=top_ids
                ).select_related('user')

                for losing_participant in losing_participants:
                    loser_message = f'Tournament #{challenge.id} completed - Thank you for participating.'
                    Notification.objects.create(
                        user=losing_participant.user,
                        notification_type='tournament',
                        message=loser_message,
                        challenge=challenge
                    )
                    try:
                        # Send push notification using FCM
                        fcm_tokens = FCMToken.objects.filter(user=losing_participant.user, is_active=True)
                        for fcm_token in fcm_tokens:
                            send_push_notification(
                                token=fcm_token.token,
                                title='Tournament Completed',
                                body=loser_message
                            )
                    except Exception:
                        pass

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

        # Record tournament earning (remaining pot) after distribution
        try:
            if not getattr(challenge, 'tournament_earning_recorded', False):
                from earning.utils import record_tournament_remaining_earning
                record_tournament_remaining_earning(challenge, total_distributed)
                setattr(challenge, 'tournament_earning_recorded', True)
        except Exception as earn_err:
            import logging
            logging.getLogger(__name__).error(f"Earning record failed (placement) challenge {challenge.id}: {earn_err}")

        return JsonResponse({
            'success': True,
            'message': f'Prizes released. Total distributed: {total_distributed}',
            'awarded': awarded
        })

    # -------- Admin create challenge (custom minimal form) -------- #
    def create_admin_challenge(self, request):
        """AJAX endpoint to create an admin-hosted challenge.
        winner_prize is now free text (no numeric parsing). Numeric fields retained for model integrity.
        """
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'}, status=405)
        if not request.user.is_staff:
            return JsonResponse({'success': False, 'error': 'Only staff can create admin challenges'}, status=403)
        import json
        try:
            data = json.loads(request.body.decode('utf-8'))
        except Exception:
            return JsonResponse({'success': False, 'error': 'Invalid JSON payload'}, status=400)

        required = ['title', 'game_id', 'win_type']
        missing = [r for r in required if not data.get(r)]
        if missing:
            return JsonResponse({'success': False, 'error': f'Missing fields: {", ".join(missing)}'}, status=400)

        from game.models import Game
        try:
            game = Game.objects.get(pk=data['game_id'])
        except Game.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid game id'}, status=400)

        win_type = data['win_type'] if data['win_type'] in ['placement', 'per_kill'] else 'placement'

        # Numeric prize range fields
        prize_position_upto_raw = data.get('prize_position_upto') or None
        top_position_prize_raw = data.get('top_position_prize') or None
        prize_position_upto = None
        top_position_prize = None
        if prize_position_upto_raw:
            try:
                prize_position_upto = int(prize_position_upto_raw)
            except ValueError:
                return JsonResponse({'success': False, 'error': 'prize_position_upto must be integer'}, status=400)
        if top_position_prize_raw:
            try:
                top_position_prize = int(top_position_prize_raw)
            except ValueError:
                return JsonResponse({'success': False, 'error': 'top_position_prize must be integer'}, status=400)

        # Free-text winner prize/bonus descriptor
        winner_prize_text = data.get('winner_prize')
        winner_prize_text = winner_prize_text.strip() if isinstance(winner_prize_text, str) and winner_prize_text.strip() else None

        # Per-kill point value (stored in model)
        per_kill_point_raw = data.get('per_kill_point') or None
        per_kill_point = None
        if win_type == 'per_kill' and per_kill_point_raw:
            try:
                per_kill_point = int(per_kill_point_raw)
            except ValueError:
                return JsonResponse({'success': False, 'error': 'per_kill_point must be integer'}, status=400)

        # Entry fee handling
        is_free = bool(data.get('is_free'))
        entry_fee_raw = data.get('entry_fee')
        entry_fee = None
        if not is_free and entry_fee_raw not in (None, ''):
            try:
                entry_fee = int(entry_fee_raw)
            except ValueError:
                return JsonResponse({'success': False, 'error': 'entry_fee must be integer'}, status=400)

        # Max players
        max_player_raw = data.get('max_player') or None
        max_player = None
        if max_player_raw:
            try:
                max_player = int(max_player_raw)
            except ValueError:
                return JsonResponse({'success': False, 'error': 'max_player must be integer'}, status=400)

        access_based = bool(data.get('access_based'))
        enable_slots = bool(data.get('enable_slots'))
        start_time = data.get('start_time') or None
        game_mode = data.get('game_mode') or None
        room_id = data.get('room_id') or None
        room_pass = data.get('room_pass') or None
        join_url = data.get('join_url') or None

        # Raw prize text behavior: store EXACT free-text winner_prize (or blank) without auto composition
        # Previous behavior concatenated ranges / per-kill summary. Requirement: do not prepend anything.
        prize_text = winner_prize_text  # could be None

        challenge = Challenge.objects.create(
            title=data['title'],
            game=game,
            game_mode=game_mode,
            win_type=win_type,
            prize=prize_text,
            prize_position_upto=prize_position_upto,
            top_position_prize=top_position_prize,
            per_kill_point=per_kill_point,
            entry_fee=entry_fee,
            is_free=is_free,
            access_based=access_based,
            enable_slots=enable_slots,
            max_player=max_player,
            start_time=start_time,
            team_code=None,
            room_id=room_id,
            room_pass=room_pass,
            join_url=join_url,
            created_by=request.user,
        )

        return JsonResponse({'success': True, 'challenge_id': challenge.id})

    def game_modes_api(self, request, game_id):
        from game.models import Game
        try:
            game = Game.objects.get(pk=game_id)
        except Game.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid game id'}, status=404)
        modes_raw = game.game_modes or ''
        modes = [m.strip() for m in modes_raw.split(',') if m.strip()]
        return JsonResponse({'success': True, 'modes': modes})

    # Removed: send_credentials_notification method
    # Credential notifications are now sent asynchronously via Celery task from dashboard
    # This prevents blocking requests and allows better scalability

    def refund_participants(self, request, challenge_id):
        """Refund entry fees to all participants and cancel the challenge"""
        if request.method != 'POST':
            return JsonResponse({'success': False, 'error': 'Invalid method'}, status=405)
        
        challenge = get_object_or_404(Challenge, pk=challenge_id)
        
        # Only for admin/staff created challenges
        is_admin_challenge = (
            getattr(challenge.created_by, 'is_staff', False) or 
            getattr(challenge.created_by, 'role', '') == 'admin'
        )
        if not is_admin_challenge:
            return JsonResponse({'success': False, 'error': 'Only admin challenges can process refunds'}, status=403)
        
        # Validation checks
        if challenge.status in ['completed', 'cancelled']:
            return JsonResponse({'success': False, 'error': 'Challenge already finalized'}, status=400)
        
        if challenge.is_free or not challenge.entry_fee or challenge.entry_fee <= 0:
            return JsonResponse({'success': False, 'error': 'No entry fee to refund - this is a free tournament'}, status=400)
        
        # Get all participants
        participants = ChallengeParticipant.objects.filter(
            challenge=challenge
        ).select_related('user')
        
        if not participants.exists():
            return JsonResponse({'success': False, 'error': 'No participants to refund'}, status=400)
        
        from notification.models import Notification
        from django.utils import timezone
        
        refunded_users = []
        refund_amount = challenge.entry_fee
        
        try:
            with db_transaction.atomic():
                # Process refunds for all participants
                for participant in participants:
                    user = participant.user
                    
                    # Credit the entry fee back to user's wallet
                    user.wallet_balance += refund_amount
                    user.save(update_fields=['wallet_balance'])
                    
                    # Create refund record
                    Refund.objects.create(
                        challenge=challenge,
                        user=user,
                        amount=refund_amount,
                        reason='Tournament cancelled by admin',
                        status='success',
                        processed_at=timezone.now()
                    )
                    
                    # Create notification
                    challenge_title = challenge.title or f"Tournament #{challenge.id}"
                    notif_message = f'Tournament "{challenge_title}" has been cancelled. Your entry fee of {refund_amount} points has been refunded to your account.'
                    
                    Notification.objects.create(
                        user=user,
                        notification_type='refund',
                        message=notif_message,
                        challenge=challenge
                    )
                    
                    # Send push notification
                    try:
                        fcm_tokens = FCMToken.objects.filter(user=user, is_active=True)
                        for fcm_token in fcm_tokens:
                            send_push_notification(
                                token=fcm_token.token,
                                title='Tournament Cancelled - Refund Issued',
                                body=notif_message,
                                data={
                                    "screen": "wallet",
                                    "type": "refund",
                                    "challenge_id": str(challenge.id)
                                }
                            )
                    except Exception:
                        pass  # Continue even if push notification fails
                    
                    refunded_users.append({
                        'user_id': user.id,
                        'username': user.username or user.full_name,
                        'amount': refund_amount
                    })
                
                # Update challenge status to cancelled
                challenge.status = 'cancelled'
                challenge.cancelled = True
                challenge.cancelled_by = request.user
                challenge.save(update_fields=['status', 'cancelled', 'cancelled_by'])
                
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Refund processing failed for challenge {challenge.id}: {e}")
            return JsonResponse({'success': False, 'error': f'Refund processing failed: {str(e)}'}, status=500)
        
        total_refunded = len(refunded_users)
        total_amount = total_refunded * refund_amount
        
        return JsonResponse({
            'success': True,
            'message': f'Successfully refunded {total_refunded} participants. Total refunded: {total_amount} points',
            'refunded_count': total_refunded,
            'refund_amount': refund_amount,
            'total_amount': total_amount,
            'refunded_users': refunded_users
        })

    # ------------------ Query Optimization ------------------ #
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Only optimize the list view, not the detail view
        if request.resolver_match.url_name.endswith('_changelist'):
            return qs.select_related('created_by', 'game')
        # For detail view, use default queryset for fastest loading
        return qs



@admin.register(ChallengeParticipant)
class ChallengeParticipantAdmin(LoggingModelAdmin):
    list_display = ('challenge', 'user', 'slot_number', 'result_status', 'joined_at')
    list_filter = ('result_status', 'joined_at')
    search_fields = ('challenge__title', 'user__full_name', 'user__username')


# Register other models with basic admin
admin.site.register(Refund)
admin.site.register(ChessSettings)
admin.site.register(EFootballSettings)
admin.site.register(FreefireClashSettings)
admin.site.register(FreefireLonewolfSettings)
admin.site.register(PubgTdmSettings)
admin.site.register(PubgWowSettings)
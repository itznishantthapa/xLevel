from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse, path
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponseRedirect, JsonResponse
from django.contrib import messages
from django.db import transaction
from django.utils.safestring import mark_safe
from .models import Result
from challenge.models import Challenge, ChallengeParticipant
from user.models import CustomUser
from core.admin_filters import TodayDefaultDateFilter
from info.admin_base import LoggingModelAdmin  # 📊 Auto activity logging


class ResultAdmin(LoggingModelAdmin):
    # List view configuration - Simplified
    list_display = (
        'challenge_info', 'participants_info', 
        'status_badge', 'result_summary', 'actions_column'
    )
    list_filter = (
        'status', 'challenge__game__name', 
        TodayDefaultDateFilter
    )
    search_fields = (
        'challenge__id',
        'participant__user__full_name'
    )
    
    # Custom ordering
    ordering = ['-created_at']
    
    # Items per page
    list_per_page = 25
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('<int:result_id>/verify/', self.verify_result_view, name='result_verify'),
            path('<int:result_id>/set-winner/', self.set_winner_ajax, name='result_set_winner'),
            path('magic-verifier/', self.magic_verifier, name='result_magic_verifier')
        ]
        return custom_urls + urls
    
    def challenge_info(self, obj):
        """Display minimal challenge information"""
        return format_html(
            '<strong>#{}</strong> {}<br>'
            '<span class="status-badge status-{}">{}</span>',
            obj.challenge.id,
            obj.challenge.game.name,
            obj.challenge.status,
            obj.challenge.entry_fee or 'Free'
        )
    challenge_info.short_description = 'Challenge'
    challenge_info.admin_order_field = 'challenge__id'
    

    
    def participants_info(self, obj):
        """Display compact participant information"""
        from game.models import PlayerGameProfile
        
        participants = ChallengeParticipant.objects.filter(
            challenge=obj.challenge
        ).select_related('user')[:2]
        
        if len(participants) == 2:
            # Get game usernames for both participants
            game_names = []
            for participant in participants:
                try:
                    game_profile = PlayerGameProfile.objects.get(
                        user=participant.user, 
                        game=obj.challenge.game
                    )
                    game_name = game_profile.game_username or participant.user.full_name
                except PlayerGameProfile.DoesNotExist:
                    game_name = participant.user.full_name
                game_names.append(game_name[:15])  # Limit length for display
            
            return format_html(
                '<div>{}<br>vs<br>{}</div>',
                game_names[0],
                game_names[1]
            )
        else:
            return format_html(
                '<small>{} player(s)</small>',
                len(participants)
            )
    participants_info.short_description = 'Players'
    
    def status_badge(self, obj):
        """Display status with minimal badge"""
        return format_html(
            '<span class="status-badge status-{}">{}</span>',
            obj.status,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'
    
    def result_summary(self, obj):
        """Display compact result summary"""
        results = Result.objects.filter(challenge=obj.challenge).select_related('participant__user')
        
        if len(results) >= 2:
            summary_html = '<div class="result-summary">'
            for result in results:
                icon = {'win': '🏆', 'lose': '❌', 'draw': '🤝'}.get(result.game_result or '', '❓')
                summary_html += format_html(
                    '<div class="player-result">'
                    '<span>{}</span> <span>{}</span>'
                    '</div>',
                    result.participant.user.full_name[:10],
                    icon
                )
            summary_html += '</div>'
            return mark_safe(summary_html)
        else:
            return format_html(
                '<small>{}/2</small>',
                len(results)
            )
    result_summary.short_description = 'Results Summary'
    
    def actions_column(self, obj):
        """Display clean action button"""
        if obj.status == 'pending':
            return format_html(
                '<a href="{}" class="verify-btn">Verify</a>',
                reverse('admin:result_verify', args=[obj.pk])
            )
        else:
            return format_html(
                '<span>✓</span>'
            )
    actions_column.short_description = 'Actions'
    
    def changelist_view(self, request, extra_context=None):
        """Add Magic Verifier button to changelist"""
        extra_context = extra_context or {}
        
        # Count pending results
        pending_count = Result.objects.filter(status='pending').values('challenge').distinct().count()
        extra_context['magic_verifier_url'] = reverse('admin:result_magic_verifier')
        extra_context['pending_challenges_count'] = pending_count
        
        return super().changelist_view(request, extra_context)
    
    def verify_result_view(self, request, result_id):
        """Custom view for verifying results with side-by-side comparison"""
        from game.models import PlayerGameProfile
        
        result = get_object_or_404(Result, pk=result_id)
        
        # Get all results for this challenge
        all_results = Result.objects.filter(challenge=result.challenge).select_related('participant__user')
        
        # Get challenge participants
        participants = ChallengeParticipant.objects.filter(
            challenge=result.challenge
        ).select_related('user')
        
        # Attach game usernames directly to results and participants
        for res in all_results:
            try:
                game_profile = PlayerGameProfile.objects.get(
                    user=res.participant.user, 
                    game=result.challenge.game
                )
                res.participant.user.game_display_name = game_profile.game_username or res.participant.user.full_name
            except PlayerGameProfile.DoesNotExist:
                res.participant.user.game_display_name = res.participant.user.full_name
        
        for participant in participants:
            try:
                game_profile = PlayerGameProfile.objects.get(
                    user=participant.user, 
                    game=result.challenge.game
                )
                participant.user.game_display_name = game_profile.game_username or participant.user.full_name
            except PlayerGameProfile.DoesNotExist:
                participant.user.game_display_name = participant.user.full_name
        
        context = {
            'title': f'Verify Results',
            'result': result,
            'challenge': result.challenge,
            'all_results': all_results,
            'participants': participants,
            'has_pair': len(all_results) >= 2,
            'opts': self.model._meta,
            'app_label': self.model._meta.app_label,
        }
        
        return render(request, 'admin/result/verify_results.html', context)
    
    def set_winner_ajax(self, request, result_id):
        """AJAX endpoint to set challenge winner"""
        if request.method == 'POST':
            result = get_object_or_404(Result, pk=result_id)
            winner_id = request.POST.get('winner_id')
            
            if winner_id:
                try:
                    with transaction.atomic():
                        # Handle draw case
                        if winner_id == 'draw':
                            from django.db.models import F
                            from notification.models import Notification, FCMToken
                            from notification.utils.fcm import send_push_notification
                            import logging
                            
                            logger = logging.getLogger(__name__)
                            challenge = result.challenge
                            challenge.status = 'completed'
                            # No winner set for draws
                            challenge.save()
                            
                            # Refund entry fees to all participants in case of draw
                            participants = ChallengeParticipant.objects.filter(challenge=challenge).select_related('user')
                            entry_fee = challenge.entry_fee or 0
                            
                            if entry_fee > 0:
                                for participant in participants:
                                    # Refund entry fee to each participant
                                    participant.user.wallet_balance = F('wallet_balance') + entry_fee
                                    participant.user.save(update_fields=['wallet_balance'])
                                    
                                    # Create refund notification for each participant
                                    game_mode = challenge.game_mode or 'Standard'
                                    notification_message = f"Match [#{challenge.id}] Match ended in draw 🤝 ! {entry_fee} points refunded for {game_mode} match."
                                    
                                    Notification.objects.create(
                                        user=participant.user,
                                        notification_type='credited',
                                        message=notification_message,
                                        challenge=challenge
                                    )
                                    
                                    # Send push notification for refund
                                    try:
                                        fcm_tokens = FCMToken.objects.filter(user=participant.user, is_active=True)
                                        for token_obj in fcm_tokens:
                                            send_push_notification(
                                                token=token_obj.token,
                                                title="Match Draw",
                                                body=notification_message,
                                                data={
                                                    'type': 'match_draw_refund',
                                                    'challenge_id': str(challenge.id),
                                                    'refund_amount': str(entry_fee)
                                                }
                                            )
                                    except Exception as fcm_error:
                                        logger.error(f"FCM notification error for draw: {str(fcm_error)}")
                            
                            # Mark all results as approved
                            Result.objects.filter(challenge=challenge).update(status='approved')
                            
                            return JsonResponse({
                                'success': True,
                                'message': f'Match marked as draw. {"Entry fees refunded to all participants." if entry_fee > 0 else ""}'
                            })
                        else:
                            from django.db.models import F
                            from notification.models import Notification, FCMToken
                            from notification.utils.fcm import send_push_notification
                            from decimal import Decimal
                            import logging
                            
                            logger = logging.getLogger(__name__)
                            winner = CustomUser.objects.get(id=winner_id)
                            challenge = result.challenge
                            
                            # Calculate prize money
                            entry_fee = challenge.entry_fee or 0
                            total_prize = entry_fee * 2  # Creator + opponent entry fee
                            platform_fee = Decimal('0.10')  # 10% deduction
                            final_prize = total_prize * (1 - platform_fee)
                            
                            # Update challenge with winner
                            challenge.winner = winner
                            challenge.status = 'completed'
                            challenge.save()

                            # Record platform earning (service fee) for open (customer-created) games
                            try:
                                from earning.utils import record_open_game_service_fee
                                record_open_game_service_fee(challenge)
                            except Exception as earn_err:
                                logger.error(f"Earning record failed (open game) challenge {challenge.id}: {earn_err}")
                            
                            # Credit winner's wallet
                            if final_prize > 0:
                                winner.wallet_balance = F('wallet_balance') + final_prize
                                winner.save(update_fields=['wallet_balance'])
                                
                                # Refresh to get the actual balance
                                winner.refresh_from_db()
                                
                                logger.info(f"Winner {winner.email} credited {final_prize} points for challenge {challenge.id}")
                            
                            # Mark all results as approved
                            Result.objects.filter(challenge=challenge).update(status='approved')
                            
                            # Create winner notification
                            import random
                            from game.models import PlayerGameProfile
                            
                            try:
                                game_profile = PlayerGameProfile.objects.get(user=winner, game=challenge.game)
                                winner_game_name = game_profile.game_username or winner.full_name
                            except PlayerGameProfile.DoesNotExist:
                                winner_game_name = winner.full_name
                            
                            game_mode = challenge.game_mode or 'Standard'
                            random_emoji = random.choice(['💐', '🫶', '🫡', '🥺', '☠️', '🙌'])
                            random_winner_emoji = random.choice(['🎊', '🎉', '🏅', '🎯', '🥳','🎊','🎊','🎉','🎉','🎉','🎉','🎉'])
                            notification_message = f"Congrats {winner_game_name} {random_emoji} !!"
                            if final_prize > 0:
                                notification_message += f"\nYou've won {game_mode} Match [#{challenge.id}], +{int(final_prize)} points credited."
                            else:
                                notification_message += f"\nYou've won {game_mode} Match [#{challenge.id}]."
                            
                            notification = Notification.objects.create(
                                user=winner,
                                notification_type='credited',
                                message=notification_message,
                                challenge=challenge
                            )
                            
                            # Send push notification to winner
                            try:
                                fcm_tokens = FCMToken.objects.filter(user=winner, is_active=True)
                                for token_obj in fcm_tokens:
                                    success, response = send_push_notification(
                                        token=token_obj.token,
                                        title=f"Winner Winner {random_winner_emoji} !!!",
                                        body=notification_message,
                                        data={
                                            'type': 'match_won',
                                            'challenge_id': str(challenge.id),
                                            'prize_amount': str(int(final_prize)) if final_prize > 0 else '0'
                                        }
                                    )
                                    if not success:
                                        logger.warning(f"Failed to send FCM to {winner.email}: {response}")
                            except Exception as fcm_error:
                                logger.error(f"FCM notification error: {str(fcm_error)}")
                            
                            # Send notification to loser(s)
                            try:
                                from game.models import PlayerGameProfile
                                
                                participants = ChallengeParticipant.objects.filter(
                                    challenge=challenge
                                ).select_related('user').exclude(user=winner)
                                
                                for participant in participants:
                                    # Get opponent's game username for message
                                    try:
                                        winner_game_profile = PlayerGameProfile.objects.get(
                                            user=winner, 
                                            game=challenge.game
                                        )
                                        opponent_name = winner_game_profile.game_username or winner.full_name
                                    except PlayerGameProfile.DoesNotExist:
                                        opponent_name = winner.full_name
                                    
                                    # Create loser notification with opponent name
                                    import random
                                    game_mode = challenge.game_mode or 'Standard'
                                    random_emoji = random.choice(['💐', '🫶', '🫡', '🥺', '☠️', '🙌'])
                                    loser_message = f"Match [#{challenge.id}] {opponent_name} has won {game_mode} game.\nBest of luck for the next game {random_emoji} !!"
                                    
                                    Notification.objects.create(
                                        user=participant.user,
                                        notification_type='normal',
                                        message=loser_message,
                                        challenge=challenge
                                    )
                                    
                                    # Send push notification to loser
                                    try:
                                        fcm_tokens = FCMToken.objects.filter(user=participant.user, is_active=True)
                                        for token_obj in fcm_tokens:
                                            success, response = send_push_notification(
                                                token=token_obj.token,
                                                title="Game Result",
                                                body=loser_message,
                                                data={
                                                    'type': 'match_lost',
                                                    'challenge_id': str(challenge.id),
                                                    'game_mode': game_mode
                                                }
                                            )
                                            if not success:
                                                logger.warning(f"Failed to send FCM to {participant.user.email}: {response}")
                                    except Exception as fcm_error:
                                        logger.error(f"FCM notification error for loser: {str(fcm_error)}")
                            except Exception as loser_notification_error:
                                logger.error(f"Error sending loser notifications: {str(loser_notification_error)}")
                            
                            return JsonResponse({
                                'success': True,
                                'message': f'Winner set: {winner.full_name}. Prize: {int(final_prize)} points credited.' if final_prize > 0 else f'Winner set: {winner.full_name}'
                            })
                except Exception as e:
                    return JsonResponse({
                        'success': False,
                        'message': f'Error: {str(e)}'
                    })
            
            return JsonResponse({
                'success': False,
                'message': 'Winner ID is required'
            })
        
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    def magic_verifier(self, request):
        """Magic button to auto-verify results based on smart logic"""
        if request.method == 'POST':
            import logging
            from django.utils import timezone

            from result.magic_verification import run_magic_verification
            
            logger = logging.getLogger(__name__)
            try:
                result = run_magic_verification(logger=logger, now=timezone.now())
                
                # Log the magic verification activity
                from info.utils import log_magic_verify
                log_magic_verify(
                    admin_user=request.user,
                    verified_count=result.get('processed', 0),
                    request=request
                )
                
                return JsonResponse(result)
            except Exception as e:
                logger.error(f"Magic verifier error: {str(e)}")
                return JsonResponse({'success': False, 'message': f'Error processing: {str(e)}'})
        
        # GET request - show magic verifier page
        pending_count = Result.objects.filter(status='pending').values('challenge').distinct().count()
        
        context = {
            'pending_challenges': pending_count,
            'opts': self.model._meta,
            'app_label': self.model._meta.app_label,
        }
        
        return render(request, 'admin/result/magic_verifier.html', context)
    
    def _process_auto_winner(self, challenge, winner, logger):
        """Helper method to process automatic winner"""
        from django.db.models import F
        from notification.models import Notification, FCMToken
        from notification.utils.fcm import send_push_notification
        from game.models import PlayerGameProfile
        from decimal import Decimal
        
        # Calculate prize
        entry_fee = challenge.entry_fee or 0
        total_prize = entry_fee * 2
        platform_fee = Decimal('0.10')
        final_prize = total_prize * (1 - platform_fee)
        
        # Update challenge
        challenge.winner = winner
        challenge.status = 'completed'
        challenge.save()

        # Record platform earning for open (customer-created) game service fee
        try:
            from earning.utils import record_open_game_service_fee
            record_open_game_service_fee(challenge)
        except Exception as earn_err:
            logger.error(f"Earning record failed (auto) challenge {challenge.id}: {earn_err}")
        
        # Credit winner wallet
        if final_prize > 0:
            winner.wallet_balance = F('wallet_balance') + final_prize
            winner.save(update_fields=['wallet_balance'])
            winner.refresh_from_db()
        
        # Mark all results as approved
        Result.objects.filter(challenge=challenge).update(status='approved')
        
        # Send notifications
        self._send_winner_notifications(challenge, winner, final_prize, logger)
        self._send_loser_notifications(challenge, winner, logger)
    
    def _process_draw_with_deduction(self, challenge, results, logger):
        """Helper method to process draw with 10% deduction"""
        from django.db.models import F
        from notification.models import Notification, FCMToken
        from notification.utils.fcm import send_push_notification
        from decimal import Decimal
        
        challenge.status = 'completed'
        challenge.save()
        
        # Calculate refund with 10% deduction
        entry_fee = challenge.entry_fee or 0
        total_pool = entry_fee * 2
        platform_fee = Decimal('0.10')
        remaining_pool = total_pool * (1 - platform_fee)
        refund_per_player = remaining_pool / 2
        
        if refund_per_player > 0:
            participants = ChallengeParticipant.objects.filter(challenge=challenge).select_related('user')
            
            for participant in participants:
                # Refund to each player
                participant.user.wallet_balance = F('wallet_balance') + refund_per_player
                participant.user.save(update_fields=['wallet_balance'])
                
                # Create notification
                game_mode = challenge.game_mode or 'Standard'
                message = f"Match [#{challenge.id}] Chess match ended in draw 🤝 ! {int(refund_per_player)} points refunded (after 10% service fee)."
                
                Notification.objects.create(
                    user=participant.user,
                    notification_type='credited',
                    message=message,
                    challenge=challenge
                )
                
                # Send FCM notification
                try:
                    fcm_tokens = FCMToken.objects.filter(user=participant.user, is_active=True)
                    for token_obj in fcm_tokens:
                        send_push_notification(
                            token=token_obj.token,
                            title="Chess Draw",
                            body=message,
                            data={
                                'type': 'chess_draw_refund',
                                'challenge_id': str(challenge.id),
                                'refund_amount': str(int(refund_per_player))
                            }
                        )
                except Exception as e:
                    logger.error(f"FCM error in draw processing: {str(e)}")
        
        # Mark results as approved
        Result.objects.filter(challenge=challenge).update(status='approved')
    
    def _send_winner_notifications(self, challenge, winner, final_prize, logger):
        """Helper method to send winner notifications"""
        from notification.models import Notification, FCMToken
        from notification.utils.fcm import send_push_notification
        import random
        from game.models import PlayerGameProfile
        
        # Get winner's game name
        try:
            game_profile = PlayerGameProfile.objects.get(user=winner, game=challenge.game)
            winner_game_name = game_profile.game_username or winner.full_name
        except PlayerGameProfile.DoesNotExist:
            winner_game_name = winner.full_name
        
        game_mode = challenge.game_mode or 'Standard'
        random_winner_emoji = random.choice(['🎊', '🎉', '🏅', '🎯', '🥳','🎊','🎊','🎉','🎉','🎉','🎉','🎉'])
        message = f"Congrats {winner_game_name} {random_winner_emoji} !!"
        if final_prize > 0:
            message += f"\nYou've won {game_mode} Match [#{challenge.id}], +{int(final_prize)} points credited."
        else:
            message += f"\nYou've won {game_mode} Match [#{challenge.id}]."
        
        Notification.objects.create(
            user=winner,
            notification_type='credited',
            message=message,
            challenge=challenge
        )
        
        # Send FCM
        try:
            fcm_tokens = FCMToken.objects.filter(user=winner, is_active=True)
            for token_obj in fcm_tokens:
                send_push_notification(
                    token=token_obj.token,
                     title=f"Winner Winner {random_winner_emoji} !!!",
                    body=message,
                    data={
                        'type': 'match_won',
                        'challenge_id': str(challenge.id),
                        'prize_amount': str(int(final_prize)) if final_prize > 0 else '0'
                    }
                )
        except Exception as e:
            logger.error(f"FCM error for winner: {str(e)}")
    
    def _send_loser_notifications(self, challenge, winner, logger):
        """Helper method to send loser notifications"""
        from notification.models import Notification, FCMToken
        from notification.utils.fcm import send_push_notification
        from game.models import PlayerGameProfile
        
        participants = ChallengeParticipant.objects.filter(challenge=challenge).select_related('user').exclude(user=winner)
        
        for participant in participants:
            # Get winner's game name for opponent reference
            try:
                winner_game_profile = PlayerGameProfile.objects.get(user=winner, game=challenge.game)
                opponent_name = winner_game_profile.game_username or winner.full_name
            except PlayerGameProfile.DoesNotExist:
                opponent_name = winner.full_name
            
            import random
            game_mode = challenge.game_mode or 'Standard'
            random_emoji = random.choice(['💐', '🫶', '🫡', '🙌','🥳','🤩'])
            message = f"Match [#{challenge.id}] {opponent_name} has won {game_mode} game.\nBest of luck for the next game {random_emoji} !!"
            
            Notification.objects.create(
                user=participant.user,
                notification_type='normal',
                message=message,
                challenge=challenge
            )
            
            # Send FCM
            try:
                fcm_tokens = FCMToken.objects.filter(user=participant.user, is_active=True)
                for token_obj in fcm_tokens:
                    send_push_notification(
                        token=token_obj.token,
                        title="Game Result",
                        body=message,
                        data={
                            'type': 'match_lost',
                            'challenge_id': str(challenge.id),
                            'game_mode': game_mode
                        }
                    )
            except Exception as e:
                logger.error(f"FCM error for loser: {str(e)}")
    
    class Media:
        css = {
            'all': ('admin/css/result_admin.css',)
        }


admin.site.register(Result, ResultAdmin)

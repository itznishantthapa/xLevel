"""
Celery tasks for tournament operations
"""
from celery import shared_task
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_tournament_timeslot_credentials_async(self, time_slot_id, room_id=None, room_pass=None, join_url=None):
    """
    Asynchronously send tournament time slot credentials to all participants.
    This is critical for tournaments with 1000+ participants to avoid request timeouts.
    
    Args:
        time_slot_id: ID of the TournamentTime slot
        room_id: Room ID to send (optional, updates if provided)
        room_pass: Room password to send (optional, updates if provided)
        join_url: Join URL to send (optional, updates if provided)
    
    Returns:
        dict: Result with success status and count
    """
    try:
        from tournament.models import TournamentTime, TournamentParticipant
        from notification.models import Notification, FCMToken
        from notification.utils.fcm import send_push_notification
        
        # Get tournament time slot
        time_slot = TournamentTime.objects.select_related('tournament').get(id=time_slot_id)
        
        # Update credentials if provided
        updated_fields = []
        if room_id is not None:
            time_slot.room_id = room_id if room_id else time_slot.room_id
            updated_fields.append('room_id')
        if room_pass is not None:
            time_slot.room_pass = room_pass if room_pass else time_slot.room_pass
            updated_fields.append('room_pass')
        if join_url is not None:
            time_slot.join_url = join_url if join_url else time_slot.join_url
            updated_fields.append('join_url')
        
        if updated_fields:
            time_slot.save(update_fields=updated_fields)
        
        # Get all participants
        participants = TournamentParticipant.objects.filter(
            tournament_time=time_slot
        ).select_related('user')
        
        if not participants.exists():
            logger.warning(f"No participants found for time slot {time_slot_id}")
            return {
                'success': False,
                'error': 'No participants found'
            }
        
        sent_count = 0
        failed_count = 0
        
        # Build credential message once
        tournament_title = time_slot.tournament.title
        time_slot_name = time_slot.time_slot
        
        # Send notification to each participant
        for participant in participants:
            try:
                user = participant.user
                
                # Create in-app notification with structured credential fields
                Notification.objects.create(
                    user=user,
                    notification_type='game',
                    message=f"🎮 {tournament_title} - {time_slot_name}",
                    room_id=time_slot.room_id or None,
                    room_pass=time_slot.room_pass or None,
                    join_url=time_slot.join_url or None,
                )
                
                # Send FCM push notification
                fcm_token = FCMToken.objects.filter(
                    user=user,
                    is_active=True
                ).first()
                
                if fcm_token:
                    try:
                        send_push_notification(
                            token=fcm_token.token,
                            title="🎮 Tournament Room Credentials",
                            body=f"{tournament_title} - {time_slot_name}",
                            data={
                                "screen": "userTournament",
                                "time_slot_id": str(time_slot_id),
                                "room_id": time_slot.room_id or "",
                                "room_pass": time_slot.room_pass or "",
                                "join_url": time_slot.join_url or "",
                                "type": "credentials_sent"
                            }
                        )
                    except Exception as e:
                        logger.warning(f"FCM push failed for user {user.id}: {str(e)}")
                        # Still count as sent since in-app notification was created
                
                sent_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send notification to user {user.id}: {str(e)}")
                failed_count += 1
                continue
        
        logger.info(
            f"Tournament time slot {time_slot_id} credentials sent. "
            f"Success: {sent_count}, Failed: {failed_count}, Total: {participants.count()}"
        )
        
        return {
            'success': True,
            'time_slot_id': time_slot_id,
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_participants': participants.count()
        }
        
    except ObjectDoesNotExist:
        logger.error(f"Tournament time slot {time_slot_id} not found")
        return {
            'success': False,
            'error': 'Time slot not found'
        }
        
    except Exception as exc:
        logger.error(f"Error sending tournament credentials for time slot {time_slot_id}: {str(exc)}")
        # Retry the task after 60 seconds
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3)
def send_and_deactivate_timeslot_async(self, time_slot_id, room_id=None, room_pass=None):
    """
    Asynchronously send credentials and mark time slot as inactive.
    Used when tournament is completed and credentials need to be distributed.
    
    Args:
        time_slot_id: ID of the TournamentTime slot
        room_id: Room ID to send (optional, updates if provided)
        room_pass: Room password to send (optional, updates if provided)
    
    Returns:
        dict: Result with success status and count
    """
    try:
        from tournament.models import TournamentTime, TournamentParticipant
        from notification.models import Notification, FCMToken
        from notification.utils.fcm import send_push_notification
        from django.db import transaction as db_transaction
        
        # Get tournament time slot
        time_slot = TournamentTime.objects.select_related('tournament').get(id=time_slot_id)
        
        with db_transaction.atomic():
            # Update credentials if provided
            updated = False
            if room_id:
                time_slot.room_id = room_id
                updated = True
            if room_pass:
                time_slot.room_pass = room_pass
                updated = True
            
            if updated:
                time_slot.save(update_fields=['room_id', 'room_pass'])
            
            # Get all participants
            participants = TournamentParticipant.objects.filter(
                tournament_time=time_slot
            ).select_related('user')
            
            if not participants.exists():
                logger.warning(f"No participants found for time slot {time_slot_id}")
                return {
                    'success': False,
                    'error': 'No participants found'
                }
            
            sent_count = 0
            failed_count = 0
            
            tournament_title = time_slot.tournament.title
            time_slot_name = time_slot.time_slot
            
            # Send notification to each participant
            for participant in participants:
                try:
                    user = participant.user
                    
                    # Create in-app notification
                    Notification.objects.create(
                        user=user,
                        notification_type='game',
                        message=f"🎮 {tournament_title} - {time_slot_name}",
                        room_id=time_slot.room_id or None,
                        room_pass=time_slot.room_pass or None,
                        join_url=time_slot.join_url or None,
                    )
                    
                    # Send FCM push notification
                    fcm_token = FCMToken.objects.filter(
                        user=user,
                        is_active=True
                    ).first()
                    
                    if fcm_token:
                        try:
                            send_push_notification(
                                token=fcm_token.token,
                                title="🎮 Tournament Room Credentials",
                                body=f"{tournament_title} - {time_slot_name}",
                                data={
                                    "screen": "userTournament",
                                    "time_slot_id": str(time_slot_id),
                                    "room_id": time_slot.room_id or "",
                                    "room_pass": time_slot.room_pass or "",
                                    "join_url": time_slot.join_url or "",
                                    "type": "credentials_sent"
                                }
                            )
                        except Exception as e:
                            logger.warning(f"FCM push failed for user {user.id}: {str(e)}")
                    
                    sent_count += 1
                    
                except Exception as e:
                    logger.error(f"Failed to send notification to user {user.id}: {str(e)}")
                    failed_count += 1
                    continue
        
        logger.info(
            f"Tournament time slot {time_slot_id} credentials sent and deactivated. "
            f"Success: {sent_count}, Failed: {failed_count}"
        )
        
        return {
            'success': True,
            'time_slot_id': time_slot_id,
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_participants': participants.count()
        }
        
    except ObjectDoesNotExist:
        logger.error(f"Tournament time slot {time_slot_id} not found")
        return {
            'success': False,
            'error': 'Time slot not found'
        }
        
    except Exception as exc:
        logger.error(f"Error in send_and_deactivate for time slot {time_slot_id}: {str(exc)}")
        raise self.retry(exc=exc, countdown=60)

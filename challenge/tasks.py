"""
Celery tasks for challenge/tournament operations
"""
from celery import shared_task
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_tournament_credentials_async(self, tournament_id, room_id=None, room_pass=None, join_url=None):
    """
    Asynchronously send tournament credentials to all participants.
    
    Args:
        tournament_id: ID of the tournament
        room_id: Room ID to send (optional)
        room_pass: Room password to send (optional)
        join_url: Join URL to send (optional)
    
    Returns:
        dict: Result with success status and count
    """
    try:
        from challenge.models import Challenge, ChallengeParticipant
        from notification.models import Notification, FCMToken
        from notification.utils.fcm import send_push_notification
        
        # Get tournament
        tournament = Challenge.objects.select_related('created_by').get(
            id=tournament_id,
            created_by__is_staff=True
        )
        
        # Update credentials if provided
        updated_fields = []
        if room_id is not None:
            tournament.room_id = room_id if room_id else None
            updated_fields.append('room_id')
        if room_pass is not None:
            tournament.room_pass = room_pass if room_pass else None
            updated_fields.append('room_pass')
        if join_url is not None:
            tournament.join_url = join_url if join_url else None
            updated_fields.append('join_url')
        
        if updated_fields:
            tournament._skip_credential_notification = True
            tournament.save(update_fields=updated_fields)
        
        # Get all participants
        participants = ChallengeParticipant.objects.filter(
            challenge=tournament
        ).select_related('user')
        
        sent_count = 0
        failed_count = 0
        
        # Build credential message once
        credential_message = f"Tournament #{tournament.id} - '{tournament.title}' credentials."
        
        # Send notification to each participant
        for participant in participants:
            try:
                user = participant.user
                
                # Create in-app notification
                Notification.objects.create(
                    user=user,
                    notification_type='game',
                    message=credential_message,
                    challenge=tournament,
                    room_id=room_id if room_id else None,
                    room_pass=room_pass if room_pass else None,
                    join_url=join_url if join_url else None
                )
                
                # Send push notification
                fcm_token = FCMToken.objects.filter(
                    user=user,
                    is_active=True
                ).first()
                
                if fcm_token:
                    screen_name = "userTournament" if getattr(tournament.created_by, 'is_staff', False) else "match"
                    
                    send_push_notification(
                        token=fcm_token.token,
                        title="Tournament Credentials!",
                        body="Room ID & Password are provided. Check your notifications!",
                        data={
                            "screen": screen_name,
                            "challenge_id": str(tournament.id),
                            "type": "credentials_updated"
                        }
                    )
                
                sent_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send notification to user {user.id}: {str(e)}")
                failed_count += 1
                continue
        
        logger.info(
            f"Tournament {tournament_id} credentials sent. "
            f"Success: {sent_count}, Failed: {failed_count}"
        )
        
        return {
            'success': True,
            'tournament_id': tournament_id,
            'sent_count': sent_count,
            'failed_count': failed_count,
            'total_participants': sent_count + failed_count
        }
        
    except ObjectDoesNotExist:
        logger.error(f"Tournament {tournament_id} not found")
        return {
            'success': False,
            'error': 'Tournament not found'
        }
        
    except Exception as exc:
        logger.error(f"Error sending tournament credentials: {str(exc)}")
        # Retry the task after 60 seconds
        raise self.retry(exc=exc, countdown=60)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import F
from django.utils import timezone
import logging

from user.permission import IsCustomer
from user.models import CustomUser
from challenge.models import Challenge, ChallengeParticipant
from report.models import Report
from result.models import Result
from notification.models import Notification, FCMToken
from notification.utils.fcm import send_push_notification

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([IsCustomer])
def create_report(request):

    try:
        challenge_id = request.data.get('challenge_id')
        report_type = request.data.get('report_type')
        description = request.data.get('description', '')
        
        # Validate required fields
        if not challenge_id:
            return Response({"message": "Challenge ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not report_type:
            return Response({"message": "Report type is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate report type
        valid_report_types = [choice[0] for choice in Report.REPORT_TYPE_CHOICES]
        if report_type not in valid_report_types:
            return Response({"message": f"Invalid report type."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate game_issue specific requirements
        if report_type == 'game_issue':
            if not description:
                return Response({"message": "Description is required."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if at least one evidence is provided
            has_evidence = any([
                'evidence_1' in request.FILES,
                'evidence_2' in request.FILES,
                'evidence_3' in request.FILES
            ])
            if not has_evidence:
                return Response({"message": "At least one evidence image is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Get and validate challenge
            try:
                challenge = Challenge.objects.get(id=challenge_id)
            except Challenge.DoesNotExist:
                return Response({"message": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Validate challenge status - must be in_progress
            if challenge.status != 'in_progress':
                return Response({"message": "Match cannot be reported."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate challenge is paid (not free) - only paid challenges can be reported
            if challenge.is_free:
                return Response({"message": "Free challenges cannot be reported."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user is a participant
            try:
                participant = ChallengeParticipant.objects.get(challenge=challenge, user=request.user)
            except ChallengeParticipant.DoesNotExist:
                return Response({"message": "You are not a participant in this challenge"}, status=status.HTTP_403_FORBIDDEN)
            
            # Check if user has already submitted their result (only for Game Issue reports)
            if report_type == 'game_issue':
                result_exists = Result.objects.filter(challenge=challenge, participant=participant).exists()
                if result_exists:
                    return Response({"message": "Cannot report Game Issue after submitting result."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user already reported ANY type for this challenge (only one report per user per challenge)
            existing_report = Report.objects.filter(
                challenge=challenge,
                user=request.user
            ).first()
            
            if existing_report:
                return Response({"message": "Report already submitted."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create the report
            report_data = {
                'challenge': challenge,
                'user': request.user,
                'report_type': report_type,
                'description': description,
            }
            
            # Add evidence images only for game_issue type
            if report_type == 'game_issue':
                if 'evidence_1' in request.FILES:
                    report_data['evidence_1'] = request.FILES['evidence_1']
                if 'evidence_2' in request.FILES:
                    report_data['evidence_2'] = request.FILES['evidence_2']
                if 'evidence_3' in request.FILES:
                    report_data['evidence_3'] = request.FILES['evidence_3']
            
            Report.objects.create(**report_data)
            
            # Notify admins about game issue report
            if report_type == 'game_issue':
                try:
                    from notification.models import AdminNotification
                    
                    # Get AdminNotifications with active_for_game_issue enabled
                    admin_notifications = AdminNotification.objects.filter(active_for_game_issue=True)
                    
                    notification_title = "Hi Boss ⚠️"
                    push_body = f"A player reported Game Issue on Match [#{challenge.id}]"
                    in_app_message = f"Hi Boss ⚠️ \n{request.user.full_name} has reported \nGame Issue on Match [#{challenge.id}] \n\n{description}"
                    
                    for admin_notif in admin_notifications:
                        try:
                            # Find admin user by email and send notification
                            admin_users = CustomUser.objects.filter(email=admin_notif.admin_email, is_active=True)
                            
                            for admin_user in admin_users:
                                # Create in-app notification for the admin user
                                Notification.objects.create(
                                    user=admin_user,
                                    notification_type="normal",
                                    message=in_app_message,
                                    challenge=challenge
                                )
                                
                                # Send push notification to admin
                                fcm_tokens = FCMToken.objects.filter(user=admin_user, is_active=True)
                                for fcm_token in fcm_tokens:
                                    try:
                                        send_push_notification(
                                            token=fcm_token.token,
                                            title=notification_title,
                                            body=push_body,
                                            data={
                                                "type": "game_issue_report",
                                                "report_id": str(report_id),
                                                "challenge_id": str(challenge.id),
                                                "reporter_email": request.user.email,
                                                "description": description,
                                            }
                                        )
                                        logger.info(f"Push notification sent to admin {admin_user.email}")
                                    except Exception as push_error:
                                        logger.warning(f"Failed to send push to admin {admin_user.email}: {push_error}")
                        except Exception as admin_error:
                            logger.warning(f"Error notifying admin {admin_notif.admin_email}: {admin_error}")
                    
                    logger.info(f"Game issue notifications sent for report on challenge {challenge.id}")
                    
                except Exception as notification_error:
                    # Don't fail the report if notification fails
                    logger.error(f"Failed to notify admins about game issue report: {notification_error}")
            
            # Check for mutual Refund Agreement - if both players agree, process refund immediately
            mutual_refund_processed = False
            if report_type == 'refund_agreement':
                # Get opponent
                opponent = ChallengeParticipant.objects.filter(
                    challenge=challenge
                ).exclude(user=request.user).first()
                
                if opponent:
                    # Check if opponent also created a Refund Agreement report
                    opponent_refund_report = Report.objects.filter(
                        challenge=challenge,
                        user=opponent.user,
                        report_type='refund_agreement',
                        status='pending'
                    ).select_for_update().first()
                    
                    if opponent_refund_report:
                        # Both players agreed - process mutual refund
                        # Re-lock the challenge to prevent race conditions
                        challenge = Challenge.objects.select_for_update().get(id=challenge.id)
                        
                        # Verify challenge is still in_progress
                        if challenge.status == 'in_progress':
                            entry_fee = challenge.entry_fee or 0
                            
                            # Update challenge status to resolved
                            challenge.status = 'resolved'
                            challenge.save(update_fields=['status'])
                            
                            # Mark both Refund Agreement reports as resolved
                            Report.objects.filter(
                                challenge=challenge,
                                report_type='refund_agreement',
                                status='pending'
                            ).update(
                                status='resolved',
                                resolved_on=timezone.now()
                            )
                            
                            # Remove pending results from verification queue to prevent win submission
                            Result.objects.filter(
                                challenge=challenge,
                                status='pending'
                            ).delete()
                            
                            # Refund entry fee to both participants
                            if entry_fee > 0:
                                participants = ChallengeParticipant.objects.filter(challenge=challenge).select_related('user')
                                
                                for participant in participants:
                                    # Atomic wallet update to prevent race conditions
                                    CustomUser.objects.filter(id=participant.user.id).update(
                                        wallet_balance=F('wallet_balance') + entry_fee
                                    )
                                    
                                    # Refresh user to get updated balance
                                    participant.user.refresh_from_db()
                                    
                                    # Create notification
                                    notification_message = f"Refund Agreement ✅ \nBoth players've done agreement on match [#{challenge.id}], +{entry_fee} refunded"
                                    
                                    Notification.objects.create(
                                        user=participant.user,
                                        notification_type="credited",
                                        message=notification_message,
                                        challenge=challenge
                                    )
                                    
                                    # Send push notification
                                    fcm_token = FCMToken.objects.filter(user=participant.user, is_active=True).first()
                                    if fcm_token:
                                        send_push_notification(
                                            token=fcm_token.token,
                                            title="Refund Agreement Completed ✅",
                                            body=f"Both players agreed to refund on Match [#{challenge.id}], +{entry_fee} refunded",
                                            data={"screen": "wallet", "challenge_id": str(challenge.id)}
                                        )
                                
                                logger.info(
                                    f"Mutual Refund Agreement processed for challenge #{challenge.id} - "
                                    f"{entry_fee} refunded to both players"
                                )
                            
                            mutual_refund_processed = True
            
            # Notify opponent about the report (only if mutual refund not processed)
            if not mutual_refund_processed:
                try:
                    # Get the opponent (other participant in the challenge)
                    opponent = ChallengeParticipant.objects.filter(
                        challenge=challenge
                    ).exclude(user=request.user).first()
                    
                    if opponent and opponent.user:
                        # Create notification title and body based on report type
                        if report_type == 'refund_agreement':
                            notification_title = "Refund Agreement"
                            # Short version for push notification
                            push_notification_body = f"Your opponent wants to do the Refund Agreement on Match [#{challenge.id}]"
                            # Detailed version for database
                            db_notification_body = f"Your opponent wants to do the Refund Agreement, \nYedi tapai le pni [Refund Agreement] garnu vyo vni \nboth player le entry point refund pauney xan. \nPlease ignore this if you want win result. \n\nRefund Agreement Garni Steps Guide:\n1️⃣. Go to My Match\n2️⃣. Click on Report Match of Match [#{challenge.id}]\n3️⃣. Select [Refund Agreement]\n4️⃣. Click Submit  \n\n[ Both player will get entry fee instantly ]"
                        else:  # game_issue
                            notification_title = "Game Issue Reported"
                            push_notification_body = f"Your opponent has reported a Game Issue on Match [#{challenge.id}]. \n\n[ Result will be freezed until admin review the report ]"
                            db_notification_body = push_notification_body
                        
                        # Save notification to database with detailed message
                        Notification.objects.create(
                            user=opponent.user,
                            notification_type="normal",
                            message=db_notification_body,
                            challenge=challenge
                        )
                        
                        # Send push notification with short message
                        fcm_token = FCMToken.objects.filter(user=opponent.user, is_active=True).first()
                        if fcm_token:
                            send_push_notification(
                                token=fcm_token.token,
                                title=notification_title,
                                body=push_notification_body,
                                data={"screen": "match", "challenge_id": str(challenge.id)}
                            )
                            logger.info(f"Notification sent to {opponent.user.email} for report on challenge {challenge.id}")
                except Exception as e:
                    # Log the error but don't fail the report creation
                    logger.error(f"Failed to send notification to opponent: {str(e)}")
                except Exception as e:
                    # Log the error but don't fail the report creation
                    logger.error(f"Failed to send notification to opponent: {str(e)}")
            
            # Return appropriate message
            if mutual_refund_processed:
                return Response({
                    "message": "Refund Agreement completed. Entry fee refunded to both players."
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    "message": "Report submitted successfully."
                }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.exception("Error creating report")
        return Response({"message": f"Unable to create report. {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


















@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user_reports(request):
    try:
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 10))

        # Get user's reports ordered by creation date (newest first)
        base_queryset = Report.objects.filter(user=request.user).select_related('challenge', 'challenge__game').order_by('-reported_on')
        total_count = base_queryset.count()
        reports = base_queryset[offset: offset + limit]
        has_more = offset + limit < total_count

        reports_data = []
        for report in reports:
            reports_data.append({
                "id": report.id,
                "challenge_id": report.challenge.id,
                "report_type": report.report_type,
                "status": report.status,
                "description": report.description,
                "reported_on": report.reported_on,
                "resolved_on": report.resolved_on,
                "admin_notes": report.admin_notes,
                "game_name": report.challenge.game.name if report.challenge and report.challenge.game else None,
                "game_mode": report.challenge.game_mode if report.challenge else None,
                "evidence_1": request.build_absolute_uri(report.evidence_1.url) if report.evidence_1 else None,
                "evidence_2": request.build_absolute_uri(report.evidence_2.url) if report.evidence_2 else None,
                "evidence_3": request.build_absolute_uri(report.evidence_3.url) if report.evidence_3 else None,
            })
        
        return Response({
            "reports": reports_data,
            "has_more": has_more
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.exception("Error fetching user reports")
        return Response({"error": "Unable to retrieve reports"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

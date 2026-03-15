from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
import logging

from challenge.models import Challenge, ChallengeParticipant
from result.models import Result
from report.models import Report
from notification.models import Notification
from notification.models import FCMToken
from notification.utils.fcm import send_push_notification

logger = logging.getLogger(__name__)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_result(request):
    """
    Submit a result for a challenge with screenshots and game result
    Required fields:
    - challenge_id
    - screenshot_1 (file)
    - game_result (win/lose/draw)
    Optional fields:
    - screenshot_2 (file) - Required for all games except Chess
    """
    try:
        # Validate required fields
        challenge_id = request.data.get('challenge_id')
        game_result = request.data.get('game_result')
        
        if not challenge_id:
            return Response({"message": "Challenge ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not game_result:
            return Response({"message": "Game result is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        # Validate game_result choice
        valid_game_results = ['win', 'lose', 'draw']
        if game_result not in valid_game_results:
            return Response({"message": f"Game result must be one of: {', '.join(valid_game_results)}"}, status=status.HTTP_400_BAD_REQUEST)

        # At least one screenshot must be provided for any submission/update
        if 'screenshot_1' not in request.FILES and 'screenshot_2' not in request.FILES:
            return Response({"message": "At least one screenshot is required"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Get and validate challenge
            try:
                challenge = Challenge.objects.select_for_update().get(id=challenge_id)
            except Challenge.DoesNotExist:
                return Response({"message": "Challenge not found"}, status=status.HTTP_404_NOT_FOUND)

            # Check if user is a participant
            try:
                participant = ChallengeParticipant.objects.get(challenge=challenge, user=request.user)
            except ChallengeParticipant.DoesNotExist:
                return Response({"message": "You are not a participant in this challenge"}, status=status.HTTP_403_FORBIDDEN)

            # Check if user has created a Game Issue report for this challenge
            has_game_issue_report = Report.objects.filter(
                challenge=challenge,
                user=request.user,
                report_type='game_issue'
            ).exists()
            if has_game_issue_report:
                return Response({"message": "Cannot submit result after reporting on Game Issue."}, status=status.HTTP_400_BAD_REQUEST)

            # Check if challenge is in valid state
            if challenge.status not in ['not_started', 'in_progress']:
                return Response({"message": f"Portal is closed for now, Please try again later."}, status=status.HTTP_400_BAD_REQUEST)

            # Check if user has already submitted a result
            existing_result = Result.objects.filter(challenge=challenge, participant=participant).first()
            if existing_result:
                # Resubmission: allow updating with one or both screenshots and game result
                if existing_result.submission_count >= 3:
                    return Response({"message": "Maximum submission limit reached (3 times)."}, status=status.HTTP_400_BAD_REQUEST)

                # Ensure at least one screenshot is provided for update (checked above)
                existing_result.submission_count += 1
                existing_result.game_result = game_result  # Update game result

                if 'screenshot_1' in request.FILES:
                    existing_result.screenshot_1 = request.FILES['screenshot_1']
                if 'screenshot_2' in request.FILES:
                    existing_result.screenshot_2 = request.FILES['screenshot_2']

                existing_result.save()
                result = existing_result
                is_resubmission = True
            else:
                # First submission: require both screenshots and game result
                if 'screenshot_1' not in request.FILES or 'screenshot_2' not in request.FILES:
                    return Response({"message": "Two screenshots are required for the first submission."}, status=status.HTTP_400_BAD_REQUEST)

                result = Result(
                    challenge=challenge,
                    participant=participant,
                    screenshot_1=request.FILES['screenshot_1'],
                    screenshot_2=request.FILES['screenshot_2'],
                    game_result=game_result
                )
                result.save()
                is_resubmission = False

                # Update challenge flag when first result is submitted
                if not challenge.at_least_one_result_submitted:
                    challenge.at_least_one_result_submitted = True
                    challenge.save(update_fields=['at_least_one_result_submitted'])

            # Return response with appropriate message and status code
            if is_resubmission:
                message = f"Result updated - {game_result.title()}"
                resp_status = status.HTTP_200_OK
            else:
                message = f"Result submitted - {game_result.title()}"
                resp_status = status.HTTP_201_CREATED

            # Send notification to opponent when winner submits result
            if game_result in ['win', 'lose']:
                # Get all participants in this challenge (excluding current user)
                opponent_participants = ChallengeParticipant.objects.filter(
                    challenge=challenge
                ).exclude(user=request.user).select_related('user')
                
                for opponent_participant in opponent_participants:
                    opponent = opponent_participant.user
                    
                    # Prepare notification message
                    game_mode = challenge.game_mode or 'Standard'
                    if game_result == 'win':
                        notification_message = f"Match [#{challenge.id}] {request.user.full_name} has submitted result as Winner for the {game_mode} match."
                        notification_title = "Result Submitted"
                    else:  # lose
                        notification_message = f"Match [#{challenge.id}] {request.user.full_name} has submitted result as Lost for the {game_mode} match."
                        notification_title = "Result Submitted"
                    
                    # Create in-app notification
                    Notification.objects.create(
                        user=opponent,
                        notification_type='result_submitted',
                        message=notification_message,
                        challenge=challenge
                    )
                    
                    # Send push notification
                    try:
                        fcm_tokens = FCMToken.objects.filter(user=opponent, is_active=True)
                        for token_obj in fcm_tokens:
                            send_push_notification(
                                token=token_obj.token,
                                title=notification_title,
                                body=notification_message,
                                data={
                                    'screen': 'challenge_details',
                                    'challenge_id': str(challenge.id),
                                    'type': 'result_submitted'
                                }
                            )
                    except Exception as e:
                        logger.warning(f"Failed to send push notification to opponent {opponent.id}: {str(e)}")

            return Response({
                "message": message,
                "game_result": game_result,
            }, status=resp_status)

    except Exception as e:
        logger.exception("Error submitting result")
        return Response({"message": f"Unable to submit result: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_result(request):
    try:
        challenge_id = request.GET.get("challenge_id")  # ?challenge_id=123
        
        if not challenge_id:
            return Response({"message": "challenge_id is required"}, status=400)

        result = Result.objects.select_related('challenge', 'participant').filter(
            challenge_id=challenge_id,
            participant__user=request.user
        ).first()

        if not result:
            return Response({"message": "No result found for this challenge"}, status=404)

        return Response({
            "message":"Result fetched successfully",
            "result":{
                "id": result.id,
                "status": result.status,
                "submission_count": result.submission_count,
                "game_result": result.game_result,
                "created_at": result.created_at,
                "reviewed_at": result.reviewed_at,
                "screenshot_1": request.build_absolute_uri(result.screenshot_1.url) if result.screenshot_1 else None,
                "screenshot_2": request.build_absolute_uri(result.screenshot_2.url) if result.screenshot_2 else None,
            }}
        )
    except Exception as e:
        logger.exception("Error fetching result")
        return Response({"message": f"Unable to fetch result: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)






          # Notify challenge creator
            # if challenge.created_by != request.user:
            #     notification_message = f"{request.user.full_name} has submitted a result for your challenge"
            #     Notification.objects.create(
            #         user=challenge.created_by,
            #         notification_type="result",
            #         message=notification_message,
            #         challenge=challenge
            #     )
                
            #     fcm_token = FCMToken.objects.filter(user=challenge.created_by, is_active=True).first()
            #     if fcm_token:
            #         send_push_notification(
            #             token=fcm_token.token,
            #             title="Result Submitted",
            #             body=notification_message,
            #             data={"screen": "challenge_results", "challenge_id": challenge_id}
            #         )





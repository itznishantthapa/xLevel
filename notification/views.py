from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Banner, FCMToken
from .serializers import BannerSerializer, NotificationSerializer
from .utils.fcm import send_push_notification
from .models import Notification

@api_view(['GET'])
def get_banners(request):
    try:
        banners = Banner.objects.all().order_by('id')
        serializer = BannerSerializer(banners, many=True, context={'request': request})
        
        return Response({
            'message': 'Banners retrieved successfully',
            'banners': serializer.data
        })
    except Exception as e:
        return Response({
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_fcm_token(request):
    """
    Save or update FCM token for the authenticated user
    """
    token = request.data.get('token')
    
    if not token:
        return Response(
            {'error': 'FCM token is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Update or create the token
    try:
        fcm_token, created = FCMToken.objects.update_or_create(
            user=request.user,
            defaults={
                'token': token,
                'is_active': True
            }
        )
        
        return Response({
            'success': True,
            'message': 'FCM token saved successfully 2',
            'is_active': fcm_token.is_active,
            'created': created
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_fcm_token(request):
    """
    Get the current user's FCM token
    """
    try:
        fcm_token = FCMToken.objects.filter(user=request.user, is_active=True).first()
        if fcm_token:
            return Response({
                'token': fcm_token.token,
                'created_at': fcm_token.created_at,
                'updated_at': fcm_token.updated_at
            })
        return Response({
            'message': 'No active FCM token found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_fcm_token(request):
    """
    Delete the current user's FCM token
    """
    try:
        fcm_token = FCMToken.objects.filter(user=request.user, is_active=True).first()
        if not fcm_token:
            return Response({
                'message': 'No active FCM token found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        fcm_token.delete()
        return Response({
            'success': True,
            'message': 'FCM token deleted successfully'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_room_notification(request):
    """
    Create room notifications for all participants in a challenge
    """
    try:
        # Get and validate required fields
        room_id = request.data.get('room_id')
        room_pass = request.data.get('room_pass')
        challenge_id = request.data.get('challenge_id')

        # Validate required fields
        if not all([room_id, room_pass, challenge_id]):
            return Response({
                'message': 'room_id, room_pass, and challenge_id are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get the challenge instance
        try:
            from challenge.models import Challenge, ChallengeParticipant
            challenge = Challenge.objects.get(id=challenge_id)

            # Verify that the request user is the challenge creator
            if challenge.created_by != request.user:
                return Response({
                    'message': 'Only challenge creator can send room details'
                }, status=status.HTTP_403_FORBIDDEN)

            # Get all participants except the creator
            participants = ChallengeParticipant.objects.filter(
                challenge=challenge
            ).exclude(
                user=request.user  # Exclude the creator
            ).select_related('user')

            if not participants.exists():
                return Response({
                    'message': 'No participants found in this challenge'
                }, status=status.HTTP_400_BAD_REQUEST)

            notification_count = 0
            for participant in participants:
                # Create notification record
                notification = Notification.objects.create(
                    user=participant.user,
                    notification_type='game',
                    message=f"Match [#{challenge.id}] {request.user.full_name} sent you {challenge.game.name} roomID and Password",
                    room_id=room_id,
                    room_pass=room_pass,
                    challenge=challenge
                )

                # Send push notification
                fcm_token = FCMToken.objects.filter(user=participant.user, is_active=True).first()
                if fcm_token:
                    send_push_notification(
                        token=fcm_token.token,
                        title="Room Details",
                        body=f"Match [#{challenge.id}] {request.user.full_name} sent you {challenge.game.name} roomID and Password",
                        data={
                            "screen": "match",
                            "room_id": room_id,
                            "room_pass": room_pass
                        }
                    )
                notification_count += 1

            return Response(
                {
                    'message': f'Room notifications sent successfully to {notification_count} participants',
                }, 
                status=status.HTTP_201_CREATED
            )
        except Challenge.DoesNotExist:
            return Response({
                'message': 'Challenge not found'
            }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications_on_loads(request):
    """
    Get paginated notifications for the authenticated user
    """
    try:
        # Get pagination parameters with defaults
        offset = int(request.GET.get('offset', 0))
        limit = int(request.GET.get('limit', 10))

        # Get base queryset of user's notifications
        base_queryset = Notification.objects.filter(
            user=request.user
        ).order_by('-created_at')

        # Get total count for has_more calculation
        total_count = base_queryset.count()

        # Get paginated notifications
        notifications = base_queryset[offset:offset + limit]

        # Check if there are more notifications
        has_more = offset + limit < total_count

        serializer = NotificationSerializer(notifications, many=True)
        
        return Response({
            'notifications': serializer.data,
            'has_more': has_more
        }, status=status.HTTP_200_OK)

    except ValueError:
        return Response({
            'message': 'Invalid offset or limit value'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


 
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from user.models import CustomUser, Block
from django.db import transaction
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)


def _get_user_data(user, request):
    profile_picture_url = request.build_absolute_uri(user.profile_picture.url) if getattr(user, "profile_picture", None) else None
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "wallet_balance": user.wallet_balance,
        "profile_picture": profile_picture_url,
        "user_access_code": user.user_access_code,
        "ads_count": user.ads_count,
        "created_at": user.created_at.isoformat() if getattr(user, "created_at", None) else None,
    }


# Purpose: Retrieve the authenticated user's profile.
# Input: Authorization header with a valid JWT access token.
# Output (JSON):
#   - message (string)
#   - user (object: id, email, full_name, role, wallet_balance, profile_picture, created_at)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_user(request):
    try:
        user_data = _get_user_data(request.user, request)
        return Response({"message": "User data retrieved successfully", "user": user_data})
    except Exception:
        logger.exception("Error fetching user data")
        return Response({"message": "Error fetching user data"}, status=status.HTTP_400_BAD_REQUEST)


# Purpose: Update the authenticated user's profile details.
# Input (multipart/form-data or JSON):
#   - full_name (string, optional)
#   - profile_picture (file, optional)
# Output (JSON):
#   - message (string)
#   - user (object: id, email, full_name, role, wallet_balance, profile_picture, created_at)
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_profile(request):
    try:
        user = request.user

        full_name = request.data.get("full_name")
        if full_name is not None:
            user.full_name = full_name

        if "profile_picture" in request.FILES:
            img = request.FILES["profile_picture"]

            # Open and compress image for faster load and less storage
            image = Image.open(img)
            image = image.convert("RGB")  # Remove alpha channel for consistency
            image.thumbnail((500, 500))  # Resize to max 500x500 (maintains aspect ratio)

            # Compress image to JPEG with 70% quality
            buffer = BytesIO()
            image.save(buffer, format="JPEG", quality=70)
            buffer.seek(0)

            # Save compressed image with consistent naming
            user.profile_picture.save(
                f"{user.id}_profile.jpg",
                ContentFile(buffer.read()),
                save=False
            )

        elif "profile_picture" in request.data and request.data.get("profile_picture") is None:
            # Explicitly allow clearing the picture by providing null in JSON
            user.profile_picture = None

        user.save()
        user_data = _get_user_data(user, request)
        return Response({"message": "Profile updated successfully", "user": user_data})
    except Exception:
        logger.exception("Error updating profile")
        return Response({"message": "Could not update profile"}, status=status.HTTP_400_BAD_REQUEST)


# Purpose: Retrieve leaderboard of top 25 users ranked by wallet balance and requesting user's rank.
# Input: None (GET). Requires auth.
# Output (JSON): message, top 25 users list with rank, name, profile picture and wallet balance, user_rank (int)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def leaderboards_user_on_loads(request):
    try:
        # Get top 25 users ordered by wallet balance (highest first)
        top_users = CustomUser.objects.filter(
            wallet_balance__gt=0  # Only include users with positive balance
        ).order_by("-wallet_balance")[:25]

        # Build response for top 25 users
        leaderboard_users = []
        for index, user in enumerate(top_users):
            profile_picture_url = request.build_absolute_uri(user.profile_picture.url) if user.profile_picture else None
            
            # Get enhancer data using utility function
            enhancer_data = get_user_enhancer_data(user)
            
            user_data = {
                "rank": index + 1,  # Rank from 1 to 25
                "id": user.id,
                "full_name": user.full_name,
                "profile_picture": profile_picture_url,
                "wallet_balance": user.wallet_balance,
                
                # Ownership status (user owns these enhancers)
                "have_pro_tag": enhancer_data['have_pro_tag'],
                "have_hacker_tag": enhancer_data['have_hacker_tag'],
                "have_exposer": enhancer_data['have_exposer'],
                
                # Active status (currently displayed tags)
                "active_pro_tag": enhancer_data['active_pro_tag'],
                "active_hacker_tag": enhancer_data['active_hacker_tag'],
                "active_exposer": enhancer_data['active_exposer'],
                
                # Legacy and summary fields
                "active_tags": enhancer_data['active_tags'],
                "has_any_enhancer": enhancer_data['has_any_enhancer'],
                "has_active_enhancer": enhancer_data['has_active_enhancer']
            }
            leaderboard_users.append(user_data)

        # Calculate requesting user's rank
        user_rank = None
        if request.user.wallet_balance > 0:
            # Count users with higher wallet balance than requesting user
            higher_balance_count = CustomUser.objects.filter(
                wallet_balance__gt=request.user.wallet_balance
            ).count()
            user_rank = higher_balance_count + 1
        else:
            # User has 0 or negative balance, not ranked
            user_rank = None

        return Response({
            "message": "Leaderboard retrieved successfully",
            "leaderboard_users": leaderboard_users,
            "user_rank": user_rank
        })
    except Exception:
        logger.exception("Error retrieving leaderboard")
        return Response(
            {"message": "Unable to retrieve leaderboard"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: Block a user by adding them to the blocker's blocked list.
# Input (JSON): reportedUserId (int), reason (string, optional)
# Output (JSON): message, block_id
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def block_user(request):
    try:
        reported_user_id = request.data.get('reportedUserId')
        reason = request.data.get('reason', '')

        # Validate required fields
        if not reported_user_id:
            return Response(
                {"message": "reportedUserId is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate that user is not trying to block themselves
        if int(reported_user_id) == request.user.id:
            return Response(
                {"message": "You cannot block yourself"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Check if the user to be blocked exists
            try:
                blocked_user = CustomUser.objects.get(id=reported_user_id)
            except CustomUser.DoesNotExist:
                return Response(
                    {"message": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if user is already blocked
            existing_block = Block.objects.filter(
                blocker=request.user,
                blocked=blocked_user
            ).first()

            if existing_block:
                return Response(
                    {"message": "User is already blocked"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create the block
            block = Block.objects.create(
                blocker=request.user,
                blocked=blocked_user,
                reason=reason
            )

            return Response({
                "message": "User blocked successfully",
            }, status=status.HTTP_201_CREATED)

    except ValueError:
        return Response(
            {"message": "Invalid reportedUserId value"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception:
        logger.exception("Error blocking user")
        return Response(
            {"message": "Unable to block user"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: Unblock a user by removing them from the blocker's blocked list.
# Input (JSON): reportedUserId (int)
# Output (JSON): message
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def unblock_user(request):
    try:
        reported_user_id = request.data.get('reportedUserId')

        # Validate required fields
        if not reported_user_id:
            return Response(
                {"message": "reportedUserId is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Check if the user to be unblocked exists
            try:
                blocked_user = CustomUser.objects.get(id=reported_user_id)
            except CustomUser.DoesNotExist:
                return Response(
                    {"message": "User not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Find and delete the block
            try:
                block = Block.objects.get(
                    blocker=request.user,
                    blocked=blocked_user
                )
                block.delete()

                return Response({
                    "message": "User unblocked successfully"
                })

            except Block.DoesNotExist:
                return Response(
                    {"message": "User is not blocked"},
                    status=status.HTTP_400_BAD_REQUEST
                )

    except ValueError:
        return Response(
            {"message": "Invalid reportedUserId value"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception:
        logger.exception("Error unblocking user")
        return Response(
            {"message": "Unable to unblock user"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Purpose: Get list of all blocked users for the requesting user.
# Input: None (GET). Requires auth.
# Output (JSON): message, blocked_users list
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_blocked_users(request):
    try:
        # Get all blocked users ordered by block creation date
        blocks = Block.objects.filter(
            blocker=request.user
        ).select_related('blocked').order_by("-created_at")

        # Build response with blocked user information
        blocked_users_data = []
        for block in blocks:
            blocked_user = block.blocked
            profile_picture_url = request.build_absolute_uri(blocked_user.profile_picture.url) if blocked_user.profile_picture else None
            
            blocked_users_data.append({
                "block_id": block.id,
                "user_id": blocked_user.id,
                "full_name": blocked_user.full_name,
                "profile_picture": profile_picture_url,
                "reason": block.reason,
                "blocked_at": block.created_at.isoformat()
            })

        return Response({
            "message": "Blocked users retrieved successfully",
            "blocked_users": blocked_users_data
        })
    except Exception:
        logger.exception("Error retrieving blocked users")
        return Response(
            {"message": "Unable to retrieve blocked users"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction
from .models import Product, TopupRequest
from user.models import CustomUser

logger = logging.getLogger(__name__)

_GAME_REQUIRED_FIELDS = {
    "freefire": ["uid", "username"],
    "pubg":     ["uid", "username"],
    "mlbb":     ["uid", "zone_id"],
}


def _notify_admin_topup(user, product_label, points_deducted, order_id):
    """Send admin notifications for topup requests."""
    try:
        from notification.models import FCMToken, AdminNotification, Notification
        from notification.utils.fcm import send_push_notification
        
        # Get AdminNotifications with active_for_topup enabled
        admin_notifications = AdminNotification.objects.filter(active_for_topup=True)
        
        notification_title = "Hi Boss 🛍️"
        push_body = f"+{product_label} topup requested."
        in_app_message = f"Hi Boss 🛍️ \n{user.full_name} has requested topup of \n{product_label} for {points_deducted} points"
        
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
                                    "type": "topup_request",
                                    "order_id": str(order_id),
                                    "buyer_email": user.email,
                                    "product_label": product_label,
                                    "amount": str(points_deducted),
                                }
                            )
                            logger.info(f"Push notification sent to admin {admin_user.email}")
                        except Exception as push_error:
                            logger.warning(f"Failed to send push to admin {admin_user.email}: {push_error}")
            except Exception as admin_error:
                logger.warning(f"Error notifying admin {admin_notif.admin_email}: {admin_error}")
        
        logger.info(f"Topup notifications sent for order {order_id}")
        
    except Exception as notification_error:
        # Don't fail the transaction if notification fails
        logger.error(f"Failed to notify admins about topup order {order_id}: {notification_error}")


def _build_order_response(order, label):
    return {
        "id": f"SR{order.id}",
        "type": "store",
        "label": label,
        "amount": order.points_deducted,
        "status": order.status,
        "transaction_code": None,
        "admin_notes": order.admin_notes,
        "processed_by": order.processed_by.full_name if order.processed_by else None,
        "processed_at": order.processed_at,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


def _efootball_topup(request):
    screenshot = request.FILES.get("screenshot")
    raw_points = request.data.get("calculated_game_point")
    email      = request.data.get("email", "").strip()
    password   = request.data.get("password", "").strip()

    missing = [f for f, v in [("screenshot", screenshot), ("calculated_game_point", raw_points), ("email", email), ("password", password)] if not v]
    if missing:
        return Response({"message": f"Missing required fields: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        game_points = int(raw_points)
        if game_points <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response({"message": "calculated_game_point must be a positive integer"}, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        user_locked = CustomUser.objects.select_for_update().get(pk=request.user.pk)
        if user_locked.wallet_balance < game_points:
            return Response({"message": "Insufficient Game Points", "available_balance": float(user_locked.wallet_balance)}, status=status.HTTP_400_BAD_REQUEST)

        user_locked.wallet_balance -= game_points
        user_locked.save(update_fields=["wallet_balance"])

        order = TopupRequest.objects.create(
            user=user_locked,
            product=None,
            username=email,
            password=password,
            request_item_image=screenshot,
            points_deducted=game_points,
        )
        
        # Notify admins about topup request
        _notify_admin_topup(user_locked, "eFootball Item", game_points, order.id)

    logger.info(f"eFootball TopupRequest created: ID={order.id}, User={user_locked.email}, Points={game_points}")
    return Response(
        {"message": "Top-up request placed successfully", "order": _build_order_response(order, "eFootball Item")},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_store_items(request):
    try:
        game = request.GET.get("game")
        if not game:
            return Response({"message": "game param is required"}, status=status.HTTP_400_BAD_REQUEST)

        valid_games = [c[0] for c in Product.GAME_CHOICES]
        if game not in valid_games:
            return Response({"message": f"Invalid game. Choices: {valid_games}"}, status=status.HTTP_400_BAD_REQUEST)

        items = Product.objects.filter(game=game, is_active=True)
        data = [
            {
                "id": item.id,
                "type": item.type,
                "label": item.label,
                "quantity": item.quantity,
                "points": item.points,
                "image": request.build_absolute_uri(item.image.url) if item.image else None,
            }
            for item in items
        ]
        return Response({"game": game, "items": data}, status=status.HTTP_200_OK)

    except Exception:
        logger.exception("Error fetching store items")
        return Response({"message": "Unable to retrieve store items"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def place_topup_request(request):
    try:
        product_id = request.data.get("product_id")

        if not product_id:
            return _efootball_topup(request)

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({"message": "Product not found or inactive"}, status=status.HTTP_404_NOT_FOUND)

        missing = [f for f in _GAME_REQUIRED_FIELDS.get(product.game, []) if not request.data.get(f)]
        if missing:
            return Response(
                {"message": f"Missing required fields for {product.get_game_display()}: {', '.join(missing)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with db_transaction.atomic():
            user_locked = CustomUser.objects.select_for_update().get(pk=request.user.pk)
            if user_locked.wallet_balance < product.points:
                return Response(
                    {"message": "Insufficient Game Points", "available_balance": float(user_locked.wallet_balance)},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user_locked.wallet_balance -= product.points
            user_locked.save(update_fields=["wallet_balance"])

            order = TopupRequest.objects.create(
                user=user_locked,
                product=product,
                uid=request.data.get("uid"),
                zone_id=request.data.get("zone_id"),
                username=request.data.get("username"),
                password=request.data.get("password"),
                points_deducted=product.points,
            )
            
            # Notify admins about topup request
            _notify_admin_topup(user_locked, product.label, product.points, order.id)

        logger.info(f"TopupRequest created: ID={order.id}, User={user_locked.email}, Product={product}, Points={product.points}")
        return Response(
            {"message": "Top-up request placed successfully", "order": _build_order_response(order, product.label)},
            status=status.HTTP_201_CREATED,
        )

    except Exception:
        logger.exception("Error placing top-up request")
        return Response({"message": "Unable to place top-up request"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

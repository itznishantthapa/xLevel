from django.shortcuts import render
from django.db import transaction as db_transaction
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import GameAccount, GameAccountScreenshot
from decimal import Decimal
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

# Refundable deposit amount required to list a game account
LISTING_DEPOSIT = Decimal('20.00')


def _game_account_to_json(account: GameAccount, request):
    """Convert GameAccount instance to JSON response format."""
    
    # Get seller information
    seller = account.seller
    seller_info = {
        "full_name": seller.full_name,
        "email": seller.email,
        "profile_picture": request.build_absolute_uri(seller.profile_picture.url) if seller.profile_picture else None,
    }
    
    # Get all screenshots for this account
    screenshots = GameAccountScreenshot.objects.filter(
        game_account=account
    ).order_by('order')
    
    images = [
        request.build_absolute_uri(screenshot.image.url) 
        for screenshot in screenshots
    ]
    
    return {
        "id": account.id,
        "description": account.description,
        "points": float(account.price),  # Convert Decimal to float
        "status": account.status,
        "game": account.get_account_type_display(),  # Display name like "Free Fire"
        "seller": seller_info,
        "images": images,
        "created_at": account.created_at,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_game_accounts_on_loads(request):
    """
    Get paginated list of available game accounts for sale.
    Returns all accounts that are not sold yet.
    
    Query params:
        - offset (int, default 0): Pagination offset
        - limit (int, default 5): Number of items per page
    
    Returns:
        - message: Success/error message
        - accounts: List of game account objects
        - has_more: Boolean indicating if more items exist
    """
    try:
        offset = int(request.GET.get("offset", 0))
        limit = int(request.GET.get("limit", 5))
        
        # Get all accounts that are approved and not sold yet
        base_queryset = GameAccount.objects.filter(
            status=GameAccount.Status.NOT_SOLD
        ).select_related('seller').prefetch_related('screenshots').order_by('-created_at')
        
        # Get total count and paginate
        total_count = base_queryset.count()
        accounts = base_queryset[offset: offset + limit]
        has_more = offset + limit < total_count
        
        # Convert to response format
        response = [_game_account_to_json(account, request) for account in accounts]
        
        return Response({
            "message": "Game accounts retrieved successfully",
            "accounts": response,
            "has_more": has_more
        }, status=status.HTTP_200_OK)
        
    except ValueError:
        return Response(
            {"message": "Invalid offset or limit value"},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception:
        logger.exception("Error retrieving game accounts")
        return Response(
            {"message": "Unable to retrieve game accounts"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def create_game_account(request):
    """
    Create a new game account listing for sale.
    Requires a refundable deposit of 20 points from user's wallet.
    
    Required fields:
        - game: string (FreeFire, MLBB, eFootball, PUBG, Others)
        - description: text
        - login_method: string (facebook/gmail)
        - login_email: email/phone for account login
        - login_password: password for account login
        - contact_number: seller's contact number
        - price: decimal
        - images: array of image files (max 6)
    
    Returns:
        - message: Success/error message
        - account: Created game account object (on success)
    """
    try:
        user = request.user
        
        # Check if user has sufficient wallet balance
        if user.wallet_balance < LISTING_DEPOSIT:
            return Response({
                "message": f"Insufficient balance. You need at least ₹{LISTING_DEPOSIT} as refundable deposit to list an account."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract and validate data
        game = request.data.get('game', '').strip()
        description = request.data.get('description', '').strip()
        login_method = request.data.get('login_method', '').strip().lower()
        login_email = request.data.get('login_email', '').strip()
        login_password = request.data.get('login_password', '').strip()
        contact_number = request.data.get('contact_number', '').strip()
        price = request.data.get('price')
        
        # Get images from request.FILES
        images = request.FILES.getlist('images')
        
        # Validation
        if not all([game, description, login_method, login_email, login_password, contact_number, price]):
            return Response({
                "message": "All fields are required: game, description, login_method, login_email, login_password, contact_number, price"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not images:
            return Response({
                "message": "At least one screenshot is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(images) > 6:
            return Response({
                "message": "Maximum 6 screenshots allowed"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Map game name to AccountType choice
        game_mapping = {
            'freefire': GameAccount.AccountType.FREE_FIRE,
            'free fire': GameAccount.AccountType.FREE_FIRE,
            'mlbb': GameAccount.AccountType.MLBB,
            'mobile legends': GameAccount.AccountType.MLBB,
            'efootball': GameAccount.AccountType.EFOOTBALL,
            'pubg': GameAccount.AccountType.PUBG,
            'pubg mobile': GameAccount.AccountType.PUBG,
            'others': GameAccount.AccountType.OTHERS,
        }
        
        account_type = game_mapping.get(game.lower())
        if not account_type:
            return Response({
                "message": f"Invalid game type. Choose from: FreeFire, MLBB, eFootball, PUBG, Others"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Map login method
        login_method_mapping = {
            'facebook': GameAccount.LoginMethod.FACEBOOK,
            'fb': GameAccount.LoginMethod.FACEBOOK,
            'gmail': GameAccount.LoginMethod.GMAIL,
            'google': GameAccount.LoginMethod.GMAIL,
        }
        
        login_method_choice = login_method_mapping.get(login_method)
        if not login_method_choice:
            return Response({
                "message": "Invalid login method. Choose 'facebook' or 'gmail'"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate price
        try:
            price = Decimal(str(price))
            if price <= 0:
                return Response({
                    "message": "Price must be greater than 0"
                }, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({
                "message": "Invalid price format"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use atomic transaction to ensure all-or-nothing
        with db_transaction.atomic():
            # Deduct deposit from user's wallet
            user.wallet_balance -= LISTING_DEPOSIT
            user.save(update_fields=['wallet_balance'])
            
            # Create game account listing
            game_account = GameAccount.objects.create(
                seller=user,
                seller_contact_number=contact_number,
                account_type=account_type,
                description=description,
                login_method=login_method_choice,
                login_email_phone=login_email,
                login_password=login_password,
                price=price,
                status=GameAccount.Status.NOT_SOLD  # Available for sale immediately
            )
            
            # Create screenshots
            for index, image in enumerate(images, start=1):
                GameAccountScreenshot.objects.create(
                    game_account=game_account,
                    image=image,
                    order=index
                )
        
        # Return success response
        return Response({
            "message": f"Game account listed successfully!",
            "account": _game_account_to_json(game_account, request)
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.exception("Error creating game account listing")
        return Response({
            "message": f"Unable to create listing: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def purchase_game_account(request):
    """
    Purchase a game account listing.
    Deducts the account price from buyer's wallet and sets status to pending.
    
    Required fields:
        - account_id: int (ID of the game account to purchase)
    
    Returns:
        - message: Success/error message
        - account: Purchased game account object (on success)
    """
    try:
        user = request.user
        account_id = request.data.get('account_id')

        if not account_id:
            return Response(
                {"message": "account_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            account_id = int(account_id)
        except (TypeError, ValueError):
            return Response(
                {"message": "Invalid account_id format"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with db_transaction.atomic():
            try:
                game_account = GameAccount.objects.select_for_update().select_related('seller').get(id=account_id)
            except GameAccount.DoesNotExist:
                return Response(
                    {"message": "Game account not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Cannot purchase own listing
            if game_account.seller_id == user.id:
                return Response(
                    {"message": "You cannot purchase your own listing"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Only accounts with status 'not_sold' can be purchased
            if game_account.status != GameAccount.Status.NOT_SOLD:
                return Response(
                    {"message": "This account is no longer available for purchase"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            price = game_account.price

            # Check buyer's wallet balance
            if user.wallet_balance < price:
                return Response({
                    "message": "Insufficient Game Points",
                    "required": float(price),
                    "available": float(user.wallet_balance)
                }, status=status.HTTP_400_BAD_REQUEST)

            # Deduct price from buyer's wallet
            user.wallet_balance -= price
            user.save(update_fields=['wallet_balance'])

            # Update game account status and buyer
            game_account.status = GameAccount.Status.PENDING
            game_account.buyer = user
            game_account.requested_at = timezone.now()
            game_account.save(update_fields=['status', 'buyer', 'requested_at'])
            
            # Notify admins with active_for_account_purchase preference
            try:
                from notification.models import FCMToken, AdminNotification, Notification
                from notification.utils.fcm import send_push_notification
                
                # Get AdminNotifications with active_for_account_purchase enabled
                admin_notifications = AdminNotification.objects.filter(active_for_account_purchase=True)
                
                account_type = game_account.get_account_type_display()
                notification_title = "Hi Boss 👾"
                push_body = f"A user has purchased {account_type} Account for {price} points"
                in_app_message = f"Hi Boss 👾 \n{user.full_name} has purchased \n{account_type} Account for {price} points"
                
                for admin_notif in admin_notifications:
                    try:
                        # Find admin user by email and send notification
                        from user.models import CustomUser
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
                                            "type": "account_purchase",
                                            "account_id": str(game_account.id),
                                            "buyer_email": user.email,
                                            "seller_email": game_account.seller.email,
                                            "account_type": account_type,
                                            "amount": str(price),
                                        }
                                    )
                                    logger.info(f"Push notification sent to admin {admin_user.email}")
                                except Exception as push_error:
                                    logger.warning(f"Failed to send push to admin {admin_user.email}: {push_error}")
                    except Exception as admin_error:
                        logger.warning(f"Error notifying admin {admin_notif.admin_email}: {admin_error}")
                
                logger.info(f"Account purchase notifications sent for account {game_account.id}")
                
            except Exception as notification_error:
                # Don't fail the transaction if notification fails
                logger.error(f"Failed to notify admins about account purchase {game_account.id}: {notification_error}")
            
            # Notify seller about the purchase
            try:
                from notification.models import Notification, FCMToken
                from notification.utils.fcm import send_push_notification
                
                seller = game_account.seller
                notification_message = (
                    f" {user.full_name} wants to buy your {account_type} Account for {price} points!\n\n"
                    f"Admin will take 10 minutes to review the account . \nPlease stay in contact.\n\n"
                    f"Check Status -> [Go to Home, Click on Request] to see status]"
                )
                
                # Create in-app notification
                Notification.objects.create(
                    user=seller,
                    notification_type="store",
                    message=notification_message,
                )
                
                # Send push notification to seller
                push_notification_title = "Game Account 🎮"
                push_notification_body = f"Your {account_type} Account has been requested for purchase. Now admin will review it for 10 minutes."
                
                fcm_tokens = FCMToken.objects.filter(user=seller, is_active=True)
                for fcm_token in fcm_tokens:
                    try:
                        send_push_notification(
                            token=fcm_token.token,
                            title=push_notification_title,
                            body=push_notification_body,
                            data={
                                "type": "account_purchased",
                                "account_id": str(game_account.id),
                                "buyer_name": user.full_name,
                                "buyer_email": user.email,
                                "amount": str(price),
                            }
                        )
                        logger.info(f"Push notification sent to seller {seller.email}")
                    except Exception as push_error:
                        logger.warning(f"Failed to send push to seller {seller.email}: {push_error}")
                
                logger.info(f"Seller notification sent to {seller.email} for account {game_account.id}")
                
            except Exception as seller_notification_error:
                logger.error(f"Failed to notify seller about account purchase {game_account.id}: {seller_notification_error}")

        # Return in transaction format for shared Request screen
        transaction_data = {
            "id": f"GA{game_account.id}",
            "type": "store",
            "label": f"{game_account.get_account_type_display()} Account",
            "amount": float(price),
            "status": game_account.status,
            "transaction_code": None,
            "admin_notes": game_account.admin_notes,
            "processed_by": game_account.processed_by.full_name if game_account.processed_by else None,
            "processed_at": game_account.processed_at,
            "created_at": game_account.requested_at,
            "updated_at": game_account.updated_at,
        }

        return Response({
            "message": "Purchase request submitted successfully. The account is now under review.",
            "pointsinout": transaction_data
        }, status=status.HTTP_200_OK)

    except Exception:
        logger.exception("Error purchasing game account")
        return Response(
            {"message": "Unable to process purchase"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_game_account(request):
    """
    Delete a game account listing.
    User can only delete their own listings that are not sold yet.
    Refunds the deposit if account is deleted before being sold.
    
    Query params:
        - product_id: ID of the game account to delete
    
    Returns:
        - message: Success/error message
    """
    try:
        user = request.user
        
        # Get product_id from query parameters
        product_id = request.GET.get('product_id')
        
        if not product_id:
            return Response({
                "message": "product_id is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the game account
        try:
            game_account = GameAccount.objects.select_related('seller').get(id=product_id)
        except GameAccount.DoesNotExist:
            return Response({
                "message": "Game account not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({
                "message": "Invalid product_id format"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the user is the seller
        if game_account.seller != user:
            return Response({
                "message": "You are not authorized to delete this listing"
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if the account is already sold
        if game_account.status == GameAccount.Status.SOLD:
            return Response({
                "message": "Cannot delete a sold account"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use atomic transaction to delete account and refund deposit
        with db_transaction.atomic():
            # Refund the listing deposit to user's wallet
            user.wallet_balance += LISTING_DEPOSIT
            user.save(update_fields=['wallet_balance'])
            
            # Delete the game account (screenshots will be deleted via CASCADE)
            game_account.delete()
        
        # Notify seller
        try:
            from notification.models import Notification
            account_label = f"{game_account.get_account_type_display()} Account"
            msg = f"You have removed {account_label} from listing. +{int(LISTING_DEPOSIT)} refunded."
            Notification.objects.create(user=user, notification_type='store', message=msg)
        except Exception:
            pass

        return Response({
            "message": "Listing deleted successfully."
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.exception("Error deleting game account listing")
        return Response({
            "message": f"Unable to delete listing: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

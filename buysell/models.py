from django.db import models
from django.core.validators import MinValueValidator, MaxLengthValidator
from user.models import CustomUser


class GameAccount(models.Model):
    """Model for users to list their game accounts for sale"""
    
    class AccountType(models.TextChoices):
        FREE_FIRE = 'free_fire', 'Free Fire'
        MLBB = 'mlbb', 'Mobile Legends: Bang Bang'
        EFOOTBALL = 'efootball', 'eFootball'
        PUBG = 'pubg', 'PUBG Mobile'
        OTHERS = 'others', 'Others'
    
    class LoginMethod(models.TextChoices):
        FACEBOOK = 'fb', 'Facebook'
        GMAIL = 'gmail', 'Gmail'
    
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending Review'
        REVIEWING = 'reviewing', 'Reviewing'
        NOT_SOLD = 'not_sold', 'Not Sold'
        SOLD = 'sold', 'Sold'
        REJECTED = 'rejected', 'Rejected'
    
    # Seller Information
    seller = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='game_accounts_for_sale'
    )
    seller_contact_number = models.CharField(max_length=15)
    
    # Game Account Details
    account_type = models.CharField(
        max_length=20,
        choices=AccountType.choices,
        default=AccountType.FREE_FIRE
    )
    description = models.TextField(
        help_text='Detailed description of the game account (level, skins, items, etc.)'
    )
    login_method = models.CharField(
        max_length=10,
        choices=LoginMethod.choices
    )
    login_email_phone = models.CharField(
        max_length=255,
        help_text='Email or phone number used to login to the game account',
        blank=True,
        null=True,
    )
    login_password = models.CharField(
        max_length=255,
        help_text='Password for the game account',
        blank=True,
        null=True,
    )
    
    # Pricing
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text='Price in your local currency'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Buyer Information (when sold)
    buyer = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='purchased_game_accounts'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sold_at = models.DateTimeField(null=True, blank=True)
    
    # Buyer request timestamp
    requested_at = models.DateTimeField(null=True, blank=True, help_text='When the buyer submitted the purchase request')
    
    # Admin processing
    admin_notes = models.TextField(blank=True, null=True)
    processed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_game_accounts'
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Game Account'
        verbose_name_plural = 'Game Accounts'
    
    def __str__(self):
        return f"{self.get_account_type_display()} - {self.seller.email} - ₹{self.price}"
    
    @property
    def screenshot_count(self):
        """Return the number of screenshots uploaded"""
        return self.screenshots.count()
    
    @property
    def is_available(self):
        """Check if the account is available for purchase"""
        return self.status == self.Status.NOT_SOLD


class GameAccountScreenshot(models.Model):
    """Model to store screenshots for game accounts (max 6 per account)"""
    
    game_account = models.ForeignKey(
        GameAccount,
        on_delete=models.CASCADE,
        related_name='screenshots'
    )
    image = models.ImageField(
        upload_to='game_accounts/screenshots/%Y/%m/%d/',
        help_text='Screenshot of the game account'
    )
    order = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text='Display order (1-6)'
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'uploaded_at']
        verbose_name = 'Screenshot'
        verbose_name_plural = 'Screenshots'
        unique_together = [['game_account', 'order']]
    
    def __str__(self):
        return f"Screenshot {self.order} for {self.game_account}"
    
    def save(self, *args, **kwargs):
        # Validate max 6 screenshots per account
        if not self.pk:  # Only on creation
            existing_count = GameAccountScreenshot.objects.filter(
                game_account=self.game_account
            ).count()
            if existing_count >= 6:
                raise ValueError('Maximum 6 screenshots allowed per game account')
        super().save(*args, **kwargs)

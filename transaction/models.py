import uuid
from django.db import models
from user.models import CustomUser


class Transaction(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )
    
    TYPE_CHOICES = (
        ('pointsin', 'Credit'),
        ('pointsout', 'Withdraw'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='transactions')
    amount = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    transaction_image = models.ImageField(upload_to='transaction_images/', blank=True, null=True)
    transaction_code = models.CharField(max_length=100, blank=True, null=True)
    
    admin_notes = models.TextField(blank=True, null=True)
    processed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_transactions')
    processed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['type', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} - {self.type} - {self.amount} points - {self.status}"


class DynamicTransaction(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('rejected', 'Rejected'),
    )
    
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='dynamic_transactions'
    )
    amount = models.IntegerField()
    
    transaction_uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True
    )
    
    esewa_ref_id = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    
    admin_notes = models.TextField(blank=True, null=True)
    processed_by = models.CharField(
        max_length=50,
        default='system',
        editable=False
    )
    processed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Dynamic Transaction'
        verbose_name_plural = 'Dynamic Transactions'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['transaction_uuid']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.full_name} - {self.amount} - {self.status}"


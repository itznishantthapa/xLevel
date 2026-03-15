from django.db import models
from user.models import CustomUser
from challenge.models import Challenge


# Create your models here.

class Report(models.Model):
    REPORT_TYPE_CHOICES = (
        ('game_issue', 'Game Issue'),
        ('refund_agreement', 'Refund Agreement'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
        ('rejected', 'Rejected'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='reports')
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='reports')
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    description = models.TextField()
    evidence_1 = models.ImageField(upload_to='report_evidence/', null=True, blank=True)
    evidence_2 = models.ImageField(upload_to='report_evidence/', null=True, blank=True)
    evidence_3 = models.ImageField(upload_to='report_evidence/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(null=True, blank=True)
    reported_on = models.DateTimeField(auto_now_add=True)
    resolved_on = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-reported_on']
        indexes = [
            models.Index(fields=['-reported_on'], name='report_reported_on_idx'),
            models.Index(fields=['status', '-reported_on'], name='report_status_date_idx'),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.get_report_type_display()} - {self.status}"

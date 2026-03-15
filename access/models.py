from django.db import models


class AccessCode(models.Model):
    code = models.CharField(max_length=20, unique=True)   # the actual access code
    max_usage = models.PositiveIntegerField(default=0)    # how many times it can be used
    used_count = models.PositiveIntegerField(default=0)   # how many times already used
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)  # optional expiry time
    is_active = models.BooleanField(default=True)  # quick toggle

    def __str__(self):
        return f"{self.code} ({self.used_count}/{self.max_usage})"

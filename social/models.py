from django.db import models

class Social(models.Model):
    NAME_CHOICES = (
        ('messenger', 'Messenger'),
        ('instagram', 'Instagram'),
        ('whatsapp', 'WhatsApp')
    )
    name = models.CharField(max_length=20, choices=NAME_CHOICES)
    url = models.CharField(max_length=500)
    web_url = models.CharField(max_length=500)

    def __str__(self):
        return self.name
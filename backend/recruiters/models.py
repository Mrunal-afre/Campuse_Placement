from django.db import models
from users.models import CustomUser


class RecruiterProfile(models.Model):

    INDUSTRY_CHOICES = [
        ('it',          'Information Technology'),
        ('finance',     'Finance & Banking'),
        ('core',        'Core Engineering'),
        ('consulting',  'Consulting'),
        ('ecommerce',   'E-Commerce'),
        ('healthcare',  'Healthcare'),
        ('education',   'Education'),
        ('other',       'Other'),
    ]

    COMPANY_SIZE_CHOICES = [
        ('startup',   'Startup (1–50)'),
        ('small',     'Small (51–200)'),
        ('medium',    'Medium (201–1000)'),
        ('large',     'Large (1001–5000)'),
        ('mnc',       'MNC (5000+)'),
    ]

    # One recruiter user = one company profile
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='recruiter_profile'
    )

    company_name        = models.CharField(max_length=200, blank=True)
    company_website     = models.URLField(blank=True)
    industry            = models.CharField(max_length=30, choices=INDUSTRY_CHOICES, blank=True)
    company_size        = models.CharField(max_length=20, choices=COMPANY_SIZE_CHOICES, blank=True)
    designation         = models.CharField(max_length=100, blank=True)
    phone               = models.CharField(max_length=15, blank=True)
    company_description = models.TextField(blank=True)
    company_logo        = models.ImageField(upload_to='company_logos/', null=True, blank=True)
    city                = models.CharField(max_length=100, blank=True)
    state               = models.CharField(max_length=100, blank=True)
    updated_at          = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company_name} — {self.user.full_name}"
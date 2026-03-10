from django.db import models
from users.models import CustomUser


class StudentProfile(models.Model):

    GENDER_CHOICES = [
        ('male',   'Male'),
        ('female', 'Female'),
        ('other',  'Other'),
    ]

    BRANCH_CHOICES = [
        ('cs',      'Computer Science'),
        ('it',      'Information Technology'),
        ('entc',    'Electronics & Telecom'),
        ('mech',    'Mechanical'),
        ('civil',   'Civil'),
        ('electrical', 'Electrical'),
        ('other',   'Other'),
    ]

    # One-to-One: every student user gets exactly one profile
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,   # if user deleted, profile deleted too
        related_name='student_profile'
    )

    phone          = models.CharField(max_length=15, blank=True)
    date_of_birth  = models.DateField(null=True, blank=True)
    gender         = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    branch         = models.CharField(max_length=20, choices=BRANCH_CHOICES, blank=True)
    year_of_passing = models.IntegerField(null=True, blank=True)
    cgpa           = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    skills         = models.TextField(blank=True)   # stored as comma-separated: "Python,React,SQL"
    about          = models.TextField(blank=True)
    linkedin_url   = models.URLField(blank=True)
    github_url     = models.URLField(blank=True)

    # Files are saved in media/profile_photos/ and media/resumes/
    profile_photo  = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    resume         = models.FileField(upload_to='resumes/', null=True, blank=True)

    updated_at     = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile of {self.user.full_name}"
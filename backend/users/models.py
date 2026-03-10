from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

# This class controls how users are CREATED
class CustomUserManager(BaseUserManager):

    def create_user(self, email, password, full_name, role):
        if not email:
            raise ValueError("Email is required")
        
        # Normalize means making email lowercase
        email = self.normalize_email(email)
        
        # Create the user object (not saved yet)
        user = self.model(
            email=email,
            full_name=full_name,
            role=role
        )
        
        # This encrypts the password automatically — NEVER store plain text!
        user.set_password(password)
        
        # Now save to database
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, full_name, role='admin'):
        user = self.create_user(email, password, full_name, role)
        user.is_staff = True
        user.is_superuser = True
        user.is_approved = True
        user.save(using=self._db)
        return user


# This is our actual User table in the database
class CustomUser(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = [
        ('student', 'Student'),
        ('recruiter', 'Recruiter'),
        ('admin', 'Admin'),
    ]

    email       = models.EmailField(unique=True)       # login email, must be unique
    full_name   = models.CharField(max_length=100)
    role        = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_approved = models.BooleanField(default=False)   # admin approves new accounts
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    # Tell Django to use email instead of username for login
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'role']

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.full_name} ({self.role})"
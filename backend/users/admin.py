from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    
    # What columns show in the list view
    list_display = ['email', 'full_name', 'role', 'is_approved', 'is_active', 'created_at']
    list_filter  = ['role', 'is_approved']
    
    # Make is_approved clickable directly from the list (super convenient!)
    list_editable = ['is_approved']
    
    search_fields = ['email', 'full_name']
    ordering      = ['-created_at']

    # Fields shown when you EDIT a user
    fieldsets = (
        ('Login Info',    {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'role')}),
        ('Permissions',   {'fields': ('is_approved', 'is_active', 'is_staff', 'is_superuser')}),
    )

    # Fields shown when you ADD a new user from admin
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'password1', 'password2', 'is_approved'),
        }),
    )
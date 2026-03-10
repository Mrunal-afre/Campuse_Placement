from django.contrib import admin
from .models import RecruiterProfile

@admin.register(RecruiterProfile)
class RecruiterProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'company_name', 'industry', 'company_size', 'city', 'updated_at']
    list_filter   = ['industry', 'company_size']
    search_fields = ['company_name', 'user__full_name', 'user__email']
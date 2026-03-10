from django.contrib import admin
from .models import JobPosting

@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display  = ['title', 'recruiter', 'job_type', 'package_lpa',
                     'min_cgpa', 'vacancy_count', 'is_active', 'created_at']
    list_filter   = ['job_type', 'is_active']
    list_editable = ['is_active']
    search_fields = ['title', 'recruiter__full_name',
                     'recruiter__recruiter_profile__company_name']
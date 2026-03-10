from django.contrib import admin
from .models import StudentProfile

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'branch', 'cgpa', 'year_of_passing', 'updated_at']
    list_filter   = ['branch', 'gender']
    search_fields = ['user__full_name', 'user__email', 'skills']
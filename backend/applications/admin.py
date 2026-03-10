from django.contrib import admin
from .models import Application

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display  = [
        'student', 'job', 'status', 'applied_at', 'updated_at'
    ]
    list_filter   = ['status']
    list_editable = ['status']
    search_fields = [
        'student__full_name', 'student__email',
        'job__title'
    ]
    readonly_fields = ['applied_at', 'updated_at']
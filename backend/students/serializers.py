from rest_framework import serializers
from .models import StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):

    # Read-only fields pulled from the linked User
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email     = serializers.CharField(source='user.email',     read_only=True)

    class Meta:
        model  = StudentProfile
        fields = [
            'id', 'full_name', 'email',
            'phone', 'date_of_birth', 'gender',
            'branch', 'year_of_passing', 'cgpa',
            'skills', 'about', 'linkedin_url', 'github_url',
            'profile_photo', 'resume', 'updated_at'
        ]
        read_only_fields = ['updated_at']

    def validate_cgpa(self, value):
        # CGPA must be between 0 and 10
        if value is not None and (value < 0 or value > 10):
            raise serializers.ValidationError("CGPA must be between 0 and 10.")
        return value

    def validate_phone(self, value):
        # Phone must be 10 digits if provided
        if value and not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        if value and len(value) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return value
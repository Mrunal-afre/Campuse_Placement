from rest_framework import serializers
from .models import StudentProfile



class StudentProfileSerializer(serializers.ModelSerializer):

    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email     = serializers.CharField(source='user.email',     read_only=True)
    user_id   = serializers.IntegerField(source='user.id',     read_only=True)

    # Build absolute URL so frontend can display photo directly
    profile_photo_url = serializers.SerializerMethodField()
    resume_url        = serializers.SerializerMethodField()

    class Meta:
        model  = StudentProfile
        fields = [
            'id', 'user_id', 'full_name', 'email',
            'phone', 'date_of_birth', 'gender',
            'branch', 'year_of_passing', 'cgpa',
            'skills', 'about', 'linkedin_url', 'github_url',
            'profile_photo', 'profile_photo_url',
            'resume', 'resume_url',
            'updated_at'
        ]
        read_only_fields = ['updated_at']

    def get_profile_photo_url(self, obj):
        request = self.context.get('request')
        if obj.profile_photo and request:
            return request.build_absolute_uri(obj.profile_photo.url)
        return None

    def get_resume_url(self, obj):
        request = self.context.get('request')
        if obj.resume and request:
            return request.build_absolute_uri(obj.resume.url)
        return None

    def validate_cgpa(self, value):
        if value is not None and (value < 0 or value > 10):
            raise serializers.ValidationError("CGPA must be between 0 and 10.")
        return value

    def validate_phone(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        if value and len(value) != 10:
            raise serializers.ValidationError("Phone number must be exactly 10 digits.")
        return value
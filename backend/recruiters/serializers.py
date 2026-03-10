from rest_framework import serializers
from .models import RecruiterProfile


class RecruiterProfileSerializer(serializers.ModelSerializer):

    # Pull these from the linked User — read only
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    email     = serializers.CharField(source='user.email',     read_only=True)

    class Meta:
        model  = RecruiterProfile
        fields = [
            'id', 'full_name', 'email',
            'company_name', 'company_website', 'industry',
            'company_size', 'designation', 'phone',
            'company_description', 'company_logo',
            'city', 'state', 'updated_at'
        ]
        read_only_fields = ['updated_at']

    def validate_phone(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("Phone must contain only digits.")
        if value and len(value) != 10:
            raise serializers.ValidationError("Phone must be exactly 10 digits.")
        return value

    def validate_company_name(self, value):
        if value and len(value) < 2:
            raise serializers.ValidationError("Company name is too short.")
        return value
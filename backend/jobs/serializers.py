from rest_framework import serializers
from .models import JobPosting
from datetime import date


class JobPostingSerializer(serializers.ModelSerializer):

    # Extra read-only fields from the recruiter's company profile
    company_name = serializers.SerializerMethodField()
    company_logo = serializers.SerializerMethodField()
    recruiter_name = serializers.CharField(source='recruiter.full_name', read_only=True)

    class Meta:
        model  = JobPosting
        fields = [
            'id', 'recruiter', 'recruiter_name', 'company_name', 'company_logo',
            'title', 'description', 'responsibilities', 'requirements',
            'job_type', 'location', 'package_lpa',
            'min_cgpa', 'allowed_branches', 'vacancy_count',
            'last_date_to_apply', 'is_active', 'created_at'
        ]
        read_only_fields = ['recruiter', 'created_at']

    def get_company_name(self, obj):
        try:
            return obj.recruiter.recruiter_profile.company_name
        except Exception:
            return ''

    def get_company_logo(self, obj):
        try:
            logo = obj.recruiter.recruiter_profile.company_logo
            if logo:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(logo.url)
            return None
        except Exception:
            return None

    def validate_min_cgpa(self, value):
        if value < 0 or value > 10:
            raise serializers.ValidationError("Min CGPA must be between 0 and 10.")
        return value

    def validate_vacancy_count(self, value):
        if value < 1:
            raise serializers.ValidationError("Vacancy count must be at least 1.")
        return value

    def validate_last_date_to_apply(self, value):
        if value and value < date.today():
            raise serializers.ValidationError("Last date cannot be in the past.")
        return value

    def validate_package_lpa(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError("Package must be greater than 0.")
        return value
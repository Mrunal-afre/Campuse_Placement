from rest_framework import serializers
from .models import Application
from jobs.models import JobPosting


class ApplySerializer(serializers.ModelSerializer):
    """Used when a student submits an application"""

    class Meta:
        model  = Application
        fields = ['id', 'job', 'cover_letter', 'status', 'applied_at']
        read_only_fields = ['status', 'applied_at']


class StudentApplicationSerializer(serializers.ModelSerializer):
    """
    What the STUDENT sees when tracking their applications.
    Shows job and company details.
    """
    job_title    = serializers.CharField(source='job.title',    read_only=True)
    job_type     = serializers.CharField(source='job.job_type', read_only=True)
    location     = serializers.CharField(source='job.location', read_only=True)
    package_lpa  = serializers.DecimalField(
        source='job.package_lpa', max_digits=5,
        decimal_places=2, read_only=True
    )
    company_name = serializers.SerializerMethodField()
    company_logo = serializers.SerializerMethodField()

    class Meta:
        model  = Application
        fields = [
            'id', 'job', 'job_title', 'job_type', 'location',
            'package_lpa', 'company_name', 'company_logo',
            'status', 'cover_letter', 'applied_at', 'updated_at'
            # Note: recruiter_notes is NOT included — student can't see it
        ]
        read_only_fields = ['status', 'applied_at', 'updated_at']

    def get_company_name(self, obj):
        try:
            return obj.job.recruiter.recruiter_profile.company_name
        except Exception:
            return ''

    def get_company_logo(self, obj):
        try:
            logo    = obj.job.recruiter.recruiter_profile.company_logo
            request = self.context.get('request')
            if logo and request:
                return request.build_absolute_uri(logo.url)
            return None
        except Exception:
            return None


class RecruiterApplicationSerializer(serializers.ModelSerializer):
    """
    What the RECRUITER sees when viewing applicants.
    Shows student profile details.
    """
    student_name  = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.CharField(source='student.email',     read_only=True)
    student_photo = serializers.SerializerMethodField()
    branch        = serializers.SerializerMethodField()
    cgpa          = serializers.SerializerMethodField()
    skills        = serializers.SerializerMethodField()
    resume        = serializers.SerializerMethodField()

    class Meta:
        model  = Application
        fields = [
            'id', 'student', 'student_name', 'student_email', 'student_photo',
            'branch', 'cgpa', 'skills', 'resume',
            'status', 'cover_letter', 'recruiter_notes',
            'applied_at', 'updated_at'
        ]
        read_only_fields = ['student', 'applied_at', 'updated_at']

    def get_student_photo(self, obj):
        try:
            photo   = obj.student.student_profile.profile_photo
            request = self.context.get('request')
            if photo and request:
                return request.build_absolute_uri(photo.url)
            return None
        except Exception:
            return None

    def get_branch(self, obj):
        try:
            return obj.student.student_profile.branch
        except Exception:
            return ''

    def get_cgpa(self, obj):
        try:
            return str(obj.student.student_profile.cgpa)
        except Exception:
            return ''

    def get_skills(self, obj):
        try:
            return obj.student.student_profile.skills
        except Exception:
            return ''

    def get_resume(self, obj):
        try:
            resume  = obj.student.student_profile.resume
            request = self.context.get('request')
            if resume and request:
                return request.build_absolute_uri(resume.url)
            return None
        except Exception:
            return None
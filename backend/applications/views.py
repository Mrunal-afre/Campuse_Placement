from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Application
from .serializers import (
    ApplySerializer,
    StudentApplicationSerializer,
    RecruiterApplicationSerializer,
)
from jobs.models import JobPosting


# ─────────────────────────────────────────────
#  STUDENT VIEWS
# ─────────────────────────────────────────────

class ApplyToJobView(APIView):
    """
    POST /api/applications/apply/
    Student applies to a job.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can apply to jobs.'},
                status=status.HTTP_403_FORBIDDEN
            )

        job_id = request.data.get('job')

        # Check the job exists and is active
        try:
            job = JobPosting.objects.get(id=job_id, is_active=True)
        except JobPosting.DoesNotExist:
            return Response(
                {'error': 'Job not found or no longer accepting applications.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check student hasn't already applied
        if Application.objects.filter(student=request.user, job=job).exists():
            return Response(
                {'error': 'You have already applied to this job.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check eligibility
        try:
            student_profile = request.user.student_profile
            if not job.is_eligible(student_profile):
                return Response(
                    {'error': 'You do not meet the eligibility criteria for this job.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception:
            pass  # No profile yet — allow to apply

        serializer = ApplySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=request.user)
            return Response({
                'message': 'Application submitted successfully!',
                'application': serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyApplicationsView(APIView):
    """
    GET /api/applications/my-applications/
    Student views all their own applications.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can view their applications.'},
                status=status.HTTP_403_FORBIDDEN
            )

        apps = Application.objects.filter(
            student=request.user
        ).select_related('job', 'job__recruiter', 'job__recruiter__recruiter_profile')

        serializer = StudentApplicationSerializer(
            apps, many=True, context={'request': request}
        )
        return Response({
            'count': apps.count(),
            'applications': serializer.data
        })


class WithdrawApplicationView(APIView):
    """
    DELETE /api/applications/<id>/withdraw/
    Student withdraws their own application.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, application_id):
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can withdraw applications.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            app = Application.objects.get(
                id=application_id,
                student=request.user
            )
        except Application.DoesNotExist:
            return Response(
                {'error': 'Application not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Can only withdraw if still pending — not if already selected/rejected
        if app.status in ['selected', 'rejected']:
            return Response(
                {'error': f'Cannot withdraw — application is already {app.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        app.delete()
        return Response({'message': 'Application withdrawn successfully.'})


class CheckApplicationView(APIView):
    """
    GET /api/applications/check/<job_id>/
    Student checks if they already applied to a specific job.
    Used to show Apply/Applied button correctly on the frontend.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        if request.user.role != 'student':
            return Response({'applied': False})

        applied = Application.objects.filter(
            student=request.user,
            job_id=job_id
        ).exists()

        application = None
        if applied:
            app = Application.objects.get(student=request.user, job_id=job_id)
            application = {
                'id': app.id,
                'status': app.status,
                'applied_at': app.applied_at
            }

        return Response({
            'applied': applied,
            'application': application
        })


# ─────────────────────────────────────────────
#  RECRUITER VIEWS
# ─────────────────────────────────────────────

class JobApplicantsView(APIView):
    """
    GET /api/applications/job/<job_id>/applicants/
    Recruiter views all applicants for one of their jobs.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        if request.user.role != 'recruiter':
            return Response(
                {'error': 'Only recruiters can view applicants.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Make sure the job belongs to this recruiter
        try:
            job = JobPosting.objects.get(id=job_id, recruiter=request.user)
        except JobPosting.DoesNotExist:
            return Response(
                {'error': 'Job not found or not yours.'},
                status=status.HTTP_404_NOT_FOUND
            )

        apps = Application.objects.filter(job=job).select_related(
            'student', 'student__student_profile'
        )

        # Optional filter by status
        status_filter = request.query_params.get('status')
        if status_filter:
            apps = apps.filter(status=status_filter)

        serializer = RecruiterApplicationSerializer(
            apps, many=True, context={'request': request}
        )
        return Response({
            'job_title': job.title,
            'count': apps.count(),
            'applicants': serializer.data
        })


class UpdateApplicationStatusView(APIView):
    """
    PUT /api/applications/<id>/update-status/
    Recruiter updates the status of an application.
    e.g. applied → shortlisted → selected / rejected
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, application_id):
        if request.user.role != 'recruiter':
            return Response(
                {'error': 'Only recruiters can update application status.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            app = Application.objects.select_related('job').get(
                id=application_id,
                job__recruiter=request.user   # ensure this recruiter owns the job
            )
        except Application.DoesNotExist:
            return Response(
                {'error': 'Application not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status     = request.data.get('status')
        recruiter_notes = request.data.get('recruiter_notes', app.recruiter_notes)

        valid_statuses = ['applied', 'under_review', 'shortlisted', 'selected', 'rejected']
        if new_status and new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Choose from: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_status:
            app.status = new_status
        app.recruiter_notes = recruiter_notes
        app.save()

        serializer = RecruiterApplicationSerializer(
            app, context={'request': request}
        )
        return Response({
            'message': f'Application status updated to "{app.status}".',
            'application': serializer.data
        })

class BulkUpdateStatusView(APIView):
    """
    POST /api/applications/bulk-update-status/
    Recruiter updates status of MULTIPLE applications at once.
    e.g. shortlist 5 students in one click
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != 'recruiter':
            return Response(
                {'error': 'Only recruiters can update application status.'},
                status=status.HTTP_403_FORBIDDEN
            )

        application_ids = request.data.get('application_ids', [])
        new_status      = request.data.get('status')

        if not application_ids or not new_status:
            return Response(
                {'error': 'application_ids and status are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = ['applied', 'under_review', 'shortlisted', 'selected', 'rejected']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Choose from: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only update applications belonging to this recruiter's jobs
        updated = Application.objects.filter(
            id__in=application_ids,
            job__recruiter=request.user
        ).update(status=new_status)

        return Response({
            'message': f'{updated} application(s) updated to "{new_status}".',
            'updated_count': updated
        })
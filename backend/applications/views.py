from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
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

class StudentDashboardStatsView(APIView):
    """
    GET /api/applications/student-stats/
    Student sees summary stats of all their applications.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'Students only.'},
                status=status.HTTP_403_FORBIDDEN
            )

        apps = Application.objects.filter(student=request.user)

        # Count per status
        status_counts = apps.values('status').annotate(
            count=Count('id')
        )

        counts = {
            'applied':      0,
            'under_review': 0,
            'shortlisted':  0,
            'selected':     0,
            'rejected':     0,
            'withdrawn':    0,
        }
        for item in status_counts:
            counts[item['status']] = item['count']

        return Response({
            'total_applied':   apps.count(),
            'shortlisted':     counts['shortlisted'],
            'selected':        counts['selected'],
            'rejected':        counts['rejected'],
            'under_review':    counts['under_review'],
            'pending':         counts['applied'] + counts['under_review'],
            'status_breakdown': counts,
            # Recent 5 applications with full detail
            'recent_applications': StudentApplicationSerializer(
                apps.order_by('-applied_at')[:5],
                many=True,
                context={'request': request}
            ).data
        })


class RecruiterDashboardStatsView(APIView):
    """
    GET /api/applications/recruiter-stats/
    Recruiter sees stats across ALL their job postings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'recruiter':
            return Response(
                {'error': 'Recruiters only.'},
                status=status.HTTP_403_FORBIDDEN
            )

        from jobs.models import JobPosting

        # All jobs by this recruiter
        my_jobs = JobPosting.objects.filter(recruiter=request.user)

        # All applications across all their jobs
        all_apps = Application.objects.filter(
            job__recruiter=request.user
        )

        # Per-status counts
        status_counts = all_apps.values('status').annotate(count=Count('id'))
        counts = {
            'applied': 0, 'under_review': 0, 'shortlisted': 0,
            'selected': 0, 'rejected': 0,
        }
        for item in status_counts:
            if item['status'] in counts:
                counts[item['status']] = item['count']

        # Per-job breakdown
        job_breakdown = []
        for job in my_jobs:
            job_apps = all_apps.filter(job=job)
            job_breakdown.append({
                'job_id':      job.id,
                'job_title':   job.title,
                'is_active':   job.is_active,
                'total':       job_apps.count(),
                'shortlisted': job_apps.filter(status='shortlisted').count(),
                'selected':    job_apps.filter(status='selected').count(),
                'rejected':    job_apps.filter(status='rejected').count(),
            })

        return Response({
            'total_jobs':       my_jobs.count(),
            'active_jobs':      my_jobs.filter(is_active=True).count(),
            'total_applicants': all_apps.count(),
            'shortlisted':      counts['shortlisted'],
            'selected':         counts['selected'],
            'status_breakdown': counts,
            'job_breakdown':    job_breakdown,
        })


class ApplicationTimelineView(APIView):
    """
    GET /api/applications/<id>/timeline/
    Full timeline of a single application — student and recruiter use this.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, application_id):
        try:
            # Student can only see their own; recruiter can see their job's apps
            if request.user.role == 'student':
                app = Application.objects.get(
                    id=application_id,
                    student=request.user
                )
            elif request.user.role == 'recruiter':
                app = Application.objects.get(
                    id=application_id,
                    job__recruiter=request.user
                )
            else:
                app = Application.objects.get(id=application_id)

        except Application.DoesNotExist:
            return Response(
                {'error': 'Application not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Build a visual pipeline — all steps in order
        all_steps = [
            'applied',
            'under_review',
            'shortlisted',
            'selected',
        ]

        # Figure out which step we are currently on
        current_index = 0
        if app.status in all_steps:
            current_index = all_steps.index(app.status)
        elif app.status == 'rejected':
            current_index = -1   # special: rejected
        elif app.status == 'withdrawn':
            current_index = -2   # special: withdrawn

        pipeline = []
        for i, step in enumerate(all_steps):
            if current_index == -1 or current_index == -2:
                # Rejected or withdrawn — only first step is done
                pipeline.append({
                    'step':   step,
                    'state':  'completed' if i == 0 else 'pending',
                    'label':  step.replace('_', ' ').title(),
                })
            elif i < current_index:
                pipeline.append({
                    'step':  step,
                    'state': 'completed',
                    'label': step.replace('_', ' ').title(),
                })
            elif i == current_index:
                pipeline.append({
                    'step':  step,
                    'state': 'current',
                    'label': step.replace('_', ' ').title(),
                })
            else:
                pipeline.append({
                    'step':  step,
                    'state': 'pending',
                    'label': step.replace('_', ' ').title(),
                })

        return Response({
            'application_id': app.id,
            'job_title':      app.job.title,
            'company_name':   app.job.recruiter.recruiter_profile.company_name
                              if hasattr(app.job.recruiter, 'recruiter_profile')
                              else '',
            'current_status': app.status,
            'applied_at':     app.applied_at,
            'updated_at':     app.updated_at,
            'cover_letter':   app.cover_letter,
            'pipeline':       pipeline,
        })
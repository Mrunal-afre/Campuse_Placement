from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from users.models import CustomUser
from students.models import StudentProfile
from recruiters.models import RecruiterProfile
from jobs.models import JobPosting
from applications.models import Application


def is_admin(user):
    """Helper — check if user is admin"""
    return user.is_authenticated and user.role == 'admin'


# ─────────────────────────────────────────────
class PlatformStatsView(APIView):
    """
    GET /api/admin/stats/
    Overall platform statistics for admin overview.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # User counts
        total_students   = CustomUser.objects.filter(role='student').count()
        total_recruiters = CustomUser.objects.filter(role='recruiter').count()
        pending_approval = CustomUser.objects.filter(
            is_approved=False,
            is_active=True,
            role__in=['student', 'recruiter']
        ).count()

        # Job counts
        total_jobs  = JobPosting.objects.count()
        active_jobs = JobPosting.objects.filter(is_active=True).count()

        # Application counts
        total_apps   = Application.objects.count()
        selected     = Application.objects.filter(status='selected').count()
        shortlisted  = Application.objects.filter(status='shortlisted').count()

        # Recent signups (last 5)
        recent_users = CustomUser.objects.filter(
            role__in=['student', 'recruiter']
        ).order_by('-created_at')[:5].values(
            'id', 'full_name', 'email', 'role',
            'is_approved', 'created_at'
        )

        return Response({
            'users': {
                'total_students':   total_students,
                'total_recruiters': total_recruiters,
                'pending_approval': pending_approval,
                'total':            total_students + total_recruiters,
            },
            'jobs': {
                'total':  total_jobs,
                'active': active_jobs,
            },
            'applications': {
                'total':       total_apps,
                'selected':    selected,
                'shortlisted': shortlisted,
            },
            'recent_signups': list(recent_users),
        })


# ─────────────────────────────────────────────
class ManageUsersView(APIView):
    """
    GET  /api/admin/users/          → list all users with filters
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        users = CustomUser.objects.filter(
            role__in=['student', 'recruiter']
        ).order_by('-created_at')

        # Filters
        role        = request.query_params.get('role')
        is_approved = request.query_params.get('is_approved')
        search      = request.query_params.get('search')

        if role:
            users = users.filter(role=role)
        if is_approved is not None:
            users = users.filter(
                is_approved=(is_approved.lower() == 'true')
            )
        if search:
            users = users.filter(full_name__icontains=search)

        user_list = []
        for u in users:
            entry = {
                'id':          u.id,
                'full_name':   u.full_name,
                'email':       u.email,
                'role':        u.role,
                'is_approved': u.is_approved,
                'is_active':   u.is_active,
                'created_at':  u.created_at,
            }
            # Add profile details
            if u.role == 'student':
                try:
                    sp = u.student_profile
                    entry['branch'] = sp.branch
                    entry['cgpa']   = str(sp.cgpa) if sp.cgpa else ''
                except Exception:
                    entry['branch'] = ''
                    entry['cgpa']   = ''
            elif u.role == 'recruiter':
                try:
                    rp = u.recruiter_profile
                    entry['company_name'] = rp.company_name
                except Exception:
                    entry['company_name'] = ''

            user_list.append(entry)

        return Response({
            'count': len(user_list),
            'users': user_list
        })


# ─────────────────────────────────────────────
class ManageUserDetailView(APIView):
    """
    PUT /api/admin/users/<id>/
    Admin approves, rejects or deactivates a user.
    """
    permission_classes = [IsAuthenticated]

    def put(self, request, user_id):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Prevent admin from modifying themselves
        if user.id == request.user.id:
            return Response(
                {'error': 'You cannot modify your own account here.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_approved = request.data.get('is_approved')
        is_active   = request.data.get('is_active')

        if is_approved is not None:
            user.is_approved = bool(is_approved)
        if is_active is not None:
            user.is_active = bool(is_active)

        user.save()

        action = 'approved' if user.is_approved else 'unapproved'
        if is_active is not None and not user.is_active:
            action = 'deactivated'

        return Response({
            'message':     f'User {action} successfully.',
            'id':          user.id,
            'full_name':   user.full_name,
            'is_approved': user.is_approved,
            'is_active':   user.is_active,
        })


# ─────────────────────────────────────────────
class ManageJobsView(APIView):
    """
    GET    /api/admin/jobs/         → list all jobs
    DELETE /api/admin/jobs/<id>/    → admin deletes any job
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        jobs = JobPosting.objects.select_related(
            'recruiter',
            'recruiter__recruiter_profile'
        ).order_by('-created_at')

        job_list = []
        for j in jobs:
            try:
                company = j.recruiter.recruiter_profile.company_name
            except Exception:
                company = ''

            job_list.append({
                'id':                  j.id,
                'title':               j.title,
                'company_name':        company,
                'recruiter_name':      j.recruiter.full_name,
                'recruiter_email':     j.recruiter.email,
                'job_type':            j.job_type,
                'location':            j.location,
                'package_lpa':         str(j.package_lpa) if j.package_lpa else '',
                'min_cgpa':            str(j.min_cgpa),
                'vacancy_count':       j.vacancy_count,
                'is_active':           j.is_active,
                'total_applications':  j.applications.count(),
                'created_at':          j.created_at,
            })

        return Response({
            'count': len(job_list),
            'jobs':  job_list
        })

    def delete(self, request, job_id=None):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not job_id:
            return Response(
                {'error': 'Job ID required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            job = JobPosting.objects.get(id=job_id)
            job.delete()
            return Response({'message': 'Job deleted by admin.'})
        except JobPosting.DoesNotExist:
            return Response(
                {'error': 'Job not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


# ─────────────────────────────────────────────
class PendingApprovalsView(APIView):
    """
    GET /api/admin/pending/
    Get only users who are waiting for approval — quick list for admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not is_admin(request.user):
            return Response(
                {'error': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )

        pending = CustomUser.objects.filter(
            is_approved=False,
            is_active=True,
            role__in=['student', 'recruiter']
        ).order_by('created_at')

        result = []
        for u in pending:
            entry = {
                'id':         u.id,
                'full_name':  u.full_name,
                'email':      u.email,
                'role':       u.role,
                'created_at': u.created_at,
            }
            if u.role == 'recruiter':
                try:
                    entry['company_name'] = \
                        u.recruiter_profile.company_name
                except Exception:
                    entry['company_name'] = ''
            result.append(entry)

        return Response({
            'count':   len(result),
            'pending': result
        })
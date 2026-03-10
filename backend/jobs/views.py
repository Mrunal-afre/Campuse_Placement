from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import JobPosting
from .serializers import JobPostingSerializer
from students.models import StudentProfile


class RecruiterJobsView(APIView):
    """
    Recruiter manages their own job postings.
    GET  — list all my jobs
    POST — create a new job
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'recruiter':
            return Response({'error': 'Only recruiters can access this.'},
                            status=status.HTTP_403_FORBIDDEN)

        jobs = JobPosting.objects.filter(recruiter=request.user)
        serializer = JobPostingSerializer(jobs, many=True,
                                          context={'request': request})
        return Response({'count': jobs.count(), 'jobs': serializer.data})

    def post(self, request):
        if request.user.role != 'recruiter':
            return Response({'error': 'Only recruiters can post jobs.'},
                            status=status.HTTP_403_FORBIDDEN)

        # Make sure recruiter has a company profile set up
        try:
            profile = request.user.recruiter_profile
            if not profile.company_name:
                return Response(
                    {'error': 'Please complete your company profile before posting jobs.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception:
            return Response(
                {'error': 'Please complete your company profile first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = JobPostingSerializer(data=request.data,
                                          context={'request': request})
        if serializer.is_valid():
            # Automatically set the recruiter to the logged-in user
            serializer.save(recruiter=request.user)
            return Response({
                'message': 'Job posted successfully!',
                'job': serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecruiterJobDetailView(APIView):
    """
    Recruiter edits or deletes a specific job.
    PUT    — update job
    DELETE — delete job
    """
    permission_classes = [IsAuthenticated]

    def get_job(self, job_id, recruiter):
        """Helper: get job only if it belongs to this recruiter"""
        try:
            return JobPosting.objects.get(id=job_id, recruiter=recruiter)
        except JobPosting.DoesNotExist:
            return None

    def put(self, request, job_id):
        if request.user.role != 'recruiter':
            return Response({'error': 'Only recruiters can edit jobs.'},
                            status=status.HTTP_403_FORBIDDEN)

        job = self.get_job(job_id, request.user)
        if not job:
            return Response({'error': 'Job not found or not yours.'},
                            status=status.HTTP_404_NOT_FOUND)

        serializer = JobPostingSerializer(job, data=request.data, partial=True,
                                          context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Job updated successfully!',
                'job': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, job_id):
        if request.user.role != 'recruiter':
            return Response({'error': 'Only recruiters can delete jobs.'},
                            status=status.HTTP_403_FORBIDDEN)

        job = self.get_job(job_id, request.user)
        if not job:
            return Response({'error': 'Job not found or not yours.'},
                            status=status.HTTP_404_NOT_FOUND)

        job.delete()
        return Response({'message': 'Job deleted successfully.'})


class StudentJobListView(APIView):
    """
    Students browse jobs they are ELIGIBLE for.
    GET — list all active jobs filtered by student's CGPA and branch
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Only students can browse jobs.'},
                            status=status.HTTP_403_FORBIDDEN)

        # Get active jobs only
        all_active_jobs = JobPosting.objects.filter(is_active=True).select_related(
            'recruiter', 'recruiter__recruiter_profile'
        )

        # Try to get the student's profile for eligibility check
        try:
            student_profile = request.user.student_profile
        except StudentProfile.DoesNotExist:
            student_profile = None

        # Filter jobs the student is eligible for
        eligible_jobs = []
        for job in all_active_jobs:
            if student_profile:
                if job.is_eligible(student_profile):
                    eligible_jobs.append(job)
            else:
                # No profile yet — show all jobs
                eligible_jobs.append(job)

        serializer = JobPostingSerializer(eligible_jobs, many=True,
                                          context={'request': request})
        return Response({
            'count': len(eligible_jobs),
            'jobs': serializer.data
        })


class JobDetailView(APIView):
    """
    Anyone logged in can view a single job's full details.
    GET /api/jobs/<job_id>/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = JobPosting.objects.select_related(
                'recruiter', 'recruiter__recruiter_profile'
            ).get(id=job_id)
            serializer = JobPostingSerializer(job, context={'request': request})
            return Response(serializer.data)
        except JobPosting.DoesNotExist:
            return Response({'error': 'Job not found.'},
                            status=status.HTTP_404_NOT_FOUND)
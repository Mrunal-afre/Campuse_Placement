from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import StudentProfile
from .serializers import StudentProfileSerializer


class StudentProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/students/profile/ — get my profile"""

        # Make sure only students can access this
        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can access this.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # get_or_create: if profile doesn't exist yet, create an empty one
        profile, created = StudentProfile.objects.get_or_create(user=request.user)
        serializer = StudentProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        """PUT /api/students/profile/ — create or update my profile"""

        if request.user.role != 'student':
            return Response(
                {'error': 'Only students can access this.'},
                status=status.HTTP_403_FORBIDDEN
            )

        profile, created = StudentProfile.objects.get_or_create(user=request.user)

        # partial=True means you can update just ONE field without sending all fields
        serializer = StudentProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully!',
                'profile': serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentPublicProfileView(APIView):
    """Anyone logged in can view a student's public profile (recruiters use this)"""
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        """GET /api/students/profile/<id>/ — view any student's profile"""
        try:
            profile = StudentProfile.objects.get(id=student_id)
            serializer = StudentProfileSerializer(profile)
            return Response(serializer.data)
        except StudentProfile.DoesNotExist:
            return Response(
                {'error': 'Student profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )


class AllStudentsView(APIView):
    """Recruiters can browse all student profiles"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/students/all/ — list all students (recruiters only)"""

        if request.user.role not in ['recruiter', 'admin']:
            return Response(
                {'error': 'Only recruiters and admins can view all students.'},
                status=status.HTTP_403_FORBIDDEN
            )

        profiles = StudentProfile.objects.select_related('user').all()

        # Optional filters from URL query params
        # Example: /api/students/all/?branch=cs&min_cgpa=7.5
        branch   = request.query_params.get('branch')
        min_cgpa = request.query_params.get('min_cgpa')
        skill    = request.query_params.get('skill')

        if branch:
            profiles = profiles.filter(branch=branch)
        if min_cgpa:
            profiles = profiles.filter(cgpa__gte=min_cgpa)
        if skill:
            profiles = profiles.filter(skills__icontains=skill)

        serializer = StudentProfileSerializer(profiles, many=True)
        return Response({
            'count': profiles.count(),
            'students': serializer.data
        })
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import RecruiterProfile
from .serializers import RecruiterProfileSerializer


class RecruiterProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """GET /api/recruiters/profile/ — get my company profile"""

        if request.user.role != 'recruiter':
            return Response(
                {'error': 'Only recruiters can access this.'},
                status=status.HTTP_403_FORBIDDEN
            )

        profile, created = RecruiterProfile.objects.get_or_create(user=request.user)
        serializer = RecruiterProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        """PUT /api/recruiters/profile/ — update my company profile"""

        if request.user.role != 'recruiter':
            return Response(
                {'error': 'Only recruiters can access this.'},
                status=status.HTTP_403_FORBIDDEN
            )

        profile, created = RecruiterProfile.objects.get_or_create(user=request.user)
        serializer = RecruiterProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Company profile updated successfully!',
                'profile': serializer.data
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecruiterPublicProfileView(APIView):
    """Students can view a recruiter's company profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request, recruiter_id):
        """GET /api/recruiters/profile/<id>/ — view any recruiter profile"""
        try:
            profile = RecruiterProfile.objects.get(id=recruiter_id)
            serializer = RecruiterProfileSerializer(profile)
            return Response(serializer.data)
        except RecruiterProfile.DoesNotExist:
            return Response(
                {'error': 'Recruiter profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
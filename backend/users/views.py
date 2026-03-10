from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, UserSerializer
from .models import CustomUser


# Helper function: generate tokens for a user
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# POST /api/auth/register/
class RegisterView(APIView):
    permission_classes = [AllowAny]  # anyone can register, no login needed

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Registration successful! Wait for admin approval.',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        # If validation failed, return the errors
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# POST /api/auth/login/
class LoginView(APIView):
    permission_classes = [AllowAny]  # anyone can try to login

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        # Check if email and password were provided
        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user exists and password is correct
        user = authenticate(request, username=email, password=password)

        if user is None:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check if admin has approved this account
        if not user.is_approved:
            return Response(
                {'error': 'Your account is pending admin approval.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Generate JWT tokens
        tokens = get_tokens_for_user(user)

        return Response({
            'message': 'Login successful!',
            'tokens': tokens,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


# GET /api/auth/me/
class MeView(APIView):
    permission_classes = [IsAuthenticated]  # must be logged in

    def get(self, request):
        # request.user is automatically set by JWT authentication
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# POST /api/auth/logout/
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()  # invalidate the token
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)
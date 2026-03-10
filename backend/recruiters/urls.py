from django.urls import path
from .views import RecruiterProfileView, RecruiterPublicProfileView

urlpatterns = [
    path('profile/',                   RecruiterProfileView.as_view(),       name='recruiter-profile'),
    path('profile/<int:recruiter_id>/', RecruiterPublicProfileView.as_view(), name='recruiter-public-profile'),
]
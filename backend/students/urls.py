from django.urls import path
from .views import StudentProfileView, StudentPublicProfileView, AllStudentsView

urlpatterns = [
    path('profile/',        StudentProfileView.as_view(),        name='my-profile'),
    path('profile/<int:student_id>/', StudentPublicProfileView.as_view(), name='public-profile'),
    path('all/',            AllStudentsView.as_view(),            name='all-students'),
]
from django.urls import path
from .views import (
    RecruiterJobsView,
    RecruiterJobDetailView,
    StudentJobListView,
    JobDetailView,
)

urlpatterns = [
    # Recruiter: list my jobs + post new job
    path('my-jobs/',           RecruiterJobsView.as_view(),      name='recruiter-jobs'),

    # Recruiter: edit or delete a specific job
    path('my-jobs/<int:job_id>/', RecruiterJobDetailView.as_view(), name='job-detail-edit'),

    # Student: browse eligible jobs
    path('available/',         StudentJobListView.as_view(),     name='student-jobs'),

    # Anyone: view full details of a job
    path('<int:job_id>/',      JobDetailView.as_view(),          name='job-detail'),
]
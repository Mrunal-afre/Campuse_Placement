from django.urls import path
from .views import (
    ApplyToJobView,
    MyApplicationsView,
    WithdrawApplicationView,
    CheckApplicationView,
    JobApplicantsView,
    UpdateApplicationStatusView,
)

urlpatterns = [

    # Student routes
    path('apply/',
         ApplyToJobView.as_view(),
         name='apply-to-job'),

    path('my-applications/',
         MyApplicationsView.as_view(),
         name='my-applications'),

    path('<int:application_id>/withdraw/',
         WithdrawApplicationView.as_view(),
         name='withdraw'),

    path('check/<int:job_id>/',
         CheckApplicationView.as_view(),
         name='check-application'),

    # Recruiter routes
    path('job/<int:job_id>/applicants/',
         JobApplicantsView.as_view(),
         name='job-applicants'),

    path('<int:application_id>/update-status/',
         UpdateApplicationStatusView.as_view(),
         name='update-status'),
]
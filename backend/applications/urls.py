from django.urls import path
from .views import (
    ApplyToJobView,
    MyApplicationsView,
    WithdrawApplicationView,
    CheckApplicationView,
    JobApplicantsView,
    UpdateApplicationStatusView,
    BulkUpdateStatusView,
    StudentDashboardStatsView,
    RecruiterDashboardStatsView,
    ApplicationTimelineView,
)

urlpatterns = [
    # Student
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

    path('student-stats/',
         StudentDashboardStatsView.as_view(),
         name='student-stats'),

    # Recruiter
    path('job/<int:job_id>/applicants/',
         JobApplicantsView.as_view(),
         name='job-applicants'),

    path('<int:application_id>/update-status/',
         UpdateApplicationStatusView.as_view(),
         name='update-status'),

    path('bulk-update-status/',
         BulkUpdateStatusView.as_view(),
         name='bulk-update-status'),

    path('recruiter-stats/',
         RecruiterDashboardStatsView.as_view(),
         name='recruiter-stats'),

    # Shared
    path('<int:application_id>/timeline/',
         ApplicationTimelineView.as_view(),
         name='application-timeline'),
]
from django.urls import path
from .views import (
    PlatformStatsView,
    ManageUsersView,
    ManageUserDetailView,
    ManageJobsView,
    PendingApprovalsView,
)

urlpatterns = [
    path('stats/',
         PlatformStatsView.as_view(),
         name='admin-stats'),

    path('users/',
         ManageUsersView.as_view(),
         name='admin-users'),

    path('users/<int:user_id>/',
         ManageUserDetailView.as_view(),
         name='admin-user-detail'),

    path('jobs/',
         ManageJobsView.as_view(),
         name='admin-jobs'),

    path('jobs/<int:job_id>/',
         ManageJobsView.as_view(),
         name='admin-job-delete'),

    path('pending/',
         PendingApprovalsView.as_view(),
         name='admin-pending'),
]
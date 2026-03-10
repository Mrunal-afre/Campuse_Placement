from django.db import models
from users.models import CustomUser
from jobs.models import JobPosting


class Application(models.Model):

    STATUS_CHOICES = [
        ('applied',      'Applied'),
        ('under_review', 'Under Review'),
        ('shortlisted',  'Shortlisted'),
        ('selected',     'Selected'),
        ('rejected',     'Rejected'),
        ('withdrawn',    'Withdrawn'),
    ]

    student  = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='applications',
        limit_choices_to={'role': 'student'}
    )

    job = models.ForeignKey(
        JobPosting,
        on_delete=models.CASCADE,
        related_name='applications'
    )

    status          = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='applied'
    )
    cover_letter    = models.TextField(blank=True)

    # Only visible to the recruiter — student cannot see this
    recruiter_notes = models.TextField(blank=True)

    applied_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        # Prevent duplicate applications
        unique_together = ('student', 'job')
        ordering        = ['-applied_at']

    def __str__(self):
        return f"{self.student.full_name} → {self.job.title} [{self.status}]"
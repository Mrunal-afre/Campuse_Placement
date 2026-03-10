from django.db import models
from users.models import CustomUser


class JobPosting(models.Model):

    JOB_TYPE_CHOICES = [
        ('full_time',   'Full Time'),
        ('internship',  'Internship'),
        ('part_time',   'Part Time'),
        ('contract',    'Contract'),
    ]

    # The recruiter who created this job posting
    recruiter = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='job_postings',
        limit_choices_to={'role': 'recruiter'}
    )

    title               = models.CharField(max_length=200)
    description         = models.TextField()
    responsibilities    = models.TextField(blank=True)
    requirements        = models.TextField(blank=True)
    job_type            = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='full_time')
    location            = models.CharField(max_length=200, default='')

    # Package in LPA (Lakhs Per Annum) — e.g. 6.50
    package_lpa         = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    # Eligibility criteria
    min_cgpa            = models.DecimalField(max_digits=4, decimal_places=2, default=0)

    # Comma-separated branch codes: "cs,it,entc" means only CS/IT/ENTC students
    # Empty string means ALL branches allowed
    allowed_branches    = models.TextField(blank=True, default='')

    vacancy_count       = models.IntegerField(default=1)
    last_date_to_apply  = models.DateField(null=True, blank=True)
    is_active           = models.BooleanField(default=True)
    created_at          = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Show newest jobs first by default
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} at {self.recruiter.recruiter_profile.company_name}"

    def is_eligible(self, student_profile):
        """
        Check if a student is eligible for this job.
        Called from the view to filter jobs for each student.
        """
        # Check CGPA
        if student_profile.cgpa and student_profile.cgpa < self.min_cgpa:
            return False

        # Check branch — if allowed_branches is empty, all branches are allowed
        if self.allowed_branches:
            allowed = [b.strip() for b in self.allowed_branches.split(',')]
            if student_profile.branch and student_profile.branch not in allowed:
                return False

        return True
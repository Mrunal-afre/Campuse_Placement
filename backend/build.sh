#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate

# Create superuser automatically if it doesn't exist
python manage.py shell << 'EOF'
from users.models import CustomUser

email    = 'afremrunal@gmail.com'
password = 'Mrunal@1234'

if not CustomUser.objects.filter(email=email).exists():
    u = CustomUser.objects.create_superuser(
        email=email,
        password=password,
        full_name='Admin'
    )
    u.role       = 'admin'
    u.is_approved = True
    u.is_staff   = True
    u.is_superuser = True
    u.save()
    print(f'Superuser created: {email}')
else:
    u = CustomUser.objects.get(email=email)
    u.role       = 'admin'
    u.is_approved = True
    u.save()
    print(f'Superuser already exists: {email}')
EOF
"""
Temporary Render bootstrap for demo/admin access.

Place this file in the project root, alongside manage.py and Procfile.
It is safe to run on every startup because it will not create duplicate users.

Reminder: remove this file and revert the start command after the demo.
"""

import os
import sys

import django
from django.contrib.auth import get_user_model
from django.db import connection


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "smartsalon_backend.settings")
django.setup()


USERNAME = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
EMAIL = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@gmail.com")
PASSWORD = os.getenv("DJANGO_SUPERUSER_PASSWORD", "admin123")


def ensure_required_tables():
    user_model = get_user_model()
    table_names = set(connection.introspection.table_names())
    required_tables = {
        "django_migrations",
        "django_content_type",
        "auth_group",
        "auth_permission",
        user_model._meta.db_table,
    }
    missing_tables = sorted(required_tables - table_names)
    if missing_tables:
        print(
            "Cannot create demo superuser because required tables are missing: "
            + ", ".join(missing_tables),
            file=sys.stderr,
        )
        return False
    return True


def upsert_demo_superuser():
    user_model = get_user_model()
    user = user_model.objects.filter(username=USERNAME).first()
    role_field_exists = any(field.name == "role" for field in user_model._meta.get_fields())

    if user is None:
        extra_fields = {}
        if role_field_exists:
            extra_fields["role"] = "ADMIN"
        user_model.objects.create_superuser(
            username=USERNAME,
            email=EMAIL,
            password=PASSWORD,
            **extra_fields,
        )
        print(f"Created demo superuser '{USERNAME}'.")
        return

    changed_fields = []
    if user.email != EMAIL:
        user.email = EMAIL
        changed_fields.append("email")
    if not user.is_staff:
        user.is_staff = True
        changed_fields.append("is_staff")
    if not user.is_superuser:
        user.is_superuser = True
        changed_fields.append("is_superuser")
    if not user.is_active:
        user.is_active = True
        changed_fields.append("is_active")
    if role_field_exists and getattr(user, "role", None) != "ADMIN":
        user.role = "ADMIN"
        changed_fields.append("role")

    # Keep the known demo password so the presentation login is predictable.
    user.set_password(PASSWORD)
    changed_fields.append("password")

    user.save(update_fields=changed_fields)
    print(f"Verified demo superuser '{USERNAME}' already exists.")


if __name__ == "__main__":
    if not ensure_required_tables():
        sys.exit(1)
    upsert_demo_superuser()

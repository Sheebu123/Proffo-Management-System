from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User

from .models import Appointment, StaffSchedule


def next_half_hour(days=1):
    dt = timezone.now() + timedelta(days=days)
    dt = dt.replace(second=0, microsecond=0)
    minute = 30 if dt.minute < 30 else 0
    if minute == 0:
        dt = (dt + timedelta(hours=1)).replace(minute=0)
    else:
        dt = dt.replace(minute=30)
    return dt


class AppointmentAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='api_customer',
            password='SmartSalon@123',
            role='CUSTOMER',
        )
        self.staff = User.objects.create_user(
            username='api_staff',
            password='SmartSalon@123',
            role='STAFF',
        )
        self.slot_dt = next_half_hour(days=2)
        StaffSchedule.objects.create(
            staff=self.staff,
            schedule_date=self.slot_dt.date(),
            start_time=(self.slot_dt - timedelta(minutes=30)).time(),
            end_time=(self.slot_dt + timedelta(hours=2)).time(),
            is_available=True,
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_api_appointment_create(self):
        response = self.client.post(
            '/api/appointments/',
            data={
                'service': 'HAIRCUT',
                'staff': self.staff.id,
                'appointment_datetime': self.slot_dt.isoformat(),
                'notes': 'API booking',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Appointment.objects.count(), 1)

    def test_api_available_slots_excludes_booked_slot(self):
        Appointment.objects.create(
            customer=self.user,
            staff=self.staff,
            service='HAIRCUT',
            appointment_datetime=self.slot_dt,
            stylist_name=self.staff.username,
            duration_minutes=30,
            status='BOOKED',
        )
        response = self.client.get(
            f'/api/available-slots/?staff_id={self.staff.id}&date={self.slot_dt.date()}'
        )
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(self.slot_dt.isoformat(), response.data['available_slots'])

    def test_admin_can_create_staff_schedule(self):
        admin = User.objects.create_user(
            username='admin1',
            password='SmartSalon@123',
            role='ADMIN',
        )
        admin_refresh = RefreshToken.for_user(admin)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_refresh.access_token}')
        date = timezone.localdate() + timedelta(days=4)
        response = self.client.post(
            '/api/staff-schedules/',
            data={
                'staff': self.staff.id,
                'schedule_date': str(date),
                'start_time': '10:00:00',
                'end_time': '13:00:00',
                'is_available': True,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)

    def test_customer_cannot_create_staff_schedule(self):
        date = timezone.localdate() + timedelta(days=5)
        response = self.client.post(
            '/api/staff-schedules/',
            data={
                'staff': self.staff.id,
                'schedule_date': str(date),
                'start_time': '10:00:00',
                'end_time': '13:00:00',
                'is_available': True,
            },
            format='json',
        )
        self.assertEqual(response.status_code, 403)

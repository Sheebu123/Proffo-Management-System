from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from appointments.models import Appointment

from .models import Payment


def next_half_hour(days=1):
    dt = timezone.now() + timedelta(days=days)
    dt = dt.replace(second=0, microsecond=0)
    minute = 30 if dt.minute < 30 else 0
    if minute == 0:
        dt = (dt + timedelta(hours=1)).replace(minute=0)
    else:
        dt = dt.replace(minute=30)
    return dt


class PaymentAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='api_payuser',
            password='SmartSalon@123',
            role='CUSTOMER',
        )
        self.appointment = Appointment.objects.create(
            customer=self.user,
            service='MANICURE',
            stylist_name='Ana',
            appointment_datetime=next_half_hour(days=1),
        )
        self.payment = Payment.objects.create(
            appointment=self.appointment,
            amount=25,
            status='PENDING',
        )
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_api_mark_paid(self):
        response = self.client.post(
            f'/api/payments/{self.payment.id}/mark-paid/',
            data={'method': 'UPI', 'transaction_reference': 'API-REF-1'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'PAID')

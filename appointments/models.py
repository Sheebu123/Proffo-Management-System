from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class StaffSchedule(models.Model):
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='schedules',
    )
    schedule_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['schedule_date', 'start_time']
        constraints = [
            models.UniqueConstraint(
                fields=['staff', 'schedule_date', 'start_time', 'end_time'],
                name='unique_staff_schedule_block',
            )
        ]

    def clean(self):
        if self.staff and self.staff.role != 'STAFF':
            raise ValidationError('Schedule can only be assigned to STAFF users.')
        if self.start_time >= self.end_time:
            raise ValidationError('Schedule end time must be after start time.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.staff.username} - {self.schedule_date} ({self.start_time}-{self.end_time})'


class Appointment(models.Model):
    SERVICE_CHOICES = (
        ('HAIRCUT', 'Haircut'),
        ('FACIAL', 'Facial'),
        ('MANICURE', 'Manicure'),
        ('PEDICURE', 'Pedicure'),
    )
    STATUS_CHOICES = (
        ('BOOKED', 'Booked'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    )

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='appointments',
    )
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='staff_appointments',
        null=True,
        blank=True,
    )
    service = models.CharField(max_length=20, choices=SERVICE_CHOICES)
    stylist_name = models.CharField(max_length=100, blank=True)
    appointment_datetime = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='BOOKED')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['appointment_datetime']
        constraints = [
            models.UniqueConstraint(
                fields=['staff', 'appointment_datetime'],
                condition=models.Q(status='BOOKED'),
                name='unique_staff_appointment_slot_when_booked',
            )
        ]

    def clean(self):
        if not self.appointment_datetime:
            return
        if self.appointment_datetime <= timezone.now():
            raise ValidationError('Appointment time must be in the future.')
        if self.appointment_datetime.minute not in [0, 30] or self.appointment_datetime.second != 0:
            raise ValidationError('Appointments must be booked on 30-minute slots.')
        if self.duration_minutes != 30:
            raise ValidationError('Each appointment must be 30 minutes.')
        if self.staff and self.staff.role != 'STAFF':
            raise ValidationError('Appointment can only be assigned to STAFF users.')
        if self.staff:
            has_schedule = StaffSchedule.objects.filter(
                staff=self.staff,
                schedule_date=self.appointment_datetime.date(),
                start_time__lte=self.appointment_datetime.time(),
                end_time__gt=self.appointment_datetime.time(),
                is_available=True,
            ).exists()
            if not has_schedule:
                raise ValidationError('Selected staff is not available in this slot.')
            slot_taken = Appointment.objects.filter(
                staff=self.staff,
                appointment_datetime=self.appointment_datetime,
                status='BOOKED',
            ).exclude(pk=self.pk)
            if slot_taken.exists():
                raise ValidationError('Selected slot is already booked.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def get_service_price(self):
        prices = {
            'HAIRCUT': 20,
            'FACIAL': 35,
            'MANICURE': 25,
            'PEDICURE': 30,
        }
        return prices.get(self.service, 0)

    def __str__(self):
        staff_name = self.staff.username if self.staff else self.stylist_name
        return f'{self.customer.username} - {staff_name} - {self.appointment_datetime:%Y-%m-%d %H:%M}'

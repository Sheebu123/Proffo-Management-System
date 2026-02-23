from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers

from .models import Appointment, StaffSchedule

User = get_user_model()


class AppointmentSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    staff_username = serializers.CharField(source='staff.username', read_only=True)
    service_display = serializers.CharField(source='get_service_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id',
            'customer',
            'customer_username',
            'staff',
            'staff_username',
            'service',
            'service_display',
            'stylist_name',
            'appointment_datetime',
            'duration_minutes',
            'notes',
            'status',
            'status_display',
            'created_at',
        ]
        read_only_fields = ['customer', 'status', 'created_at', 'duration_minutes', 'stylist_name']

    def validate_appointment_datetime(self, value):
        if value <= timezone.now():
            raise serializers.ValidationError('Appointment time must be in the future.')
        return value

    def validate(self, attrs):
        staff = attrs.get('staff')
        appointment_datetime = attrs.get('appointment_datetime')
        instance = self.instance

        if not staff:
            raise serializers.ValidationError({'staff': 'Please select a staff member.'})

        if appointment_datetime:
            existing = Appointment.objects.filter(
                staff=staff,
                appointment_datetime=appointment_datetime,
                status='BOOKED',
            )
            if instance:
                existing = existing.exclude(pk=instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    {'appointment_datetime': 'This staff member is already booked for this slot.'}
                )
        return attrs

    def create(self, validated_data):
        staff = validated_data['staff']
        validated_data['stylist_name'] = staff.get_full_name() or staff.username
        validated_data['duration_minutes'] = 30
        return super().create(validated_data)


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class StaffScheduleSerializer(serializers.ModelSerializer):
    staff_username = serializers.CharField(source='staff.username', read_only=True)

    class Meta:
        model = StaffSchedule
        fields = [
            'id',
            'staff',
            'staff_username',
            'schedule_date',
            'start_time',
            'end_time',
            'is_available',
            'created_at',
        ]
        read_only_fields = ['created_at']

    def validate_staff(self, value):
        if value.role != 'STAFF':
            raise serializers.ValidationError('Selected user is not a staff member.')
        return value


class AvailableSlotQuerySerializer(serializers.Serializer):
    staff_id = serializers.IntegerField()
    date = serializers.DateField()

    def validate(self, attrs):
        staff_id = attrs['staff_id']
        slot_date = attrs['date']
        try:
            staff = User.objects.get(pk=staff_id, role='STAFF')
        except User.DoesNotExist as exc:
            raise serializers.ValidationError({'staff_id': 'Invalid staff id.'}) from exc
        attrs['staff'] = staff
        if slot_date < timezone.localdate():
            raise serializers.ValidationError({'date': 'Date cannot be in the past.'})
        return attrs


def generate_available_slots(staff, slot_date):
    schedules = StaffSchedule.objects.filter(
        staff=staff,
        schedule_date=slot_date,
        is_available=True,
    ).order_by('start_time')
    booked_times = set(
        Appointment.objects.filter(
            staff=staff,
            appointment_datetime__date=slot_date,
            status='BOOKED',
        ).values_list('appointment_datetime', flat=True)
    )

    available = []
    tz = timezone.get_current_timezone()
    for schedule in schedules:
        start_dt = timezone.make_aware(
            datetime.combine(slot_date, schedule.start_time),
            timezone=tz,
        )
        end_dt = timezone.make_aware(
            datetime.combine(slot_date, schedule.end_time),
            timezone=tz,
        )
        cursor = start_dt
        while cursor + timedelta(minutes=30) <= end_dt:
            if cursor not in booked_times and cursor > timezone.now():
                available.append(cursor)
            cursor += timedelta(minutes=30)
    return available

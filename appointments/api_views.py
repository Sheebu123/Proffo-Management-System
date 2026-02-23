from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.models import Payment

from .models import Appointment, StaffSchedule
from .serializers import (
    AppointmentSerializer,
    AvailableSlotQuerySerializer,
    StaffScheduleSerializer,
    StaffSerializer,
    generate_available_slots,
)


class IsAdminUserRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'ADMIN')


class AppointmentListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Appointment.objects.select_related('customer', 'staff')
        user = self.request.user
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if user.role == 'CUSTOMER':
            queryset = queryset.filter(customer=user)

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if search:
            queryset = queryset.filter(
                Q(service__icontains=search)
                | Q(staff__username__icontains=search)
                | Q(customer__username__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        if self.request.user.role != 'CUSTOMER':
            raise PermissionDenied('Only customers can create appointments.')
        appointment = serializer.save(customer=self.request.user)
        Payment.objects.create(
            appointment=appointment,
            amount=appointment.get_service_price(),
            status='PENDING',
        )


class AppointmentCancelAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, appointment_id):
        appointment = generics.get_object_or_404(Appointment, pk=appointment_id)
        user = request.user
        allowed = user.role in ['ADMIN', 'STAFF'] or appointment.customer == user

        if not allowed:
            return Response(
                {'detail': 'You do not have access to cancel this appointment.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if appointment.status == 'COMPLETED':
            return Response(
                {'detail': 'Completed appointments cannot be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appointment.status = 'CANCELLED'
        appointment.save(update_fields=['status'])
        return Response({'detail': 'Appointment cancelled.'})


class StaffListAPIView(generics.ListAPIView):
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.__class__.objects.filter(role='STAFF').order_by('username')


class StaffScheduleListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = StaffScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUserRole]

    def get_queryset(self):
        queryset = StaffSchedule.objects.select_related('staff')
        staff_id = self.request.query_params.get('staff_id')
        date = self.request.query_params.get('date')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        if date:
            queryset = queryset.filter(schedule_date=date)
        return queryset


class AvailableSlotsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = AvailableSlotQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        staff = serializer.validated_data['staff']
        slot_date = serializer.validated_data['date']
        slots = generate_available_slots(staff, slot_date)
        return Response(
            {
                'staff_id': staff.id,
                'staff_username': staff.username,
                'date': str(slot_date),
                'slot_duration_minutes': 30,
                'available_slots': [slot.isoformat() for slot in slots],
            }
        )


class DashboardSummaryAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        appointments = Appointment.objects.all()
        if user.role == 'CUSTOMER':
            appointments = appointments.filter(customer=user)

        data = {
            'appointments_count': appointments.count(),
            'upcoming_count': appointments.filter(
                status='BOOKED',
                appointment_datetime__gte=timezone.now(),
            ).count(),
            'pending_payments': Payment.objects.filter(
                appointment__in=appointments,
                status='PENDING',
            ).count(),
        }
        return Response(data)

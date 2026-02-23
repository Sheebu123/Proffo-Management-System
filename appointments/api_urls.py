from django.urls import path

from .api_views import (
    AppointmentCancelAPIView,
    AppointmentListCreateAPIView,
    AvailableSlotsAPIView,
    DashboardSummaryAPIView,
    StaffListAPIView,
    StaffScheduleListCreateAPIView,
)

urlpatterns = [
    path('dashboard/', DashboardSummaryAPIView.as_view(), name='api-dashboard'),
    path('staff/', StaffListAPIView.as_view(), name='api-staff-list'),
    path('staff-schedules/', StaffScheduleListCreateAPIView.as_view(), name='api-staff-schedules'),
    path('available-slots/', AvailableSlotsAPIView.as_view(), name='api-available-slots'),
    path('appointments/', AppointmentListCreateAPIView.as_view(), name='api-appointments'),
    path('appointments/<int:appointment_id>/cancel/', AppointmentCancelAPIView.as_view(), name='api-appointment-cancel'),
]

from django.contrib import admin
from .models import Appointment, StaffSchedule


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('customer', 'staff', 'service', 'appointment_datetime', 'status')
    list_filter = ('service', 'status')
    search_fields = ('customer__username', 'staff__username', 'stylist_name')


@admin.register(StaffSchedule)
class StaffScheduleAdmin(admin.ModelAdmin):
    list_display = ('staff', 'schedule_date', 'start_time', 'end_time', 'is_available')
    list_filter = ('schedule_date', 'is_available')
    search_fields = ('staff__username',)

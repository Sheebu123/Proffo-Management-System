from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    customer_username = serializers.CharField(source='appointment.customer.username', read_only=True)
    service_display = serializers.CharField(source='appointment.get_service_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'appointment',
            'customer_username',
            'service_display',
            'amount',
            'method',
            'method_display',
            'status',
            'status_display',
            'transaction_reference',
            'paid_at',
            'created_at',
        ]
        read_only_fields = ['appointment', 'amount', 'status', 'paid_at', 'created_at']


class MarkPaymentPaidSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['method', 'transaction_reference']

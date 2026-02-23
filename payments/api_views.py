from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment
from .serializers import MarkPaymentPaidSerializer, PaymentSerializer


class PaymentListAPIView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Payment.objects.select_related('appointment', 'appointment__customer')
        if self.request.user.role == 'CUSTOMER':
            queryset = queryset.filter(appointment__customer=self.request.user)
        return queryset


class PaymentMarkPaidAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, payment_id):
        payment = generics.get_object_or_404(Payment, pk=payment_id)
        user = request.user
        allowed = user.role in ['ADMIN', 'STAFF'] or payment.appointment.customer == user
        if not allowed:
            return Response(
                {'detail': 'You do not have access to update this payment.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = MarkPaymentPaidSerializer(payment, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        payment.mark_paid()
        return Response(PaymentSerializer(payment).data)

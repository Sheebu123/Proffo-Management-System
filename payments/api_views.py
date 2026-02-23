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

        if user.role == 'CUSTOMER' and payment.appointment.customer != user:
            return Response(
                {'detail': 'You do not have access to update this payment.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if user.role not in ['CUSTOMER', 'ADMIN', 'STAFF']:
            return Response(
                {'detail': 'You do not have access to update this payment.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = MarkPaymentPaidSerializer(payment, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        if user.role == 'CUSTOMER':
            if payment.status != 'PENDING':
                return Response(
                    {'detail': 'Payment can only be submitted once from pending state.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            payment.mark_requested()
            return Response(
                {
                    'detail': 'Payment submitted for admin/staff approval.',
                    'payment': PaymentSerializer(payment).data,
                },
                status=status.HTTP_202_ACCEPTED,
            )

        if payment.status != 'REQUESTED':
            return Response(
                {'detail': 'Customer has not submitted this payment for approval yet.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment.mark_paid()
        return Response(
            {
                'detail': 'Payment approved and marked as paid.',
                'payment': PaymentSerializer(payment).data,
            }
        )

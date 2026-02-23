from django.urls import path

from .api_views import PaymentListAPIView, PaymentMarkPaidAPIView

urlpatterns = [
    path('payments/', PaymentListAPIView.as_view(), name='api-payments'),
    path('payments/<int:payment_id>/mark-paid/', PaymentMarkPaidAPIView.as_view(), name='api-payment-mark-paid'),
]

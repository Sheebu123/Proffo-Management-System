from django.db import models
from django.utils import timezone


class Payment(models.Model):
    METHOD_CHOICES = (
        ('CASH', 'Cash'),
        ('CARD', 'Card'),
        ('UPI', 'UPI'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('REQUESTED', 'Requested For Approval'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
    )

    appointment = models.OneToOneField(
        'appointments.Appointment',
        on_delete=models.CASCADE,
        related_name='payment',
    )
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='CASH')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    transaction_reference = models.CharField(max_length=120, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def mark_paid(self):
        self.status = 'PAID'
        self.paid_at = timezone.now()
        self.save(update_fields=['status', 'paid_at'])

    def mark_requested(self):
        self.status = 'REQUESTED'
        self.paid_at = None
        self.save(update_fields=['status', 'paid_at'])

    def __str__(self):
        return f'Payment #{self.pk} - {self.status} - {self.amount}'

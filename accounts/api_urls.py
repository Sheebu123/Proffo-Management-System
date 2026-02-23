from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .api_views import LoginAPIView, LogoutAPIView, ProfileAPIView, RegisterAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='api-register'),
    path('login/', LoginAPIView.as_view(), name='api-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='api-token-refresh'),
    path('logout/', LogoutAPIView.as_view(), name='api-logout'),
    path('profile/', ProfileAPIView.as_view(), name='api-profile'),
]

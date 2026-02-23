from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class AccountAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_api_register_returns_token(self):
        response = self.client.post(
            '/api/accounts/register/',
            {
                'username': 'apiuser',
                'email': 'api@example.com',
                'first_name': 'Api',
                'last_name': 'User',
                'password': 'SmartSalon@123',
            },
            format='json',
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_api_profile_requires_token(self):
        user = User.objects.create_user(username='u1', password='SmartSalon@123')
        refresh = RefreshToken.for_user(user)

        unauthorized = self.client.get('/api/accounts/profile/')
        self.assertEqual(unauthorized.status_code, 401)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        authorized = self.client.get('/api/accounts/profile/')
        self.assertEqual(authorized.status_code, 200)
        self.assertEqual(authorized.data['username'], 'u1')

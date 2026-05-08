from django.db import connections
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET


@never_cache
@require_GET
def service_root(request):
    return JsonResponse(
        {
            'service': 'SmartSalon API',
            'status': 'ok',
            'health_check': '/health/',
        }
    )


@never_cache
@require_GET
def health_check(request):
    try:
        with connections['default'].cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
    except Exception as exc:
        return JsonResponse(
            {
                'status': 'error',
                'database': 'unavailable',
                'detail': str(exc),
            },
            status=503,
        )

    return JsonResponse(
        {
            'status': 'ok',
            'database': 'reachable',
        }
    )

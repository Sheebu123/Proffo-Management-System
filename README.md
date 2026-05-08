# SmartSalon Appointment System

SmartSalon is a resume-ready full-stack project:
- Backend: Django + Django REST Framework (JWT Auth)
- Frontend: Next.js + Tailwind CSS

## Features

- User register/login/logout
- Role-aware dashboard (Customer/Staff/Admin)
- Admin can manage staff schedules (date + start/end time)
- Customer sees only available 30-minute slots per staff/date
- Appointment booking with future-date validation
- Double-booking prevention for same staff and slot
- Appointment cancellation flow
- Linked payment per appointment
- Mark payment as paid

## Architecture

- `smartsalon_backend/`: Django project config
- `accounts/`: custom user model + JWT auth APIs
- `appointments/`: staff schedule + slot booking APIs
- `payments/`: payment tracking APIs
- `frontend/`: Next.js + Tailwind frontend

## API Endpoints (Django)

- `POST /api/accounts/register/`
- `POST /api/accounts/login/`
- `POST /api/accounts/token/refresh/`
- `POST /api/accounts/logout/`
- `GET /api/accounts/profile/`
- `GET /api/dashboard/`
- `GET /health/`
- `GET /api/staff/`
- `GET, POST /api/staff-schedules/` (admin create)
- `GET /api/available-slots/?staff_id=<id>&date=YYYY-MM-DD`
- `GET, POST /api/appointments/`
- `POST /api/appointments/<id>/cancel/`
- `GET /api/payments/`
- `POST /api/payments/<id>/mark-paid/`

Auth header for protected APIs:
- `Authorization: Bearer <access_token>`

## Backend Setup

```powershell
# from project root
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py runserver
```

Backend runs at:
- `http://127.0.0.1:8000`

## Deployment Environment Variables (Backend)

- `SECRET_KEY`: strong secret key
- `DEBUG`: `False` in production
- `ALLOWED_HOSTS`: comma-separated hostnames (example: `your-backend.onrender.com`)
- `DATABASE_URL`: PostgreSQL connection URL
- `DB_CONN_MAX_AGE`: database connection reuse in seconds (example: `60`)
- `DB_CONN_HEALTH_CHECKS`: keep long-lived DB connections healthy (`True` in production)
- `DB_SSLMODE`: set `require` for managed PostgreSQL when needed
- `CORS_ALLOWED_ORIGINS`: allowed frontend origins
- `CORS_ALLOWED_ORIGIN_REGEXES`: optional regex list for preview deployments
- `CSRF_TRUSTED_ORIGINS`: trusted frontend origins (with scheme)
- `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`: set `True` in production
- `WEB_CONCURRENCY`, `GUNICORN_THREADS`, `GUNICORN_TIMEOUT`: Gunicorn tuning for Render
- `DJANGO_LOG_LEVEL`: application log verbosity (`INFO` recommended in production)

## Deployment Quick Setup

### Backend (Render/Railway style)

1. Build command:
   - `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
2. Start command:
   - `gunicorn --config smartsalon_backend/gunicorn.conf.py smartsalon_backend.wsgi:application`
3. Set backend env vars from `.env.example` with production values.
4. Set the health check path to:
   - `/health/`

### Frontend (Vercel style)

1. Root directory: `frontend`
2. Build command: `npm run build`
3. Start command: `npm start`
4. Set env:
   - `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain`
   - `NEXT_PUBLIC_API_TIMEOUT_MS=15000`

## Frontend Setup (Next.js)

```powershell
# from project root
cd frontend
copy .env.example .env.local
npm run dev
```

Frontend runs at:
- `http://localhost:3000`

Environment variable:
- `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`

## Testing and Quality

```powershell
# backend
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test

# frontend
cd frontend
npm run lint
npm run build
```

## Notes

- Uses custom user model: `accounts.User`
- DB: SQLite (`db.sqlite3`)
- JWT blacklisting tables are migrated via `rest_framework_simplejwt.token_blacklist`

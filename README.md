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

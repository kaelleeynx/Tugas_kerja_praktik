# Backend — Toko Besi Serta Guna API

Laravel 10 REST API for the Toko Besi Serta Guna management system.

## Stack

- **Laravel 10** + PHP 8.2
- **Laravel Sanctum** — Token authentication (7-day expiry)
- **PostgreSQL** — Database (Railway)
- **FormRequest** — Input validation
- **API Resources** — Response formatting

## Setup

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve
```

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login |
| POST | `/api/auth/register` | ❌ | Register |
| POST | `/api/auth/logout` | ✅ | Logout |
| GET | `/api/auth/me` | ✅ | Get current user |
| PUT | `/api/auth/me` | ✅ | Update profile |
| POST | `/api/auth/me/password` | ✅ | Change password |

### Transactions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/transactions` | ✅ | List all |
| POST | `/api/transactions` | ✅ | Create |
| GET | `/api/transactions/{id}` | ✅ | Get single |
| PUT | `/api/transactions/{id}` | ✅ | Update qty |
| DELETE | `/api/transactions/{id}` | ✅ | Delete |
| GET | `/api/transactions/statistics` | ✅ | Statistics |
| GET | `/api/transactions/daily` | ✅ | Daily stats |
| GET | `/api/transactions/dashboard-summary` | ✅ | Dashboard |
| GET | `/api/transactions/monthly-report` | ✅ | Monthly report |
| GET | `/api/transactions/export` | ✅ | Export data |

### Price List
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/price-list` | ✅ | List all |
| POST | `/api/price-list` | ✅ | Create |
| GET | `/api/price-list/{id}` | ✅ | Get single |
| PUT | `/api/price-list/{id}` | ✅ | Update |
| DELETE | `/api/price-list/{id}` | ✅ | Delete |
| POST | `/api/price-list/{id}/sale` | ✅ | Quick sale |
| POST | `/api/price-list/{id}/restock` | ✅ | Quick restock |

### Users (Owner only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | 🔒 | List users |
| PUT | `/api/users/{id}` | 🔒 | Update user |
| DELETE | `/api/users/{id}` | 🔒 | Delete user |

### Approvals (Owner only)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/approvals` | 🔒 | Pending list |
| POST | `/api/approvals/{id}/approve` | 🔒 | Approve |
| POST | `/api/approvals/{id}/reject` | 🔒 | Reject |

> ✅ = `auth:sanctum` | 🔒 = `auth:sanctum` + `role:owner`

## Response Format

```json
{
  "success": true,
  "message": "Optional",
  "data": {}
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated frontend URLs |
| `SANCTUM_TOKEN_EXPIRATION` | `10080` | Token expiry in minutes (7 days) |

## Architecture

```
Controllers → FormRequests → Services → Models → Database
     ↓
API Resources → JSON Response
```

---

**Version**: 3.0.0 | **Last Updated**: April 2026

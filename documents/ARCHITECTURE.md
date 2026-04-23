# Architecture Overview

## Toko Besi Serta Guna — System Design v3.0

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (React 18 + Vite 8)                     │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  AuthContext  │  │  ThemeContext │  │  BrowserRouter (v7)      │  │
│  │  (useAuth)   │  │  (dark mode) │  │  ProtectedRoute          │  │
│  │              │  │              │  │  OwnerRoute / GuestRoute  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Components (Lazy Loaded via React.lazy + Suspense)          │   │
│  │  Dashboard │ TransactionForm │ PriceList │ Settings          │   │
│  │  ReportView │ UserManagement │ ApprovalInbox │ Navbar        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Services                                                    │   │
│  │  apiClient.js → Axios + interceptors (token, 401 logout)    │   │
│  │  api.js → Auth, Users, Transactions, Approvals, Notif       │   │
│  │  priceListService.js → PriceList CRUD + sale/restock        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS (REST API)
                           │ Base: VITE_BACKEND_URL/api
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                    Backend (Laravel 10)                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Middleware Pipeline                                         │   │
│  │  CORS → auth:sanctum → role:owner → Controller              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  FormRequests (Validation Layer)                              │   │
│  │  LoginRequest │ RegisterRequest │ StoreTransactionRequest    │   │
│  │  UpdateTransactionRequest │ UpdatePriceListRequest           │   │
│  │  UpdateProfileRequest                                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Controllers                                                 │   │
│  │  AuthController │ TransactionController │ PriceListController│   │
│  │  UserController │ ApprovalController │ NotificationController│   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  API Resources (Response Layer)                              │   │
│  │  UserResource │ TransactionResource │ PriceListResource      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Services (Business Logic)                                   │   │
│  │  TransactionService → statistics, daily, monthly reports     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Models (Eloquent ORM)                                       │   │
│  │  User │ Transaction │ PriceList │ Notification               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                  ┌────────┴────────┐
                  │                 │
         ┌───────▼───────┐  ┌──────▼──────┐
         │  PostgreSQL   │  │   Storage   │
         │  (Railway)    │  │   (public)  │
         │               │  │             │
         │  - users      │  │  - profiles │
         │  - transactions│  │    (images) │
         │  - price_lists │  │             │
         │  - notifications│ │             │
         └───────────────┘  └─────────────┘
```

---

## Project Structure

### Frontend (`/frontend`)

```
frontend/
├── public/
│   └── index.html              # Entry point (lang="id")
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.jsx   # React error boundary
│   │   ├── LoadingSpinner.jsx  # Suspense fallback
│   │   ├── Navbar.jsx          # NavLink-based navigation
│   │   ├── LoginForm.jsx       # Auth form (login + register)
│   │   ├── Dashboard.jsx       # Analytics + charts
│   │   ├── TransactionForm.jsx # Transaction creation
│   │   ├── PriceList.jsx       # Product management
│   │   ├── ReportView.jsx      # Reports (Owner only)
│   │   ├── UserManagement.jsx  # User CRUD (Owner only)
│   │   ├── ApprovalInbox.jsx   # Admin approval (Owner only)
│   │   ├── Settings.jsx        # Profile + password
│   │   └── NotificationBell.jsx# Notification dropdown
│   ├── services/
│   │   ├── apiClient.js        # Axios + interceptors
│   │   ├── api.js              # API service functions
│   │   └── priceListService.js # PriceList service
│   ├── context/
│   │   ├── AuthContext.jsx     # Auth state (useAuth hook)
│   │   └── ThemeContext.jsx    # Dark mode state
│   ├── utils/
│   │   └── storage.js          # localStorage helpers
│   ├── App.jsx                 # Router + route guards
│   ├── App.css                 # Global styles
│   └── main.jsx                # React DOM render
├── vite.config.js              # Vite 8 + proxy + chunks
└── package.json
```

### Backend (`/backend`)

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php       # Login, register, profile
│   │   │   ├── TransactionController.php # CRUD + stats + export
│   │   │   ├── PriceListController.php  # CRUD + sale + restock
│   │   │   ├── UserController.php       # User management
│   │   │   ├── ApprovalController.php   # Admin approval flow
│   │   │   └── NotificationController.php# Notification CRUD
│   │   ├── Requests/
│   │   │   ├── LoginRequest.php
│   │   │   ├── RegisterRequest.php
│   │   │   ├── StoreTransactionRequest.php
│   │   │   ├── UpdateTransactionRequest.php
│   │   │   ├── UpdatePriceListRequest.php
│   │   │   └── UpdateProfileRequest.php
│   │   ├── Resources/
│   │   │   ├── UserResource.php
│   │   │   ├── TransactionResource.php
│   │   │   └── PriceListResource.php
│   │   └── Middleware/
│   │       └── CheckRole.php            # role:owner guard
│   ├── Models/
│   │   ├── User.php
│   │   ├── Transaction.php
│   │   ├── PriceList.php
│   │   └── Notification.php
│   └── Services/
│       └── TransactionService.php       # Statistics & reports
├── config/
│   ├── cors.php                # Env-driven CORS origins
│   └── sanctum.php             # 7-day token expiration
├── database/
│   └── migrations/
│       └── 2026_04_23_*_add_performance_indexes.php
├── routes/
│   └── api.php                 # All API routes
├── .env.example                # Template with CORS + Sanctum vars
└── composer.json
```

---

## Authentication Flow

```
1. User inputs credentials → LoginForm
         │
         ▼
2. API: POST /api/auth/login (LoginRequest validates)
         │
         ▼
3. AuthController: verify credentials + check is_approved
         │
         ▼
4. Response: { success, data: { token, user: UserResource } }
         │
         ▼
5. AuthContext.login() → saves to localStorage as activeUser
         │
         ▼
6. apiClient interceptor → reads token from activeUser
         │
         ▼
7. All subsequent requests include: Authorization: Bearer {token}
         │
         ▼
8. On 401: interceptor auto-clears storage + calls logout callback
```

---

## API Response Format

All endpoints return standardized JSON:

```json
// Success
{
  "success": true,
  "message": "Optional success message",
  "data": { /* UserResource / TransactionResource / etc */ }
}

// Error
{
  "success": false,
  "message": "Indonesian error message"
}

// Validation Error (422)
{
  "message": "Validation error",
  "errors": {
    "field": ["Error message in Indonesian"]
  }
}
```

---

## Security Architecture

### Layers
1. **CORS** — Env-driven origin whitelist + Railway pattern
2. **Sanctum** — Token auth, 7-day expiry
3. **FormRequest** — Input validation (server-side)
4. **CheckRole Middleware** — Owner-only route protection
5. **DB Transactions** — `lockForUpdate()` for stock operations

### Token Lifecycle
- Created on login → stored in `personal_access_tokens`
- Expires after 7 days (configurable via env)
- Revoked on: logout, user delete, admin reject
- 401 response → frontend auto-clears and redirects to login

---

## Database Schema

### Tables

| Table | Key Columns | Indexes |
|-------|------------|---------|
| `users` | id, username, name, password, role, is_approved, profile_picture | username, (role, is_approved) |
| `transactions` | id(string), type, date, price_list_id, quantity, price, total, user_id | (date, type), price_list_id, user_id |
| `price_lists` | id, product_id, product_name, category, price, stock | — |
| `notifications` | id, user_id, type, title, message, data(json), read_at | (user_id, read_at) |
| `personal_access_tokens` | tokenable_id, name, token, abilities, expires_at | — |

### Transaction Types
- `penjualan` — Sale (decreases stock)
- `pengeluaran` — Expense/Purchase (increases stock)

---

## Deployment

```
GitHub Repository (kaelleeynx/Tugas_kerja_praktik)
    │
    ├─ Frontend → Vercel
    │  ├─ Root: /frontend
    │  ├─ Build: npm run build → dist/
    │  └─ Env: VITE_BACKEND_URL
    │
    └─ Backend → Railway
       ├─ Root: /backend
       ├─ DB: Railway PostgreSQL
       └─ Env: CORS_ALLOWED_ORIGINS, SANCTUM_TOKEN_EXPIRATION
```

---

**Last Updated**: April 2026  
**Version**: 3.0.0

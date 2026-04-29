# Toko Besi Serta Guna — Management System

Sistem manajemen full-stack untuk Toko Besi Serta Guna. Pencatatan transaksi, manajemen stok, laporan keuangan, dan dashboard analytics.

## 🚀 Tech Stack

### Frontend

- **Vite 8**: Build tool + HMR
- **React 18**: UI library with hooks
- **React Router 7**: Path-based routing + route guards
- **Tailwind CSS v4**: Utility-first CSS
- **Framer Motion + Anime.js v4**: Animations & micro-interactions
- **Recharts**: Data visualization (BarChart, analytics)
- **Axios**: HTTP client with interceptors

### Backend

- **Laravel 12**: PHP framework
- **PostgreSQL**: Relational database (Railway)
- **Laravel Sanctum**: Token-based SPA authentication
- **API Resources**: Standardized JSON responses
- **FormRequest**: Server-side input validation

## ✨ Features

### Core Features

- **Role-Based Access Control**:
  - **Owner**: Full access — approve/reject admin, view reports, manage users
  - **Admin**: Requires owner approval, manage inventory, view analytics
  - **Staff**: Auto-approved, record transactions, view daily summary

- **Transaction Management**: Pencatatan penjualan dan pengeluaran with automatic stock sync

- **Inventory Management** (Daftar Barang):
  - Product catalog with categorization
  - Real-time stock tracking
  - Quick sale/restock actions
  - Low stock warnings

- **Dashboard Analytics**:
  - Visual charts (daily/monthly/yearly views)
  - Real-time statistics (penjualan, pengeluaran, laba bersih)
  - Transaction history with quantity adjustments
  - Period comparison

- **User Management**:
  - Profile picture upload (max 2MB, JPEG/PNG/WebP)
  - Password strength indicator
  - Last login tracking
  - User approval workflow

- **Notifications System**:
  - Approval notifications
  - System alerts
  - Unread count indicator

### UI/UX Features

- **Dark Mode**: System preference detection + manual toggle
- **Responsive Design**: Desktop, tablet, mobile optimized
- **Animations**: Entrance animations, micro-interactions
- **Loading States**: Skeleton loaders, spinners, suspense fallbacks
- **Route Guards**: ProtectedRoute, OwnerRoute, GuestRoute

## 🏗️ Architecture

```
Frontend (React 18 + Vite 8)
├── AuthContext     → Centralized auth state (useAuth hook)
├── apiClient.js    → Axios + auto-token + 401 auto-logout
├── api.js          → API service functions
├── BrowserRouter   → React Router v7 with route guards
└── Components      → Lazy-loaded via React.lazy + Suspense

Backend (Laravel 10)
├── FormRequests    → Input validation (6 classes)
├── API Resources   → Response formatting (3 classes)
├── Controllers     → Route handlers (5 controllers)
├── Services        → Business logic (TransactionService)
├── Middleware       → auth:sanctum + role:owner
└── Database        → PostgreSQL + performance indexes
```

## 🔧 Setup

### Prerequisites

- PHP >= 8.2, Composer
- Node.js >= 18, npm
- PostgreSQL (or MySQL)
- Git

### Backend

```bash
cd backend
composer install
copy .env.example .env
php artisan key:generate

# Configure database in .env
# DB_CONNECTION=pgsql
# DB_DATABASE=toko_besi

php artisan migrate
php artisan db:seed          # Creates default owner
php artisan storage:link     # Profile picture uploads
php artisan serve            # http://localhost:8000
```

Default owner: `owner` / `owner123`

### Frontend

```bash
cd frontend
npm install
# Set VITE_BACKEND_URL in .env
npm run dev                  # http://localhost:3000
```

## 📦 Production Build

### Frontend

```bash
cd frontend
npm run build                # Output: dist/
```

### Backend

```bash
cd backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan migrate --force  # New performance indexes
```

## 🔐 Security

- **Authentication**: Sanctum token-based, 7-day expiration
- **CORS**: Env-driven origins (no wildcards), Railway pattern matching
- **Validation**: FormRequest classes with Indonesian error messages
- **Authorization**: Route middleware (`auth:sanctum`, `role:owner`)
- **Token Revocation**: Tokens cleared on user delete/reject
- **Rate Limiting**: Auth endpoints (10 req/min)
- **Input**: SQL injection prevention via Eloquent ORM

## 📊 API Response Format

All endpoints return consistent format:

```json
{
  "success": true,
  "message": "Optional message",
  "data": { }
}
```

## 🚀 Deployment

| Service | Platform | Config |
|---------|----------|--------|
| Backend | Railway | Root: `/backend`, env vars for DB + CORS |
| Frontend | Vercel | Root: `/frontend`, output: `dist/`, env: `VITE_BACKEND_URL` |
| Database | Railway PostgreSQL | Auto-provisioned |

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide.

## 📝 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) — Railway + Vercel deployment guide
- [CHANGELOG.md](CHANGELOG.md) — Version history
- [documents/ARCHITECTURE.md](documents/ARCHITECTURE.md) — System design
- [documents/IMPROVEMENT_SUMMARY.md](documents/IMPROVEMENT_SUMMARY.md) — Improvement details

## 👨‍💻 Author

**Zandi** (rzandi / kaelleeynx)  
Tugas Kerja Praktik — Toko Besi Serta Guna

---

**Version**: 3.0.0  
**Last Updated**: April 2026  
**Stack**: Laravel 10 + Vite 8 + React 18

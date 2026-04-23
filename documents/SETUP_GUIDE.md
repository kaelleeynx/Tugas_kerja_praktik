# Development Setup Guide

## Prerequisites

Before you start, ensure you have:
- Node.js 18+ (check: `node --version`)
- PHP 8.2+ (check: `php --version`)
- Composer (check: `composer --version`)
- PostgreSQL or MySQL (for local development)
- Git

---

## Quick Start (5 minutes)

### 1. Clone Repository
```bash
git clone https://github.com/kaelleeynx/Tugas_kerja_praktik.git
cd Tugas_kerja_praktik
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
php artisan key:generate
composer install
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve
# Backend runs on http://localhost:8000
```

### 3. Frontend Setup (new terminal)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Access Application
- **URL**: http://localhost:3000
- **Default login**: 
  - Username: `owner`
  - Password: `owner123`

---

## Detailed Backend Setup

### Step 1: Environment Configuration

```bash
cd backend
cp .env.example .env
```

Edit `.env` file:
```dotenv
APP_NAME="Toko Besi Serta Guna"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database Configuration (PostgreSQL example)
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=toko_besi
DB_USERNAME=postgres
DB_PASSWORD=secret

# Frontend CORS (Add your frontend URL here)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Sanctum Token Expiration (in minutes)
SANCTUM_TOKEN_EXPIRATION=10080
```

### Step 2: Install Dependencies & Key

```bash
composer install
php artisan key:generate
```

### Step 3: Database & Storage

```bash
# Run migrations and seed data
php artisan migrate --seed

# Create storage symlink for profile pictures
php artisan storage:link
```

### Step 4: Start Server

```bash
php artisan serve
```

---

## Detailed Frontend Setup

### Step 1: Environment Configuration

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:
```dotenv
VITE_BACKEND_URL=http://localhost:8000
```

### Step 2: Install & Start

```bash
npm install
npm run dev
# Runs on http://localhost:3000 via Vite
```

---

## Common Issues & Solutions

### Issue: CORS Error
**Error**: `No 'Access-Control-Allow-Origin' header`
**Solution**:
1. Check `backend/.env`:
   ```dotenv
   CORS_ALLOWED_ORIGINS=http://localhost:3000
   ```
2. Restart backend: `php artisan serve`

### Issue: Database Connection Error
**Error**: `SQLSTATE[HY000] [2002] Connection refused`
**Solution**:
1. Ensure your database service is running.
2. Check `.env` DB credentials.

### Issue: Image Upload Not Working
**Solution**: Run `php artisan storage:link` in the backend directory.

---

**Version**: 3.0.0 | **Last Updated**: April 2026

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-04-23

### 🚀 Major Changes — Full Architecture Modernization

#### Phase 1: Frontend Modernization

- **AuthContext**: Centralized auth state with `useAuth()` hook — eliminated prop drilling across 8+ components
- **apiClient.js**: Axios instance with request interceptor (auto-token) + response interceptor (401 auto-logout)
- **React Router v7**: Path-based routing with `ProtectedRoute`, `OwnerRoute`, `GuestRoute` guards
- **Navbar**: Migrated to `NavLink` with auto-active class detection
- **Vite 8 Compatibility**: Fixed `manualChunks` config for Rolldown bundler, migrated to `@vitejs/plugin-react`

#### Phase 2: Backend Architecture

- **FormRequest Classes** (6 new):
  - `LoginRequest`, `RegisterRequest` — Auth validation
  - `StoreTransactionRequest`, `UpdateTransactionRequest` — Transaction validation
  - `UpdatePriceListRequest` — Price list validation
  - `UpdateProfileRequest` — Profile + image validation
- **API Resources** (3 new):
  - `UserResource` — Centralized profile_picture URL generation
  - `TransactionResource` — Product name via `whenLoaded('priceList')`
  - `PriceListResource` — Computed qty_sales/qty_purchases
- **Controller Refactor**: All 5 controllers updated with FormRequests + Resources
- **TransactionService Fix**: Critical column mismatch (`amount`→`total`, `sale`→`penjualan`, `created_at`→`date`)

### ✨ Added

#### Frontend

- `AuthContext.jsx` — Centralized auth state provider
- `apiClient.js` — Axios client with interceptors
- Route guards (ProtectedRoute, OwnerRoute, GuestRoute) in `App.jsx`
- System dark mode preference detection in `ThemeContext`

#### Backend

- 6 FormRequest classes with Indonesian error messages
- 3 API Resource classes for consistent JSON output
- `getCurrentUser`, `updateProfile`, `changePassword` in AuthController
- `getStatistics`, `getDailyStatistics`, `dashboardSummary`, `monthlyReport`, `export` in TransactionController
- `store`, `destroy` in PriceListController
- `search` in UserController
- Performance index migration (6 database indexes)
- `.env.example` with CORS and Sanctum env vars

### 🔧 Changed

- **CORS**: Wildcard `*` → env-driven `CORS_ALLOWED_ORIGINS` with Railway pattern
- **Sanctum**: Token expiration `null` → 7 days (10080 minutes)
- **API Response**: All endpoints now return `{ success, data }` format
- **Token Management**: Tokens revoked on user delete/reject
- **Error Messages**: All validation errors in Indonesian
- **Storage Utils**: Removed dead `getUsers()`/`saveUsers()` legacy functions
- **Build Output**: Vite 8 with code splitting (19 chunks, 428KB vendor gzipped)

### 🐛 Fixed

#### Critical Bugs (Caught in Double-Check)

| Bug | Impact |
|-----|--------|
| `profile_picture_url` → `profile_picture` | Profile picture wouldn't load in Settings |
| Missing `store()` + `destroy()` in PriceListController | POST/DELETE /price-list → 500 error |
| Missing `updateProfile()` + `changePassword()` in AuthController | PUT/POST /auth/me → 500 error |
| Missing 5 methods in TransactionController | Dashboard stats/reports → 500 error |
| TransactionService wrong columns (`amount`, `sale`, `created_at`) | All statistics would return 0 |
| Settings error handler not Axios-aware | Wrong error messages shown to user |
| Dead `config/api.js` with hardcoded Railway URL | Dead code + leaked infrastructure URL |

### 🔒 Security

- CORS hardened with specific origins (env-driven)
- Sanctum token expiration enforced (7 days)
- FormRequest validation on all write endpoints
- Token revocation on user delete/reject
- Future-date prevention on transaction creation
- Image upload validation (mimes + 2MB limit)

### 📊 Performance

- Database indexes on high-frequency queries:
  - `transactions(date, type)` — Dashboard filtering
  - `transactions(price_list_id)`, `transactions(user_id)` — Joins
  - `users(username)` — Login lookup
  - `users(role, is_approved)` — Approval inbox
  - `notifications(user_id, read_at)` — Notification feed
- CORS preflight caching (24 hours)

### 📊 Statistics

| Metric | Value |
|--------|-------|
| Files Changed | 30+ |
| New Backend Files | 10 (FormRequests, Resources, Migration) |
| Bugs Fixed | 7 critical runtime bugs |
| Build Time | 3.53s (0 errors) |
| Console.logs Removed | 19+ |
| Hardcoded URLs Removed | 3 |

---

## [2.0.0] - 2024-12-05

### 🚀 Major Changes

#### Frontend Migration

- **Vite Migration**: Migrated from Create React App to Vite 5.4 for faster builds and HMR
- **Build Performance**: 3-5x faster development server startup
- **Module System**: Native ES modules support

### ✨ Added

#### UI/UX Improvements

- **Dark Mode Transitions**: Smooth 300ms CSS transitions when toggling themes
- **Text Contrast**: Enhanced contrast across all components (AAA WCAG compliance)
- **Loading States**: Professional loading spinners with Framer Motion
- **Empty States**: Enlarged icons (60px) with engaging animations
- **Micro-animations**: Entrance animations on all major components
- **Password Strength Indicator**: Real-time feedback with color coding

#### Features

- **Dashboard Chart**: Functional Statistik Keuangan with Recharts BarChart
- **Transaction Quantity Adjustment**: Owner can adjust quantities from dashboard
- **Filter Pills**: Enhanced active states with glow effects
- **Profile Picture Support**: Upload and manage user profile pictures (max 2MB)

#### Backend Optimizations

- **N+1 Query Fix**: PriceList endpoint (1001 queries → 3 queries, 20-100x faster)
- **Rate Limiting**: Auth endpoints limited to 10 requests/minute
- **CORS Configuration**: Proper allowed origins

### 🐛 Fixed

- **Invalid Date Bug**: UserManagement.jsx with proper error handling
- **Missing Function**: `getRoleBadgeColor()` in UserManagement
- **Laba Bersih Card**: Fixed disabled appearance
- **Memory Usage**: 90% reduction in PriceList endpoint

### ⚡ Performance

| Metric | Before | After |
|--------|--------|-------|
| Dev Server Start | 15-30s | 2-3s |
| PriceList Load | 500ms | 25ms |
| Memory Usage | 50MB | 5MB |
| Database Queries | 1001 | 3 |

---

## [1.0.0] - 2024-11-29

### Added

- **Initial Release**: Full-stack frozen food management system
- **Profile Picture Support**: Users can upload profile pictures (max 2MB)
- **Settings Redesign**: "Hero Card" layout with gradient header
- **Approval Inbox**: Profile picture display for pending users
- **Animations**: Entrance animations using anime.js v4
- **UI Effects**: Waves background effect on Login page

### Changed

- **Anime.js**: Upgraded to v4
- **Tailwind CSS**: Upgraded to v4

### Fixed

- **Runtime Error**: Resolved anime.js keyframes TypeError
- **Build Errors**: Fixed missing peer dependencies

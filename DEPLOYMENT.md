# Panduan Deployment (Railway + Vercel)

Panduan lengkap untuk deploy aplikasi Toko Besi Serta Guna ke cloud.

> **Stack**: Laravel 10 + React 18 + Vite 8 + PostgreSQL

---

## Bagian 1: Deploy Backend ke Railway

### Step-by-Step:

1. **Login**: [railway.app](https://railway.app/) → login dengan GitHub.

2. **Buat Project**: "New Project" → "Deploy from GitHub repo" → pilih `Tugas_kerja_praktik`.

3. **Root Directory**: Set ke `/backend`.

4. **Tambahkan Database**:
   - "New" → "Database" → "PostgreSQL"
   - Copy variabel koneksi database

5. **Environment Variables** (service backend):

   | Variable | Value |
   |----------|-------|
   | `APP_KEY` | Copy dari local `.env` |
   | `APP_ENV` | `production` |
   | `APP_DEBUG` | `false` |
   | `APP_URL` | `https://your-backend.up.railway.app` |
   | `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` |
   | `SANCTUM_TOKEN_EXPIRATION` | `10080` |
   | `FILESYSTEM_DISK` | `public` |

6. **Deploy** → tunggu build selesai.

7. **Migrate Database**:
   ```bash
   # Via Railway CLI
   railway run php artisan migrate --force
   railway run php artisan db:seed
   railway run php artisan storage:link
   ```

---

## Bagian 2: Deploy Frontend ke Vercel

### Step-by-Step:

1. **Login**: [vercel.com](https://vercel.com) → login dengan GitHub.

2. **Import Project**: "Add New" → "Project" → pilih repo.

3. **Project Settings**:

   | Setting | Value |
   |---------|-------|
   | Framework Preset | **Vite** |
   | Root Directory | `frontend` |
   | Build Command | `npm run build` |
   | Output Directory | **`dist`** (bukan `build`!) |

4. **Environment Variables**:

   | Name | Value |
   |------|-------|
   | `VITE_BACKEND_URL` | `https://your-backend.up.railway.app` |

   > ⚠️ Prefix harus `VITE_` — URL **tanpa** `/api` di akhir

5. **Deploy** → tunggu build selesai (~1-2 menit).

---

## Bagian 3: Post-Deployment

### Backend Config Cache

```bash
railway run php artisan config:cache
railway run php artisan route:cache
```

### Verify CORS

Pastikan `CORS_ALLOWED_ORIGINS` di Railway match dengan URL Vercel:
```
https://your-app.vercel.app
```

CORS sudah dikonfigurasi via env var — tidak perlu edit kode.

---

## Bagian 4: Testing

1. **Cek Backend API**:
   ```
   GET https://your-backend.up.railway.app/api/transactions
   → Expected: 401 Unauthenticated (ini normal!)
   ```

2. **Cek Frontend**:
   - Buka URL Vercel
   - Login: `owner` / `owner123`

3. **Smoke Test**:
   - ✅ Dashboard loads → data transaksi tampil
   - ✅ Buat transaksi → stok terupdate
   - ✅ Settings → update profil + foto
   - ✅ User Management → approve/reject user
   - ✅ Reports → generate laporan
   - ✅ Dark mode toggle → smooth transition

---

## 🔧 Troubleshooting

### CORS Error

**Gejala**: Frontend ga bisa akses backend

**Fix**: Update env var `CORS_ALLOWED_ORIGINS` di Railway dengan URL Vercel yang benar. Restart service.

### Build Error di Vercel

**Gejala**: "dist not found" atau build gagal

**Fix**:
- Output Directory harus `dist` (bukan `build`)
- Framework Preset: `Vite`
- Check `package.json` punya `"build": "vite build"`

### Token Expired

**Gejala**: Auto-logout setelah beberapa hari

**Info**: Token expiry default 7 hari. Update `SANCTUM_TOKEN_EXPIRATION` di Railway kalau mau lebih lama (dalam menit).

### Database Connection Error

**Gejala**: "SQLSTATE[HY000] [2002]"

**Fix**: Pastikan env database dari Railway PostgreSQL sudah ter-copy dengan benar.

---

## 📋 Checklist Deployment

### Pre-Deployment
- [ ] `npm run build` berhasil lokal (0 errors)
- [ ] `.env.example` up to date
- [ ] Git committed & pushed

### Backend (Railway)
- [ ] PostgreSQL database created
- [ ] Environment variables set (termasuk `CORS_ALLOWED_ORIGINS`)
- [ ] `php artisan migrate --force` berhasil
- [ ] `php artisan storage:link` berhasil
- [ ] API responding (GET /api/transactions → 401)

### Frontend (Vercel)
- [ ] Output Directory = `dist`
- [ ] `VITE_BACKEND_URL` set
- [ ] Build successful
- [ ] Website loads

### Post-Deployment
- [ ] Login berhasil
- [ ] Dashboard loads dengan data
- [ ] Transaksi bisa dibuat
- [ ] Profile picture bisa diupload
- [ ] Dark mode works
- [ ] No console errors

---

**Version**: 3.0.0  
**Last Updated**: April 2026  
**Platforms**: Railway + Vercel

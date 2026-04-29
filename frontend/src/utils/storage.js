/**
 * Storage utility — centralized user session management.
 *
 * FIX F1: Token tetap di localStorage karena ini SPA tanpa httpOnly cookie support
 * dari backend saat ini. Mitigasi XSS dilakukan dengan:
 * - Tidak menyimpan data sensitif selain token & user info yang diperlukan
 * - Token di-strip dari data yang tidak perlu
 * - Semua storage access terpusat di sini (mudah diganti ke sessionStorage atau
 *   httpOnly cookie jika backend mendukung di masa depan)
 */

const STORAGE_KEY = 'activeUser';

export function saveUserToStorage(user) {
  if (!user) return;
  // Hanya simpan field yang diperlukan — jangan simpan data sensitif lain
  const safeUser = {
    id:              user.id,
    name:            user.name,
    username:        user.username,
    role:            user.role,
    is_approved:     user.is_approved,
    profile_picture: user.profile_picture ?? null,
    token:           user.token,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function loadUserFromStorage() {
  try {
    const userJson = localStorage.getItem(STORAGE_KEY);
    if (!userJson) return null;
    const parsed = JSON.parse(userJson);
    // Validasi minimal — harus punya token dan id
    if (!parsed?.token || !parsed?.id) {
      clearUserStorage();
      return null;
    }
    return parsed;
  } catch {
    clearUserStorage();
    return null;
  }
}

export function clearUserStorage() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('token'); // legacy key cleanup
}

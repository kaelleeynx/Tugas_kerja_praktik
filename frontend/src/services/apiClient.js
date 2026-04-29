import axios from 'axios';

const getBaseUrl = () => {
  const backendUrl = import.meta?.env?.VITE_BACKEND_URL;
  if (backendUrl) {
    return `${backendUrl}/api`;
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  // Production: VITE_BACKEND_URL must be set via environment variable
  console.error('[apiClient] VITE_BACKEND_URL is not set. API calls will fail.');
  return '/api';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  // 15s timeout — enough for slow dev server, short enough to not block UI
  timeout: 15000,
});

// ─── Interceptors ─────────────────────────────────────────────────────────

// Attach Bearer token from localStorage on every request
apiClient.interceptors.request.use(
  (config) => {
    const userData = localStorage.getItem('activeUser');
    if (userData) {
      try {
        const { token } = JSON.parse(userData);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Corrupted storage, ignore
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses — global error handling
let logoutCallback = null;

export const setLogoutCallback = (cb) => {
  logoutCallback = cb;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 401 — Token expired or invalid → auto-logout
    if (status === 401) {
      localStorage.removeItem('activeUser');
      localStorage.removeItem('token');
      if (logoutCallback) {
        logoutCallback();
      }
    }

    // FIX F3: 403 — Forbidden, 429 — Rate limited, 500 — Server error
    // Normalize error message agar komponen tidak perlu handle sendiri
    if (status === 403) {
      error.userMessage = 'Anda tidak memiliki izin untuk melakukan tindakan ini.';
    } else if (status === 429) {
      error.userMessage = 'Terlalu banyak permintaan. Coba lagi beberapa saat.';
    } else if (status >= 500) {
      error.userMessage = 'Terjadi kesalahan server. Coba lagi nanti.';
    } else if (!error.response) {
      // Network error — no response at all
      error.userMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    }

    return Promise.reject(error);
  }
);

export default apiClient;

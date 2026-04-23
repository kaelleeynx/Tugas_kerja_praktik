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
  // TODO: Update to KP production URL when deployed
  return 'http://localhost:8000/api';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// --- Interceptors ---

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

// Handle responses — unwrap data, handle 401 auto-logout
let logoutCallback = null;

export const setLogoutCallback = (cb) => {
  logoutCallback = cb;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect
      localStorage.removeItem('activeUser');
      localStorage.removeItem('token');
      if (logoutCallback) {
        logoutCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

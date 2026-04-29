// Environment-based configuration (Vite)
const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback logic based on hostname
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Production: VITE_BACKEND_URL must be set
  console.error('[config] VITE_BACKEND_URL is not set. API calls will fail in production.');
  return '';
};

const config = {
  apiUrl: getBackendUrl(),
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  appName: import.meta.env.VITE_APP_NAME || 'Toko Besi Serta Guna',
  env: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;
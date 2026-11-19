import axios from 'axios';

const productionFallback = 'https://university-club-management-system.onrender.com';

export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  (process.env.NODE_ENV === 'production' ? productionFallback : 'http://localhost:8000');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '';

    // Only clear the session for genuine authentication failures.
    if (status === 401 && (message.includes('Unauthorized') || message.toLowerCase().includes('token'))) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/admin') {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Turn a relative upload path into an absolute URL against the API host.
 * Handles legacy values that already include `/uploads`.
 */
export const resolveAssetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (clean.startsWith('/uploads/')) return `${API_BASE_URL}${clean}`;
  return `${API_BASE_URL}/uploads${clean}`;
};

export default api;

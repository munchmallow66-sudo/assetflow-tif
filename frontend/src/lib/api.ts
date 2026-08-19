import axios from 'axios';
import { CSRF_COOKIE, CSRF_HEADER } from './csrf';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  // The session travels as an httpOnly cookie, so the browser has to be told to
  // attach credentials. Nothing here reads or stores the token: it is not
  // reachable from script by design.
  withCredentials: true,
});

const SAFE_METHODS = ['get', 'head', 'options'];

function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Echo the CSRF cookie back in a header. A cross-origin page can cause the
// browser to send the cookie but cannot read it, so it cannot produce this.
api.interceptors.request.use(
  (config) => {
    const method = (config.method || 'get').toLowerCase();
    if (!SAFE_METHODS.includes(method)) {
      const csrfToken = readCsrfToken();
      if (csrfToken) {
        config.headers[CSRF_HEADER] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const requestUrl = error.config?.url || '';
      // Exclude the login endpoint so a failed sign-in renders its error in the UI
      if (!requestUrl.includes('/auth/login')) {
        const isPublicPath =
          window.location.pathname === '/login' ||
          window.location.pathname === '/' ||
          window.location.pathname.startsWith('/scan');

        // Clearing local state is the browser's job now: the cookie is httpOnly,
        // so a full navigation lets the middleware expire it and redirect.
        if (!isPublicPath) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;


import axios from 'axios';
import { store } from '../store/store';
import { setAccessToken, clearCredentials } from '../store/authSlice';

const API_URL = (import.meta.env.VITE_SPRING_API_URL || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

const AUTH_ENDPOINTS = ['/user/login', '/user/logout', '/user/refresh'];

// Attach access token from Redux store to every request
api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh queue to prevent concurrent refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      const url = originalRequest?.url || '';
      const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) => url.includes(ep));

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/user/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;
        store.dispatch(setAccessToken(newToken));
        scheduleTokenRefresh(data.expiresIn);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(clearCredentials());
        window.dispatchEvent(new Event('app:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Proactive token refresh — schedules a refresh 1 minute before expiry
let refreshTimer = null;

export function scheduleTokenRefresh(expiresInMs) {
  clearScheduledRefresh();

  const refreshIn = expiresInMs - 60000; // 1 minute before expiry
  if (refreshIn <= 0) return;

  refreshTimer = setTimeout(async () => {
    try {
      const { data } = await axios.post(
        `${API_URL}/user/refresh`,
        {},
        { withCredentials: true }
      );
      store.dispatch(setAccessToken(data.accessToken));
      scheduleTokenRefresh(data.expiresIn);
    } catch {
      store.dispatch(clearCredentials());
      window.dispatchEvent(new Event('app:logout'));
    }
  }, refreshIn);
}

export function clearScheduledRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

export default api;

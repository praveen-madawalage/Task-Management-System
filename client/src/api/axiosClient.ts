import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send/receive the refresh-token cookie
});

// Access token lives in memory only (not localStorage) to limit XSS exposure.
let accessToken: string | null = null;
export const setAccessToken = (token: string | null) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;

// Called when a refresh ultimately fails, so AuthContext can clear state.
let onLogout: (() => void) | null = null;
export const registerOnLogout = (fn: (() => void) | null) => {
  onLogout = fn;
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// Single-flight refresh: concurrent 401s share one /refresh call.
let refreshing: Promise<string | null> | null = null;

const doRefresh = async (): Promise<string | null> => {
  try {
    const res = await axios.post<{ accessToken: string }>(
      `${API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true },
    );
    setAccessToken(res.data.accessToken);
    return res.data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthCall = url.includes('/api/auth/refresh') || url.includes('/api/auth/login');

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      if (!refreshing) {
        refreshing = doRefresh().finally(() => {
          refreshing = null;
        });
      }
      const token = await refreshing;
      if (token) {
        // The request interceptor re-attaches the fresh token on retry.
        return api(original);
      }
      if (onLogout) onLogout();
    }

    return Promise.reject(error);
  },
);

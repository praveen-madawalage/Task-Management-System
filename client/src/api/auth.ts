import { api } from './axiosClient';
import type { User } from '../types';

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export const login = (email: string, password: string) =>
  api.post<LoginResponse>('/api/auth/login', { email, password }).then((r) => r.data);

export const logout = () => api.post('/api/auth/logout').then((r) => r.data);

export const refresh = () =>
  api.post<{ accessToken: string }>('/api/auth/refresh').then((r) => r.data);

export const getMe = () => api.get<{ user: User }>('/api/auth/me').then((r) => r.data.user);

export const changePassword = (currentPassword: string, newPassword: string) =>
  api
    .post<{ message: string; accessToken: string }>('/api/auth/change-password', {
      currentPassword,
      newPassword,
    })
    .then((r) => r.data);

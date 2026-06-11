import { api } from './axiosClient';
import type { Role, User } from '../types';

export interface UserListParams {
  search?: string;
  role?: Role | '';
  isActive?: '' | 'true' | 'false';
}

// Drop empty filters so we never send role='' (which the API would reject).
const buildParams = (p: UserListParams) => {
  const out: Record<string, string> = {};
  if (p.search) out.search = p.search;
  if (p.role) out.role = p.role;
  if (p.isActive) out.isActive = p.isActive;
  return out;
};

export const listUsers = (params: UserListParams) =>
  api.get<{ users: User[] }>('/api/users', { params: buildParams(params) }).then((r) => r.data.users);

export interface CreateUserInput {
  name: string;
  email: string;
  role: Role;
}

export const createUser = (input: CreateUserInput) =>
  api.post<{ user: User; emailSent: boolean }>('/api/users', input).then((r) => r.data);

export interface UpdateUserInput {
  name?: string;
  role?: Role;
}

export const updateUser = (id: string, input: UpdateUserInput) =>
  api.patch<{ user: User }>(`/api/users/${id}`, input).then((r) => r.data.user);

export const setUserStatus = (id: string, isActive: boolean) =>
  api.patch<{ user: User }>(`/api/users/${id}/status`, { isActive }).then((r) => r.data.user);

export type AssignableUser = Pick<User, 'id' | 'name' | 'email'>;

// Available to admins and project managers (for assignee pickers).
export const listAssignableUsers = () =>
  api.get<{ users: AssignableUser[] }>('/api/users/assignable').then((r) => r.data.users);

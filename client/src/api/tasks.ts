import { api } from './axiosClient';
import type { Task, TaskPriority, TaskStatus, User } from '../types';

export interface TaskListParams {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string; // 'me' or a user id
  search?: string;
  sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'status';
  order?: 'asc' | 'desc';
}

const buildParams = (p: TaskListParams) => {
  const out: Record<string, string> = {};
  if (p.projectId) out.projectId = p.projectId;
  if (p.status) out.status = p.status;
  if (p.priority) out.priority = p.priority;
  if (p.assignedTo) out.assignedTo = p.assignedTo;
  if (p.search) out.search = p.search;
  if (p.sortBy) out.sortBy = p.sortBy;
  if (p.order) out.order = p.order;
  return out;
};

export const listTasks = (params: TaskListParams) =>
  api.get<{ tasks: Task[] }>('/api/tasks', { params: buildParams(params) }).then((r) => r.data.tasks);

export const getTask = (id: string) =>
  api.get<{ task: Task }>(`/api/tasks/${id}`).then((r) => r.data.task);

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
  assigneeIds?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

export const createTask = (input: CreateTaskInput) =>
  api.post<{ task: Task }>('/api/tasks', input).then((r) => r.data.task);

export const updateTask = (id: string, input: UpdateTaskInput) =>
  api.patch<{ task: Task }>(`/api/tasks/${id}`, input).then((r) => r.data.task);

export const updateTaskStatus = (id: string, status: TaskStatus) =>
  api.patch<{ task: Task }>(`/api/tasks/${id}/status`, { status }).then((r) => r.data.task);

export const deleteTask = (id: string) =>
  api.delete<{ message: string }>(`/api/tasks/${id}`).then((r) => r.data);

export const addAssignee = (id: string, userId: string) =>
  api.post<{ assignees: User[] }>(`/api/tasks/${id}/assignees`, { userId }).then((r) => r.data.assignees);

export const removeAssignee = (id: string, userId: string) =>
  api.delete<{ assignees: User[] }>(`/api/tasks/${id}/assignees/${userId}`).then((r) => r.data.assignees);

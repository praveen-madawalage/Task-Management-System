import type { Role, TaskPriority, TaskStatus } from './types';

export const ROLES: Role[] = ['admin', 'project_manager', 'collaborator'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  collaborator: 'Collaborator',
};

export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'completed'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
};

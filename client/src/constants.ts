import type { Role, TaskPriority, TaskStatus } from './types';

export const ROLES: Role[] = ['admin', 'project_manager', 'collaborator'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  project_manager: 'Project Manager',
  collaborator: 'Collaborator',
};

export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high'];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const PRIORITY_COLOR: Record<TaskPriority, 'default' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'warning',
  high: 'error',
};

// Preset swatches for the quick "add label" control on task cards.
export const PRESET_LABEL_COLORS = [
  '#E11D48',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#0EA5E9',
  '#6B7280',
];

export const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'completed'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
};

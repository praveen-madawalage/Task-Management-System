export type Role = 'admin' | 'project_manager' | 'collaborator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  must_reset_password: boolean;
  created_at?: string;
  updated_at?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface ProjectCreator {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: ProjectCreator | null;
  task_count?: number;
  completed_count?: number;
}

export interface Label {
  id: string;
  project_id: string;
  created_by: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  created_by: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assignees?: User[];
  labels?: Label[];
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: User;
}

export interface Attachment {
  id: string;
  task_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  created_at: string;
  uploader?: User;
}

export type NotificationType =
  | 'task_assigned'
  | 'status_changed'
  | 'comment_added'
  | 'deadline_approaching'
  | 'admin_update';

export interface AppNotification {
  id: string;
  user_id: string;
  task_id: string | null;
  type: NotificationType;
  message: string;
  is_read: boolean;
  is_delivered: boolean;
  created_at: string;
}

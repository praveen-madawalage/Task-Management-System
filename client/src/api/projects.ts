import { api } from './axiosClient';
import type { Project } from '../types';

export const listProjects = () =>
  api.get<{ projects: Project[] }>('/api/projects').then((r) => r.data.projects);

export const getProject = (id: string) =>
  api.get<{ project: Project }>(`/api/projects/${id}`).then((r) => r.data.project);

export interface ProjectInput {
  title: string;
  description?: string;
}

export const createProject = (input: ProjectInput) =>
  api.post<{ project: Project }>('/api/projects', input).then((r) => r.data.project);

export const updateProject = (id: string, input: ProjectInput) =>
  api.patch<{ project: Project }>(`/api/projects/${id}`, input).then((r) => r.data.project);

export const deleteProject = (id: string) =>
  api.delete<{ message: string }>(`/api/projects/${id}`).then((r) => r.data);

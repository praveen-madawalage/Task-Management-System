import { api } from './axiosClient';
import type { Label } from '../types';

export const listProjectLabels = (projectId: string) =>
  api.get<{ labels: Label[] }>(`/api/projects/${projectId}/labels`).then((r) => r.data.labels);

export interface LabelInput {
  name: string;
  color: string;
}

export const createLabel = (projectId: string, input: LabelInput) =>
  api.post<{ label: Label }>(`/api/projects/${projectId}/labels`, input).then((r) => r.data.label);

export const updateLabel = (id: string, input: Partial<LabelInput>) =>
  api.patch<{ label: Label }>(`/api/labels/${id}`, input).then((r) => r.data.label);

export const deleteLabel = (id: string) =>
  api.delete<{ message: string }>(`/api/labels/${id}`).then((r) => r.data);

export const addLabelToTask = (taskId: string, labelId: string) =>
  api.post<{ labels: Label[] }>(`/api/tasks/${taskId}/labels`, { labelId }).then((r) => r.data.labels);

export const removeLabelFromTask = (taskId: string, labelId: string) =>
  api.delete<{ labels: Label[] }>(`/api/tasks/${taskId}/labels/${labelId}`).then((r) => r.data.labels);

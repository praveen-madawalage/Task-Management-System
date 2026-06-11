import { api } from './axiosClient';
import type { Comment } from '../types';

export const listComments = (taskId: string) =>
  api.get<{ comments: Comment[] }>(`/api/tasks/${taskId}/comments`).then((r) => r.data.comments);

export const addComment = (taskId: string, content: string) =>
  api.post<{ comment: Comment }>(`/api/tasks/${taskId}/comments`, { content }).then((r) => r.data.comment);

export const deleteComment = (id: string) =>
  api.delete<{ message: string }>(`/api/comments/${id}`).then((r) => r.data);

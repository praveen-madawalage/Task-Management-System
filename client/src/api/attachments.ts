import { api } from './axiosClient';
import type { Attachment } from '../types';

export const listAttachments = (taskId: string) =>
  api.get<{ attachments: Attachment[] }>(`/api/tasks/${taskId}/attachments`).then((r) => r.data.attachments);

export const uploadAttachment = (taskId: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  // axios sets the multipart boundary automatically for FormData bodies.
  return api.post<{ attachment: Attachment }>(`/api/tasks/${taskId}/attachments`, form).then((r) => r.data.attachment);
};

export const deleteAttachment = (id: string) =>
  api.delete<{ message: string }>(`/api/attachments/${id}`).then((r) => r.data);

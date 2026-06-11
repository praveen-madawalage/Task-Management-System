import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as attachmentsApi from '../api/attachments';

export const useTaskAttachments = (taskId: string, enabled: boolean) =>
  useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => attachmentsApi.listAttachments(taskId),
    enabled,
  });

export const useUploadAttachment = (taskId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => attachmentsApi.uploadAttachment(taskId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', taskId] }),
  });
};

export const useDeleteAttachment = (taskId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attachmentsApi.deleteAttachment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attachments', taskId] }),
  });
};

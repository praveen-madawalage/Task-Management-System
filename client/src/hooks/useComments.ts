import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as commentsApi from '../api/comments';

export const useTaskComments = (taskId: string, enabled: boolean) =>
  useQuery({ queryKey: ['comments', taskId], queryFn: () => commentsApi.listComments(taskId), enabled });

export const useAddComment = (taskId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => commentsApi.addComment(taskId, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  });
};

export const useDeleteComment = (taskId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commentsApi.deleteComment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  });
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '../api/notifications';

export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.listNotifications(false) });

export const useMarkRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

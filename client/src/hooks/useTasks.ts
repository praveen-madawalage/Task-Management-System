import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as tasksApi from '../api/tasks';
import type { CreateTaskInput, UpdateTaskInput } from '../api/tasks';
import type { Task, TaskStatus } from '../types';

export const useProjectTasks = (projectId: string) =>
  useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => tasksApi.listTasks({ projectId }),
  });

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.createTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => tasksApi.updateTask(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Optimistic status change so the board reacts instantly to a drag.
export const useUpdateTaskStatus = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => tasksApi.updateTaskStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['tasks', projectId] });
      const previous = qc.getQueryData<Task[]>(['tasks', projectId]);
      if (previous) {
        qc.setQueryData<Task[]>(
          ['tasks', projectId],
          previous.map((t) => (t.id === id ? { ...t, status } : t)),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['tasks', projectId], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
};

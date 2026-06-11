import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as projectsApi from '../api/projects';
import type { ProjectInput } from '../api/projects';

export const useProjects = () =>
  useQuery({ queryKey: ['projects'], queryFn: projectsApi.listProjects });

export const useProject = (id: string | undefined) =>
  useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getProject(id as string),
    enabled: Boolean(id),
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => projectsApi.createProject(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProjectInput }) => projectsApi.updateProject(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

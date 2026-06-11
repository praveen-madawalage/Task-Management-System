import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as labelsApi from '../api/labels';
import type { LabelInput } from '../api/labels';

export const useProjectLabels = (projectId: string) =>
  useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => labelsApi.listProjectLabels(projectId),
  });

export const useCreateLabel = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LabelInput) => labelsApi.createLabel(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels', projectId] });
    },
  });
};

export const useUpdateLabel = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<LabelInput> }) => labelsApi.updateLabel(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels', projectId] });
      qc.invalidateQueries({ queryKey: ['tasks'] }); // label text/color may show on cards
    },
  });
};

export const useDeleteLabel = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => labelsApi.deleteLabel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels', projectId] });
      qc.invalidateQueries({ queryKey: ['tasks'] }); // deleting untags it from tasks
    },
  });
};

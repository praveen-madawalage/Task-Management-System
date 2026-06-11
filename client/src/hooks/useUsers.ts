import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as usersApi from '../api/users';
import type { CreateUserInput, UpdateUserInput, UserListParams } from '../api/users';

export const useUsers = (params: UserListParams) =>
  useQuery({ queryKey: ['users', params], queryFn: () => usersApi.listUsers(params) });

export const useAssignableUsers = () =>
  useQuery({ queryKey: ['users', 'assignable'], queryFn: usersApi.listAssignableUsers });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.createUser(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => usersApi.updateUser(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useSetUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => usersApi.setUserStatus(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

import type { ReactNode } from 'react';
import type { Role } from '../types';
import { useAuth } from '../context/AuthContext';

interface RoleGateProps {
  roles: Role[];
  children: ReactNode;
}

// Renders its children only if the current user's role is in `roles`.
export default function RoleGate({ roles, children }: RoleGateProps) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return null;
  return <>{children}</>;
}

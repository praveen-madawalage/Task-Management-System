import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../api/axiosClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Maintains a single authenticated WebSocket while a user is logged in, and
// refreshes the notifications query whenever the server pushes an update.
export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(API_URL, {
      auth: { token: getAccessToken() ?? '' },
      withCredentials: true,
    });
    socketRef.current = socket;

    // Use the freshest token on each reconnect attempt.
    socket.io.on('reconnect_attempt', () => {
      socket.auth = { token: getAccessToken() ?? '' };
    });

    const refresh = () => qc.invalidateQueries({ queryKey: ['notifications'] });
    socket.on('notification', refresh);
    socket.on('notifications:pending', refresh);

    // A project's tasks changed somewhere (new/edited task, status move, assignee
    // or label change). Refresh task lists + project cards; only currently-mounted
    // queries actually refetch, so this is cheap if you're not viewing it.
    const onTasksChanged = () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    };
    socket.on('tasks:changed', onTasksChanged);

    return () => {
      socket.off('notification', refresh);
      socket.off('notifications:pending', refresh);
      socket.off('tasks:changed', onTasksChanged);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, qc]);

  return <>{children}</>;
};

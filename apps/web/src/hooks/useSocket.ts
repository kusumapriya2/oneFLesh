// ============================================================
// OneFlesh — Socket.io Hook
// ============================================================

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore.js';
import { useNotificationStore } from '../stores/notificationStore.js';
import type { Notification } from '@oneflesh/shared';

const SOCKET_URL = import.meta.env['VITE_API_URL'] ?? 'http://localhost:4000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.info('Socket connected');
    });

    socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // ─── notification:new ──────────────────────────────────────
    socket.on('notification:new', (notification: Notification) => {
      useNotificationStore.getState().addNotification(notification);
      toast(`${notification.title} — ${notification.body}`, { duration: 5000 });
    });

    // ─── alliance:updated ──────────────────────────────────────
    socket.on('alliance:updated', (data: { allianceId: string; stage: number }) => {
      void queryClient.invalidateQueries({ queryKey: ['alliances'] });
      void queryClient.invalidateQueries({ queryKey: ['alliance', data.allianceId] });
      toast.success(`Alliance advanced to stage ${data.stage}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, accessToken, queryClient]);

  return socketRef;
}

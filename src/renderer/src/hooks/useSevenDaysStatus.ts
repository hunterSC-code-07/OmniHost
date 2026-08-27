import { useState, useCallback } from 'react';
import { useServerStore } from '../store/useServerStore';

// Hook for 7 Days to Die server status
export const useSevenDaysStatus = (serverId: number) => {
  const { servers, startServer: globalStart, stopServer: globalStop } = useServerStore();
  const [error, setError] = useState<string | null>(null);

  const server = servers.find(s => s.id === serverId);
  const status = server?.status === 'Online' ? 'running' : 'stopped';

  const fetchStatus = useCallback(async () => {
    // Status is now managed globally by useServerStore
  }, []);

  const startServer = useCallback(async () => {
    try {
      await globalStart(serverId);
    } catch (err: any) {
      setError(err.message || 'Failed to start server');
    }
  }, [serverId, globalStart]);

  const stopServer = useCallback(async () => {
    try {
      await globalStop(serverId);
    } catch (err: any) {
      setError(err.message || 'Failed to stop server');
    }
  }, [serverId, globalStop]);

  return { status, error, fetchStatus, startServer, stopServer };
};

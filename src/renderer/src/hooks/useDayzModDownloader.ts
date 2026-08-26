import { useEffect } from 'react';
import { useDayzModStore } from '../store/useDayzModStore';

export function useDayzModDownloader(activeServerId: number | null) {
  const { updatePendingProgress } = useDayzModStore();

  useEffect(() => {
    if (!activeServerId) return;

    // Listen to IPC events from main process regarding download progress
    window.api.onDownloadProgress(activeServerId, (percent: number, msg?: string) => {
      let currentModId: string | null = null;
      let cleanMsg = msg || '';
      
      const match = cleanMsg.match(/^\[MOD:(\d+)\]\s*(.*)$/);
      if (match) {
        currentModId = match[1];
        cleanMsg = match[2];
      }

      if (currentModId) {
        if (cleanMsg.includes('already downloaded')) {
          updatePendingProgress(activeServerId, currentModId, 100, 'Cached, waiting for batch...');
        } else {
          updatePendingProgress(activeServerId, currentModId, percent, cleanMsg);
        }
      }
    });

    return () => {
      // In OmniHost, listeners are often managed by Electron IPC removing them when a new one is set,
      // or we can just leave it since the IPC channel is keyed by activeServerId.
      // E.g. `window.api.removeDownloadProgress(activeServerId)` if it existed.
    };
  }, [activeServerId, updatePendingProgress]);
}

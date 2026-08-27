import { useState } from 'react';
import { useModalStore } from '../store/useModalStore';

export const useDayzMissions = (activeServerId: number | null) => {
  const [downloadingMission, setDownloadingMission] = useState<string | null>(null);

  const handleDownloadMission = async (modId: string) => {
    if (downloadingMission || !activeServerId) return;
    setDownloadingMission(modId);
    try {
      await window.api.dayz.downloadMission(activeServerId, modId);
    } catch (e: any) {
      console.error(e);
      useModalStore.getState().openDayzInfoModal('Failed to download mission files: ' + e.message);
    } finally {
      setDownloadingMission(null);
    }
  };

  const handleExtractLocalMission = async (modId: string, localMissionsPath: string) => {
    if (downloadingMission || !activeServerId) return;
    setDownloadingMission(modId);
    try {
      await window.api.dayz.extractLocalMission(activeServerId, localMissionsPath);
      useModalStore.getState().openDayzInfoModal('Mission files extracted and applied successfully!');
    } catch (e: any) {
      console.error(e);
      useModalStore.getState().openDayzInfoModal('Failed to extract mission files: ' + e.message);
    } finally {
      setDownloadingMission(null);
    }
  };

  return {
    downloadingMission,
    handleDownloadMission,
    handleExtractLocalMission
  };
};

import { useState } from 'react';

export const useDayzMissions = (activeServerId: number | null, setModalState: React.Dispatch<React.SetStateAction<any>>) => {
  const [downloadingMission, setDownloadingMission] = useState<string | null>(null);

  const handleDownloadMission = async (modId: string) => {
    if (downloadingMission || !activeServerId) return;
    setDownloadingMission(modId);
    try {
      await window.api.dayz.downloadMission(activeServerId, modId);
    } catch (e: any) {
      console.error(e);
      setModalState({ type: 'INFO', data: { message: 'Failed to download mission files: ' + e.message } });
    } finally {
      setDownloadingMission(null);
    }
  };

  const handleExtractLocalMission = async (modId: string, localMissionsPath: string) => {
    if (downloadingMission || !activeServerId) return;
    setDownloadingMission(modId);
    try {
      await window.api.dayz.extractLocalMission(activeServerId, localMissionsPath);
      setModalState({ type: 'INFO', data: { message: 'Mission files extracted and applied successfully!' } });
    } catch (e: any) {
      console.error(e);
      setModalState({ type: 'INFO', data: { message: 'Failed to extract mission files: ' + e.message } });
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

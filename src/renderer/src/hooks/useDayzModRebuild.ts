import { useState } from 'react';
import { useModalStore } from '../store/useModalStore';

export const useDayzModRebuild = (
  activeServerId: number | null
) => {
  const [isRebuilding, setIsRebuilding] = useState(false);
  const { openDayzRebuildConfirmModal, openDayzRebuildSuccessModal, openDayzInfoModal } = useModalStore.getState();

  const executeRebuildLoadOrder = async () => {
    setIsRebuilding(true);
    try {
      await window.api.dayz.rebuildModDependencies(activeServerId!);
      openDayzRebuildSuccessModal();
    } catch (e: any) {
      openDayzInfoModal('Failed to rebuild load order: ' + e.message);
    }
    setIsRebuilding(false);
  };

  const handleRebuildLoadOrder = () => {
    if (!activeServerId) return;
    openDayzRebuildConfirmModal(executeRebuildLoadOrder);
  };

  return {
    isRebuilding,
    handleRebuildLoadOrder
  };
};

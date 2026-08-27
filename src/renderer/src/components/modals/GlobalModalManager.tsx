import React from 'react';
import { useModalStore } from '../../store/useModalStore';
import { CreateServerModal } from './CreateServerModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { SteamLoginModal } from './SteamLoginModal';
import { DayzModals } from './DayzModals';

export const GlobalModalManager: React.FC = () => {
  const { 
    isCreateServerModalOpen, 
    closeCreateServerModal,
    serverToDeleteId,
    closeDeleteModal,
    steamLoginModalConfig,
    closeSteamLoginModal
  } = useModalStore();

  return (
    <>
      {isCreateServerModalOpen && (
        <CreateServerModal onClose={closeCreateServerModal} />
      )}
      
      {serverToDeleteId !== null && (
        <DeleteConfirmationModal
          serverId={serverToDeleteId}
          onClose={closeDeleteModal}
        />
      )}
      
      {steamLoginModalConfig.isOpen && (
        <SteamLoginModal
          action={steamLoginModalConfig.action}
          handleCreateServer={steamLoginModalConfig.callback}
          onClose={closeSteamLoginModal}
        />
      )}
      
      <DayzModals />
    </>
  );
};

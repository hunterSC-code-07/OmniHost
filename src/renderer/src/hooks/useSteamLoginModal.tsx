import { useState } from 'react';
import { SteamLoginModal } from '../components/modals/SteamLoginModal';

export const useSteamLoginModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [action, setAction] = useState<'create' | 'cache'>('create');
  const [createCallback, setCreateCallback] = useState<((credentials: any) => void) | null>(null);

  const openModal = (actionType: 'create' | 'cache', callback?: (credentials: any) => void) => {
    setAction(actionType);
    if (callback) setCreateCallback(() => callback);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setCreateCallback(null);
  };

  const ModalComponent = isOpen ? (
    <SteamLoginModal 
      action={action} 
      handleCreateServer={createCallback}
      onClose={closeModal} 
    />
  ) : null;

  return {
    openSteamLoginModal: openModal,
    SteamLoginModal: ModalComponent,
    isSteamLoginModalOpen: isOpen
  };
};

import React from 'react'
import { CreateServerModal } from './CreateServerModal'
import { SteamLoginModal } from './SteamLoginModal'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { TunnelModal } from './TunnelModal'
import { useModalStore } from '../../store/useModalStore'
import { useServerStore } from '../../store/useServerStore'

export const ModalsContainer: React.FC = () => {
  const { showCreateModal, showSteamLoginModal, serverToDelete, showTunnelModal } = useModalStore()

  const { activeServerId, servers } = useServerStore()

  const currentServer = servers.find((s) => s.id === activeServerId)
  const prevServerRef = React.useRef(currentServer)
  if (currentServer) {
    prevServerRef.current = currentServer
  }
  const activeServer = currentServer || prevServerRef.current

  return (
    <>
      {showCreateModal && <CreateServerModal />}
      {showSteamLoginModal && <SteamLoginModal />}
      {serverToDelete !== null && <DeleteConfirmationModal />}
      {showTunnelModal && activeServer?.game !== 'DayZ' && <TunnelModal />}
    </>
  )
}

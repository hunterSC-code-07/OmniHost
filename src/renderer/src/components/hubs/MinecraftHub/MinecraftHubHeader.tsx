import React, { useState } from 'react';
import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { useMinecraftHubStore } from '../../../store/useMinecraftHubStore';
import { TunnelModal } from '../../modals/TunnelModal';

export const MinecraftHubHeader: React.FC = () => {
  const { activeServerId, servers, setActiveServerId, startServer, stopServer, restartServer, deleteServer } = useServerStore();
  const activeServer = servers.find(s => s.id === activeServerId);
  const { tunnelStatus, tunnelIp, setTempTunnelIp } = useUiStore();
  const { isDarkMode, toggleDarkMode } = useMinecraftHubStore();
  
  if (!activeServer) return null;
  
  const [isTunnelModalOpen, setIsTunnelModalOpen] = useState(false);

  const handleStart = startServer;
  const handleStop = stopServer;
  const handleRestart = restartServer;
  const handleDelete = deleteServer;
  const handleTunnel = async () => {
    if (tunnelStatus === 'Offline' || tunnelStatus === '') {
      // @ts-ignore
      await window.api.system.startTunnel(tunnelIp, 'minecraft');
    } else if (tunnelStatus === 'Online') {
      // @ts-ignore
      await window.api.system.stopTunnel();
    }
  };

  return (
    <>
      <div className="flex justify-between items-center relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveServerId(null)} className="minecraft-btn flex items-center justify-center p-2" title="Back to Dashboard">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <h2 className="minecraft-title">{activeServer.name}</h2>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={toggleDarkMode} className="minecraft-btn flex items-center justify-center p-2.5" title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <span className="material-symbols-outlined text-[20px]">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <div className="flex">
            <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className={`minecraft-btn flex items-center justify-center ${tunnelStatus === 'Online' ? 'minecraft-btn-active' : ''}`} disabled={tunnelStatus === 'Starting...'}>
              <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
            </button>
            <button onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} className="minecraft-btn flex items-center justify-center ml-1" title="Tunnel IP Settings">
              <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
            </button>
          </div>
          <button onClick={() => handleDelete(activeServer.id)} className="minecraft-btn minecraft-btn-red font-bold">
            <span className="relative z-10">DELETE</span>
          </button>
          <button onClick={() => activeServer.status === 'Online' ? handleStop(activeServer.id) : handleStart(activeServer.id)} className={`minecraft-btn font-bold ${activeServer.status === 'Online' ? 'minecraft-btn-red' : 'minecraft-btn-green'}`}>
            <span className="relative z-10">{activeServer.status === 'Online' ? 'STOP' : 'START'}</span>
          </button>
          <button onClick={() => handleRestart(activeServer.id)} className="minecraft-btn minecraft-btn-green font-bold">
            <span className="relative z-10">RESTART</span>
          </button>
        </div>
      </div>
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </>
  );
};

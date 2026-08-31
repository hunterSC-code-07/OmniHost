import React, { useState } from 'react';
import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { TunnelModal } from '../../modals/TunnelModal';

export const TerrariaHubHeader: React.FC = () => {
  const { tunnelStatus, tunnelIp, setTempTunnelIp } = useUiStore();
  const { activeServerId, servers, startServer, stopServer, restartServer, deleteServer, setActiveServerId } = useServerStore();
  const activeServer = servers.find(s => s.id === activeServerId);

  const [isTunnelModalOpen, setIsTunnelModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!activeServer) return null;

  const handleStart = startServer;
  const handleStop = stopServer;
  const handleRestart = restartServer;
  const handleDelete = deleteServer;

  const handleTunnel = async () => {
    if (tunnelStatus === 'Offline' || tunnelStatus === '') {
      // @ts-ignore
      await window.api.system.startTunnel(tunnelIp, 'terraria');
    } else if (tunnelStatus === 'Online') {
      // @ts-ignore
      await window.api.system.stopTunnel();
    }
  };

  const handleCopyIp = () => {
    navigator.clipboard.writeText(`${tunnelIp}:7777`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex justify-between items-center relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveServerId(null)} className="terraria-btn px-3 py-2" title="Back to Dashboard">
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </button>
          <h2 className="terraria-title">{activeServer.name}</h2>
        </div>

        <div className="flex gap-3 items-center">
          {tunnelStatus === 'Online' && tunnelIp && (
            <button 
              onClick={handleCopyIp}
              className="terraria-btn min-w-[120px] flex flex-col" 
              title="Click to copy IP"
            >
              {copied ? (
                <div className="flex items-center gap-1 h-full justify-center text-sm leading-tight">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Copied!
                </div>
              ) : (
                <>
                  <span className="text-sm leading-tight text-center group-hover:scale-105 transition-transform">{tunnelIp}</span>
                  <span className="text-[10px] uppercase tracking-widest text-center mt-0.5">Port: 7777</span>
                </>
              )}
            </button>
          )}
          <div className="flex gap-1">
            <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className="terraria-btn px-4">
              <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
            </button>
            <button onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} className="terraria-btn px-3" title="Tunnel IP Settings">
              <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
            </button>
          </div>
          <button onClick={() => handleDelete(activeServer.id)} className="terraria-btn terraria-btn-red">
            DELETE
          </button>
          <button onClick={() => activeServer.status === 'Online' ? handleStop(activeServer.id) : handleStart(activeServer.id)} className={`terraria-btn ${activeServer.status === 'Online' ? 'terraria-btn-red' : 'terraria-btn-green'}`}>
            {activeServer.status === 'Online' ? 'STOP' : 'START'}
          </button>
          <button onClick={() => handleRestart(activeServer.id)} className="terraria-btn">
            RESTART
          </button>
        </div>
      </div>
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </>
  );
};

import React, { useState } from 'react';
import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { TunnelModal } from '../../modals/TunnelModal';

export const MinecraftHubHeader: React.FC = () => {
  const { activeServerId, servers, setActiveServerId, startServer, stopServer, restartServer, deleteServer } = useServerStore();
  const activeServer = servers.find(s => s.id === activeServerId);
  const { tunnelStatus, tunnelIp, setTempTunnelIp } = useUiStore();
  
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
          <button onClick={() => setActiveServerId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10 flex items-center justify-center group" title="Back to Dashboard">
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </button>
          <h2 className="text-2xl font-bold text-white drop-shadow-md">{activeServer.name}</h2>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex glass-panel rounded-lg overflow-hidden transition-all duration-300 ease-out hover:border-white/30 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className={`relative overflow-hidden group px-4 py-2.5 transition-all flex items-center justify-center ${tunnelStatus === 'Online' ? 'bg-brand/10 text-brand hover:bg-brand/20' : tunnelStatus === 'Starting...' ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
              <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
            </button>
            <button onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} className="px-3 border-l border-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center" title="Tunnel IP Settings">
              <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
            </button>
          </div>
          <button onClick={() => handleDelete(activeServer.id)} className="relative overflow-hidden group glass-panel px-6 py-2.5 rounded-lg font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
            <span className="relative z-10">DELETE</span>
          </button>
          <button onClick={() => activeServer.status === 'Online' ? handleStop(activeServer.id) : handleStart(activeServer.id)} className={`relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 ${activeServer.status === 'Online' ? 'hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300' : 'hover:border-green-500/60 hover:shadow-[0_8px_32px_rgba(74,222,128,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-green-400 hover:text-green-300'}`}>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
            <span className="relative z-10">{activeServer.status === 'Online' ? 'STOP' : 'START'}</span>
          </button>
          <button onClick={() => handleRestart(activeServer.id)} className="relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:border-brand/60 hover:shadow-[0_8px_32px_rgba(76,175,80,0.4),inset_0_1px_2px_rgba(255,255,255,0.4)] text-brand hover:text-green-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
            <span className="relative z-10">RESTART</span>
          </button>
        </div>
      </div>
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </>
  );
};

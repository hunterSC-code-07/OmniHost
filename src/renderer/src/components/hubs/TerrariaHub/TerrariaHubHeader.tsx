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
    navigator.clipboard.writeText(tunnelIp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex justify-between items-center relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveServerId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10 flex items-center justify-center group" title="Back to Dashboard">
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </button>
          <h2 className="text-2xl font-bold text-white drop-shadow-md">{activeServer.name}</h2>
          <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ml-2">Terraria</span>
        </div>

        <div className="flex gap-3 items-center">
          {tunnelStatus === 'Online' && tunnelIp && (
            <button 
              onClick={handleCopyIp}
              className="px-4 py-2 min-w-[120px] flex flex-col justify-center items-center text-brand font-bold bg-brand/5 border border-brand/20 rounded-lg shadow-sm hover:bg-brand/10 transition-colors cursor-pointer group" 
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
                  <span className="text-[10px] text-brand/70 uppercase tracking-widest text-center mt-0.5">Port: 7777</span>
                </>
              )}
            </button>
          )}
          <div className="flex glass-panel rounded-lg overflow-hidden transition-all duration-300 ease-out hover:border-white/30 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className={`relative overflow-hidden group px-4 py-2.5 transition-all flex items-center justify-center ${tunnelStatus === 'Online' ? 'bg-brand/10 text-brand hover:bg-brand/20' : tunnelStatus === 'Starting...' ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
              <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
            </button>
            <button onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} className="px-3 border-l border-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center" title="Tunnel IP Settings">
              <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
            </button>
          </div>
          <button onClick={() => handleDelete(activeServer.id)} className="relative overflow-hidden group glass-panel px-6 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
            <span className="relative z-10">DELETE</span>
          </button>
          <button onClick={() => activeServer.status === 'Online' ? handleStop(activeServer.id) : handleStart(activeServer.id)} className={`relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 ${activeServer.status === 'Online' ? 'hover:border-red-500/60 text-red-400 hover:text-red-300 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2)]' : 'hover:border-green-500/60 text-green-400 hover:text-green-300 hover:shadow-[0_8px_32px_rgba(34,197,94,0.2)]'}`}>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
            <span className="relative z-10">{activeServer.status === 'Online' ? 'STOP' : 'START'}</span>
          </button>
          <button onClick={() => handleRestart(activeServer.id)} className="relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-brand/60 text-brand hover:text-green-300 hover:shadow-[0_8px_32px_rgba(34,197,94,0.2)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
            <span className="relative z-10">RESTART</span>
          </button>
        </div>
      </div>
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}
    </>
  );
};

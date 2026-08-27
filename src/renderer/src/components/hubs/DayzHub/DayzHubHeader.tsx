import React, { useState } from 'react';
import { useServerStore } from '../../../store/useServerStore';
import { useUiStore } from '../../../store/useUiStore';
import { useDayzHubContext } from '../../../contexts/DayzHubContext';
export const DayzHubHeader: React.FC = () => {
  const { activeServer } = useDayzHubContext();
  const { radminIp } = useUiStore();
  const { setActiveServerId, startServer, stopServer, restartServer, deleteServer } = useServerStore();

  if (!activeServer) return null;

  const handleStart = startServer;
  const handleStop = stopServer;
  const handleRestart = restartServer;
  const handleDelete = deleteServer;

  const handleRadminClick = async () => {
    const isInstalled = await window.api.system.radminCheck();
    if (isInstalled) {
      await window.api.system.radminOpen();
    } else {
      await window.api.system.radminInstall();
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
          <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ml-2">DayZ</span>
        </div>

        <div className="flex gap-3 items-center">
          <div className="flex glass-panel rounded-lg overflow-hidden transition-all duration-300 hover:border-white/30 hover:-translate-y-1 hover:scale-105">
            {radminIp && (
              <div className="px-4 py-2.5 flex items-center justify-center text-brand font-bold text-sm bg-brand/5 border-r border-white/10" title="Radmin VPN IP (Share with friends)">
                IP: {radminIp}
              </div>
            )}
            <button onClick={handleRadminClick} title="Open Radmin VPN" className="relative overflow-hidden group px-4 py-2.5 transition-all flex items-center justify-center text-brand hover:bg-brand/10">
              <span className="material-symbols-outlined text-[20px] leading-none">lan</span>
            </button>
          </div>
          <button onClick={() => handleDelete(activeServer.id)} className="relative overflow-hidden group glass-panel px-6 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
            <span className="relative z-10">DELETE</span>
          </button>
          <button onClick={() => activeServer.status === 'Online' ? handleStop(activeServer.id) : handleStart(activeServer.id)} className={`relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 ${activeServer.status === 'Online' ? 'hover:border-red-500/60 text-red-400 hover:text-red-300 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2)]' : 'hover:border-green-500/60 text-green-400 hover:text-green-300 hover:shadow-[0_8px_32px_rgba(74,222,128,0.2)]'}`}>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
            <span className="relative z-10">{activeServer.status === 'Online' ? 'STOP' : 'START'}</span>
          </button>
          <button onClick={() => handleRestart(activeServer.id)} className="relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:border-brand/60 text-brand hover:text-green-300 hover:shadow-[0_8px_32px_rgba(74,222,128,0.2)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
            <span className="relative z-10">RESTART</span>
          </button>
        </div>
      </div>
    </>
  );
};

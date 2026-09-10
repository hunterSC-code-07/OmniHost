import React from 'react';
import { useServerStore } from '../../../../store/useServerStore';

export const SonsOfTheForestOverviewTab: React.FC = () => {
  const { activeServerId, servers } = useServerStore();
  const activeServer = servers.find(s => s.id === activeServerId);

  if (!activeServer) return null;

  return (
    <div className="absolute inset-0 flex flex-col p-4 min-h-0 bg-transparent gap-4">
      <div className="sotf-section-header shrink-0">SERVER STATUS</div>
      
      <div className="flex-1 flex flex-col bg-[var(--sotf-panel)] border border-[var(--sotf-border)] overflow-hidden min-h-0 p-8 items-center justify-center">
        
        <div className="flex flex-col items-center gap-6">
          <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${activeServer.status === 'Online' ? 'border-[var(--sotf-highlight)]' : 'border-[var(--sotf-border)]'}`}>
            <span className={`material-symbols-outlined text-[64px] ${activeServer.status === 'Online' ? 'text-[var(--sotf-highlight)]' : 'text-[var(--sotf-text-dim)]'}`}>
              {activeServer.status === 'Online' ? 'public' : 'public_off'}
            </span>
          </div>
          
          <div className="text-center">
            <h2 className="text-4xl sotf-glitch-text-strong uppercase mb-2">{activeServer.status}</h2>
            <p className="text-[var(--sotf-text-dim)] font-bold tracking-widest uppercase">
              {activeServer.status === 'Online' ? 'SERVER IS RUNNING' : 'SERVER IS OFFLINE'}
            </p>
          </div>
        </div>

        <div className="w-full max-w-2xl mt-16 grid grid-cols-2 gap-8 border-t border-[var(--sotf-border)] pt-8">
          <div className="flex flex-col items-center">
            <span className="text-[var(--sotf-text-dim)] font-bold uppercase tracking-widest text-sm mb-2">MAX PLAYERS</span>
            <span className="text-2xl font-bold text-white">8</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[var(--sotf-text-dim)] font-bold uppercase tracking-widest text-sm mb-2">VERSION</span>
            <span className="text-2xl font-bold text-white">LATEST</span>
          </div>
        </div>
      </div>
    </div>
  );
};

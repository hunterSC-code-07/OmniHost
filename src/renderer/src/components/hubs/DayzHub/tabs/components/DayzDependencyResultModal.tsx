import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

import { useModalStore } from '../../../../../store/useModalStore';

export const DayzDependencyResultModal: React.FC = () => {
  const { dayzDependencyResultModal, closeDayzDependencyResultModal } = useModalStore();
  
  if (!dayzDependencyResultModal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface/95 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden relative">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 w-12 h-12 flex items-center justify-center rounded-xl border border-primary/30">
              <span className="material-symbols-outlined text-primary text-2xl">account_tree</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Mod Dependencies</h2>
              <p className="text-sm text-on-surface-variant">Dependencies for {dayzDependencyResultModal.modTitle}</p>
            </div>
          </div>
          <button 
            onClick={closeDayzDependencyResultModal} 
            className="w-10 h-10 rounded-full hover:bg-surface-bright/50 flex items-center justify-center text-on-surface-variant hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark' } }} className="flex-1 p-6">
          <div className="flex flex-col gap-3">
            {dayzDependencyResultModal.deps.map((dep: any) => (
              <div key={dep.id} className="bg-surface-bright/20 border border-outline-variant/30 rounded-xl p-4 flex justify-between items-center hover:bg-surface-bright/40 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{dep.title}</span>
                  <span className="text-xs text-on-surface-variant">ID: {dep.id}</span>
                </div>
                <div className="flex gap-2">
                  {dep.isInstalled ? (
                    dep.isDisabled ? (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">warning</span>
                        INSTALLED (DISABLED)
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                        INSTALLED & ENABLED
                      </span>
                    )
                  ) : (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">cancel</span>
                      NOT INSTALLED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};

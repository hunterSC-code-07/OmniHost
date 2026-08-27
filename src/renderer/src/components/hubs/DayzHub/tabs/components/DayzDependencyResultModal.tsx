import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

import { useModalStore } from '../../../../../store/useModalStore';

export const DayzDependencyResultModal: React.FC = () => {
  const { dayzDependencyResultModal, closeDayzDependencyResultModal } = useModalStore();
  
  if (!dayzDependencyResultModal.isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#121212] border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.15)] rounded-xl w-full max-w-2xl max-h-full flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">account_tree</span>
            Dependencies for {dayzDependencyResultModal.modTitle}
          </h2>
          <button onClick={closeDayzDependencyResultModal} className="text-gray-400 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark' } }} className="flex-1 p-6">
          <div className="flex flex-col gap-3">
            {dayzDependencyResultModal.deps.map((dep: any) => (
              <div key={dep.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{dep.title}</span>
                  <span className="text-xs text-gray-500">ID: {dep.id}</span>
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

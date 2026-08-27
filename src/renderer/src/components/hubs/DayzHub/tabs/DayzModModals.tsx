import React from 'react';

interface DayzModModalsProps {
  modalState: { type: string | null; data?: any };
  setModalState: React.Dispatch<React.SetStateAction<{ type: string | null; data?: any }>>;
  executeMissingDepsInstall: (deps: any[]) => void;
  executeUninstall: (modId: string) => void;
  executeRebuildLoadOrder: () => void;
  executeUninstallAll: () => void;
  modsCount: number;
}

export const DayzModModals: React.FC<DayzModModalsProps> = ({
  modalState,
  setModalState,
  executeMissingDepsInstall,
  executeUninstall,
  executeRebuildLoadOrder,
  executeUninstallAll,
  modsCount,
}) => {
  if (!modalState.type) return null;

  return (
    <>
      {/* INFO MODAL */}
      {modalState.type === 'INFO' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212]/80 border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)] rounded-xl w-full max-w-md flex flex-col overflow-hidden backdrop-blur-xl">
            <div className="flex items-center gap-3 p-6 border-b border-white/5 shrink-0 bg-blue-900/10">
              <span className="material-symbols-outlined text-blue-500 text-2xl">info</span>
              <h2 className="text-lg font-bold text-white">Notice</h2>
            </div>
            <div className="p-6 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {modalState.data?.message}
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end shrink-0 bg-black/20">
              <button
                onClick={() => setModalState({ type: null })}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-lg font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MISSING DEPS MODAL */}
      {modalState.type === 'MISSING_DEPS' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212]/80 border border-yellow-500/30 shadow-[0_0_30px_rgba(234,179,8,0.15)] rounded-xl w-full max-w-md flex flex-col overflow-hidden backdrop-blur-xl">
            <div className="flex items-center gap-3 p-6 border-b border-white/5 shrink-0 bg-yellow-900/10">
              <span className="material-symbols-outlined text-yellow-500 text-2xl">extension</span>
              <h2 className="text-lg font-bold text-white">Missing Dependencies</h2>
            </div>
            <div className="p-6 text-gray-300 text-sm leading-relaxed">
              This mod requires the following missing dependencies:
              <div className="mt-4 flex flex-wrap gap-2">
                {modalState.data?.depDetails?.map((dep: any) => (
                  <span key={dep.id} className="px-2 py-1 bg-yellow-900/20 border border-yellow-500/20 text-yellow-300 rounded text-xs font-bold">
                    {dep.title}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-gray-400">Do you want to install them automatically?</div>
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end gap-3 shrink-0 bg-black/20">
              <button
                onClick={() => setModalState({ type: null })}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeMissingDepsInstall(modalState.data?.depDetails)}
                className="bg-yellow-900/30 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-900/50 hover:border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.15)] px-6 py-2.5 rounded-lg font-bold transition-all"
              >
                Install Automatically
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNINSTALL SINGLE MODAL */}
      {modalState.type === 'UNINSTALL_SINGLE' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212]/80 border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.15)] rounded-xl w-full max-w-md flex flex-col overflow-hidden backdrop-blur-xl">
            <div className="flex items-center gap-3 p-6 border-b border-white/5 shrink-0 bg-red-900/10">
              <span className="material-symbols-outlined text-red-500 text-2xl">delete</span>
              <h2 className="text-lg font-bold text-white">Uninstall Mod</h2>
            </div>
            <div className="p-6 text-gray-300 text-sm leading-relaxed">
              Are you sure you want to uninstall <span className="text-white font-bold">{modalState.data?.modName}</span>?
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end gap-3 shrink-0 bg-black/20">
              <button
                onClick={() => setModalState({ type: null })}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeUninstall(modalState.data?.modId)}
                className="bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50 hover:border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.1)] px-6 py-2.5 rounded-lg font-bold transition-all"
              >
                Uninstall
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REBUILD CONFIRM MODAL */}
      {modalState.type === 'REBUILD_CONFIRM' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212]/80 border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.15)] rounded-xl w-full max-w-md flex flex-col overflow-hidden backdrop-blur-xl">
            <div className="flex items-center gap-3 p-6 border-b border-white/5 shrink-0 bg-red-900/10">
              <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
              <h2 className="text-lg font-bold text-white">Rebuild Load Order</h2>
            </div>
            <div className="p-6 text-gray-300 text-sm leading-relaxed">
              This will rebuild the dependency graph for all installed mods to ensure the server starts without crashing. It may take a minute if you have many mods. Proceed?
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end gap-3 shrink-0 bg-black/20">
              <button
                onClick={() => setModalState({ type: null })}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeRebuildLoadOrder}
                className="bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50 hover:border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.1)] px-6 py-2.5 rounded-lg font-bold transition-all"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REBUILD SUCCESS MODAL */}
      {modalState.type === 'REBUILD_SUCCESS' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212]/80 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)] rounded-xl w-full max-w-md flex flex-col overflow-hidden backdrop-blur-xl">
            <div className="flex items-center gap-3 p-6 border-b border-white/5 shrink-0 bg-green-900/10">
              <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
              <h2 className="text-lg font-bold text-white">Success</h2>
            </div>
            <div className="p-6 text-gray-300 text-sm leading-relaxed">
              Successfully rebuilt load order dependency graph!
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end shrink-0 bg-black/20">
              <button
                onClick={() => setModalState({ type: null })}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-lg font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNINSTALL ALL CONFIRM MODAL */}
      {modalState.type === 'UNINSTALL_ALL' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121212]/80 border border-red-500/50 shadow-[0_0_40px_rgba(220,38,38,0.2)] rounded-xl w-full max-w-md flex flex-col overflow-hidden backdrop-blur-xl">
            <div className="flex items-center gap-3 p-6 border-b border-white/5 shrink-0 bg-red-900/20">
              <span className="material-symbols-outlined text-red-500 text-2xl">delete_forever</span>
              <h2 className="text-lg font-bold text-white">Delete All Mods</h2>
            </div>
            <div className="p-6 text-gray-300 text-sm leading-relaxed">
              <span className="text-red-400 font-bold block mb-2">WARNING: You are about to uninstall ALL {modsCount} mods from this server.</span>
              Are you sure you want to proceed? This cannot be undone.
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end gap-3 shrink-0 bg-black/20">
              <button
                onClick={() => setModalState({ type: null })}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-lg font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeUninstallAll}
                className="bg-red-900/30 text-red-400 border border-red-500/50 hover:bg-red-900/50 hover:border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.15)] px-6 py-2.5 rounded-lg font-bold transition-all"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

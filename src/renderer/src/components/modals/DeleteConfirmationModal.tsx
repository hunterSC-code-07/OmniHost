import React from 'react';

export function DeleteConfirmationModal({
  serverToDelete,
  setServerToDelete,
  confirmDeleteServer,
  servers
}: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface/80 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative">
            
            {/* Glow effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-red-500/20 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="p-8 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]">
                  <span className="material-symbols-outlined text-3xl">warning</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-on-surface">Delete Server</h2>
                  <p className="text-on-surface-variant text-sm">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-on-surface-variant mb-8 leading-relaxed">
                Are you sure you want to permanently delete <span className="text-white font-bold">{servers.find(s => s.id === serverToDelete)?.name}</span>? All files, worlds, and configurations will be lost.
              </p>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setServerToDelete(null)}
                  className="px-5 py-2.5 rounded-lg font-bold text-on-surface-variant hover:text-white hover:bg-surface-bright/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteServer}
                  className="px-5 py-2.5 rounded-lg font-bold bg-[#050505]/60 backdrop-blur-xl border border-white/10 border-t-white/30 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] text-red-400 hover:text-red-300 hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}

import React from 'react';

export function TunnelModal({
  tempTunnelIp,
  setTempTunnelIp,
  setTunnelIp,
  setShowTunnelModal,
  showToast
}: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface/80 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative">
            <div className="p-6 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand/10 w-14 h-14 flex items-center justify-center rounded-xl border border-brand/30 shadow-[0_0_15px_rgba(76,175,80,0.2)]">
                  <span className="material-symbols-outlined text-brand text-3xl leading-none">cell_tower</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 drop-shadow-md">Tunnel Configuration</h2>
                  <p className="text-sm text-on-surface-variant">Set the remote IP address for FRP</p>
                </div>
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-bold text-on-surface-variant mb-2">Remote Server IP</label>
                <input 
                  type="text" 
                  value={tempTunnelIp}
                  onChange={(e) => setTempTunnelIp(e.target.value)}
                  placeholder="e.g. 34.131.235.17"
                  className="w-full bg-surface-container-lowest/50 border border-outline-variant/50 focus:border-brand/70 rounded-lg px-4 py-3 text-white outline-none transition-colors"
                />
                <p className="text-xs text-on-surface-variant/60 mt-2">
                  This IP will be used to generate the frpc.toml configuration. Changes take effect on the next tunnel start.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowTunnelModal(false)}
                  className="px-5 py-2.5 rounded-lg font-bold text-on-surface-variant hover:text-white hover:bg-surface-bright/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setTunnelIp(tempTunnelIp);
                    localStorage.setItem('tunnelIp', tempTunnelIp);
                    setShowTunnelModal(false);
                    showToast("Tunnel IP updated!");
                  }}
                  className="bg-brand/10 border border-brand/50 text-brand shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:bg-brand/20 px-6 py-2.5 rounded-lg font-bold transition-all uppercase tracking-wider text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}

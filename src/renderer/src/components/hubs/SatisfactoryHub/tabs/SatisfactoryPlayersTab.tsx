import React, { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useServerStore } from '../../../../store/useServerStore';
import { usePlayerStore } from '../../../../store/usePlayerStore';

export const SatisfactoryPlayersTab: React.FC = () => {
  const { activeServerId } = useServerStore();
  const { onlinePlayers } = usePlayerStore();
  const activePlayers = activeServerId ? (onlinePlayers[activeServerId.toString()] || []) : [];
  
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<null | 'success' | 'error'>(null);

  useEffect(() => {
    if (activeServerId && window.api.server.getSatisfactoryToken) {
      window.api.server.getSatisfactoryToken(activeServerId).then((t) => {
        if (t) setToken(t);
      }).catch(console.error);
    }
  }, [activeServerId]);

  const saveToken = async () => {
    if (!activeServerId) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      if (!window.api.server.saveSatisfactoryToken) {
        throw new Error('API not available, please restart the app');
      }
      const res = await window.api.server.saveSatisfactoryToken(activeServerId, token);
      if (res) setSaveStatus('success');
      else setSaveStatus('error');
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
    }
    setIsSaving(false);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="absolute inset-0 flex flex-col min-h-0 overflow-hidden outline-none">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              Player Tracking
              <span className="bg-[#fa9549]/20 text-[#fa9549] border border-[#fa9549]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                {activePlayers.length} Online
              </span>
            </h2>
            <p className="text-gray-400 mt-2 text-sm">Monitor players currently connected to the server.</p>
          </div>
        </div>

        <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md mb-6">
          <h3 className="text-lg font-bold text-white mb-4">HTTP API Integration</h3>
          <p className="text-sm text-gray-400 mb-4">
            Satisfactory 1.0 requires an API Token to track online players. To get one, launch the game, go to the <b>Server Manager</b> from the main menu, connect to your server, and click on the <b>Console</b> tab. Type <code className="bg-gray-800 px-2 py-1 rounded text-[#fa9549]">server.GenerateAPIToken</code> into the input box and press Enter.
          </p>
          <div className="flex gap-4">
            <input 
              type="password" 
              value={token} 
              onChange={e => setToken(e.target.value)}
              placeholder="Paste Bearer Token here..." 
              className="flex-1 bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-[#fa9549] shadow-inner font-mono text-sm"
            />
            <button 
              onClick={saveToken}
              disabled={isSaving}
              className="bg-[#fa9549] hover:bg-yellow-600 disabled:opacity-50 text-white px-6 py-2 rounded font-bold shadow-lg transition-colors flex items-center gap-2"
            >
              {isSaving ? 'Saving...' : 'Save Token'}
            </button>
          </div>
          {saveStatus === 'success' && <p className="text-green-400 text-sm mt-2">Token saved successfully!</p>}
          {saveStatus === 'error' && <p className="text-red-400 text-sm mt-2">Failed to save token.</p>}
          <p className="text-xs text-[#fa9549]/70 mt-4 italic">
            Note: The official Satisfactory 1.0 API only tracks the number of connected players, not their names. Players will appear as "Unknown Pioneer" when connected.
          </p>
        </div>

        <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md">
          <OverlayScrollbarsComponent 
            className="w-full max-h-[400px]"
            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
            defer
          >
            {activePlayers.length === 0 ? (
              <div className="text-center text-gray-500 py-12 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">person_off</span>
                <p>No players currently connected.</p>
                <p className="text-xs mt-2 text-gray-600">Ensure your server is running, the token is set, and players have joined.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {activePlayers.map((player: any, idx) => {
                  const pName = typeof player === 'string' ? player : (player.name || 'Unknown Pioneer');
                  return (
                    <div key={idx} className="bg-[#1a1a1a] border border-gray-800 p-4 rounded-xl flex items-center gap-4 transition-all hover:border-[#fa9549]/50">
                      <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-800">
                        <span className="material-symbols-outlined text-gray-500 text-[24px]">engineering</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-200">{pName}</h4>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </OverlayScrollbarsComponent>
        </div>
      </div>
    </div>
  );
};

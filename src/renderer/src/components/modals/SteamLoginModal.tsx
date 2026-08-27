import { useState, useEffect } from "react";

import { useUiStore } from '../../store/useUiStore';
import { useToastStore } from '../../store/useToastStore';

export function SteamLoginModal({ action, handleCreateServer, onClose }: any) {
  const { activeGameHub, setIsDayzCached, setIsSatisfactoryCached } = useUiStore();
  const { showToast } = useToastStore();
  
  const [steamUsername, setSteamUsername] = useState("");
  const [steamPassword, setSteamPassword] = useState("");
  const [isSteamGuardRequired, setIsSteamGuardRequired] = useState(false);
  const [steamGuardCode, setSteamGuardCode] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateSteamCache = async () => {
      try {
        setIsUpdating(true);
        const appId = activeGameHub === 'DayZ' ? 223350 : 1690800;
        // @ts-ignore
        await window.api.steam.updateCache(0, appId, steamUsername, steamPassword, steamGuardCode);
        showToast(`${activeGameHub} Base Files Updated Successfully!`);
        if (activeGameHub === 'DayZ') setIsDayzCached(true);
        if (activeGameHub === 'Satisfactory') setIsSatisfactoryCached(true);
        onClose();
      } catch (e: any) {
        if (e.message && e.message.includes('STEAM_GUARD_REQUIRED')) {
          setIsSteamGuardRequired(true);
          showToast("Steam Guard Code required!");
        } else {
          alert("Failed to update cache: " + e.message);
        }
      } finally {
        setIsUpdating(false);
      }
    };
    
  useEffect(() => {
      if (activeGameHub === 'DayZ') {
        // @ts-ignore
        window.api.steam.checkCache(223350).then(setIsDayzCached);
      } else if (activeGameHub === 'Satisfactory') {
        // @ts-ignore
        window.api.steam.checkCache(1690800).then(setIsSatisfactoryCached);
      }
    }, [activeGameHub, setIsDayzCached, setIsSatisfactoryCached]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] p-8 rounded-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.1)] w-full max-w-md relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-md">Steam Login Required</h2>
              <p className="text-sm text-gray-400 mb-6">
                To download the {activeGameHub} Server files, you must log into SteamCMD. Your credentials are only sent securely to Steam's servers and are not stored.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Steam Username</label>
                  <input 
                    type="text" 
                    value={steamUsername}
                    onChange={e => setSteamUsername(e.target.value)}
                    className="w-full bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand shadow-inner"
                    placeholder="Username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Steam Password</label>
                  <input 
                    type="password" 
                    value={steamPassword}
                    onChange={e => setSteamPassword(e.target.value)}
                    className="w-full bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
                {isSteamGuardRequired && (
                  <div>
                    <label className="block text-sm font-bold text-yellow-500 mb-1">Steam Guard Code</label>
                    <input 
                      type="text" 
                      value={steamGuardCode}
                      onChange={e => setSteamGuardCode(e.target.value)}
                      className="w-full bg-[#050505] border border-yellow-500/50 rounded p-2 text-white outline-none focus:border-yellow-500 shadow-inner"
                      placeholder="ABCDE"
                    />
                    <p className="text-xs text-yellow-500/70 mt-1">Check your email or Steam mobile app for the code.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => onClose()}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (action === 'create' && handleCreateServer) {
                      handleCreateServer({ steamUsername, steamPassword, steamGuardCode });
                    }
                    else handleUpdateSteamCache();
                  }}
                  disabled={!steamUsername || !steamPassword || (isSteamGuardRequired && !steamGuardCode) || isUpdating}
                  className="bg-brand hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                      Updating...
                    </>
                  ) : (
                    action === 'create' ? 'Login & Download' : 'Login & Update Cache'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}

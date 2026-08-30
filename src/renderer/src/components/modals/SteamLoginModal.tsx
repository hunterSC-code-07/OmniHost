import { useState, useEffect } from "react";
import { HUB_REGISTRY } from '../layout/HubRegistry';

import { useUiStore } from '../../store/useUiStore';
import { useToastStore } from '../../store/useToastStore';
import { useSteamCredentialsStore } from '../../store/useSteamCredentialsStore';

export function SteamLoginModal({ action, handleCreateServer, onClose }: any) {
  const { activeGameHub, setGameCacheStatus } = useUiStore();
  const { showToast } = useToastStore();
  const { steamCreds, rememberMe, setSteamCreds, setRememberMe, saveCredentials } = useSteamCredentialsStore();
  
  const [steamUsername, setSteamUsername] = useState(steamCreds.username || "");
  const [steamPassword, setSteamPassword] = useState("");
  const [isSteamGuardRequired, setIsSteamGuardRequired] = useState(false);
  const [steamGuardCode, setSteamGuardCode] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const saveCredsBeforeAction = () => {
    setSteamCreds({ username: steamUsername });
    saveCredentials(
      () => {}, 
      (msg) => showToast(msg, 'error')
    );
  };

  const handleUpdateSteamCache = async () => {
      try {
        setIsUpdating(true);
        saveCredsBeforeAction();
        
        if (!activeGameHub || !HUB_REGISTRY[activeGameHub]?.steamAppId) {
            throw new Error(`No Steam configuration for ${activeGameHub}`);
        }
        
        const appId = HUB_REGISTRY[activeGameHub].steamAppId;
        
        // @ts-ignore
        await window.api.steam.updateCache(0, appId, steamUsername, steamPassword, steamGuardCode);
        showToast(`${activeGameHub} Base Files Updated Successfully!`);
        
        setGameCacheStatus(activeGameHub, true);
        
        onClose();
      } catch (e: any) {
        if (e.message && e.message.includes('STEAM_GUARD_REQUIRED')) {
          setIsSteamGuardRequired(true);
          showToast("Steam Guard Code required!");
        } else if (e.message && e.message.includes('INVALID_CREDENTIALS')) {
          showToast("Invalid Username or Password!", "error");
        } else {
          showToast("Failed to update cache: " + e.message, "error");
        }
      } finally {
        setIsUpdating(false);
      }
    };
    
  useEffect(() => {
      if (activeGameHub && HUB_REGISTRY[activeGameHub]?.steamAppId) {
        // @ts-ignore
        window.api.steam.checkCache(HUB_REGISTRY[activeGameHub].steamAppId).then((isCached) => {
            setGameCacheStatus(activeGameHub, isCached);
        });
      }
    }, [activeGameHub, setGameCacheStatus]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] p-8 rounded-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.1)] w-full max-w-md relative">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-md">Steam Login Required</h2>
              <p className="text-sm text-gray-400 mb-6">
                To download the {activeGameHub} Server files, you must log into SteamCMD. Your credentials are only sent securely to Steam's servers and are not stored. If you've logged in before, you can leave the password blank to use your cached session.
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
                  <label className="block text-sm font-bold text-gray-400 mb-1">Steam Password <span className="text-xs text-gray-600 font-normal">(Optional if cached)</span></label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={steamPassword}
                      onChange={e => setSteamPassword(e.target.value)}
                      className="w-full bg-[#050505] border border-gray-800 rounded p-2 pr-10 text-white outline-none focus:border-brand shadow-inner"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors flex items-center justify-center p-1"
                      tabIndex={-1}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility' : 'visibility_off'}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-brand bg-[#050505] border-gray-800"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-400 cursor-pointer hover:text-white transition-colors">
                    Remember Username for cached logins
                  </label>
                </div>

                {isSteamGuardRequired && (
                  <div>
                    <label className="block text-sm font-bold text-yellow-500 mb-1 mt-4">Steam Guard Code</label>
                    <input 
                      type="text" 
                      value={steamGuardCode}
                      onChange={e => setSteamGuardCode(e.target.value)}
                      className="w-full bg-[#050505] border border-yellow-500/50 rounded p-2 text-white outline-none focus:border-yellow-500 shadow-inner"
                      placeholder="ABCDE"
                    />
                    <p className="text-xs text-yellow-500/70 mt-1">Check your email for the code. If you approved via mobile push, leave this blank and click Login again.</p>
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
                      saveCredsBeforeAction();
                      handleCreateServer({ steamUsername, steamPassword, steamGuardCode });
                    }
                    else handleUpdateSteamCache();
                  }}
                  disabled={!steamUsername || isUpdating}
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

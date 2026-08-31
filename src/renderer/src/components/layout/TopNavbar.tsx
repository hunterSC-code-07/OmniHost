import React from 'react';
import { useServerStore } from '../../store/useServerStore';
import { useUiStore } from '../../store/useUiStore';
import { useToastStore } from '../../store/useToastStore';
import { SettingsModal } from '../modals/SettingsModal';
import { useState } from 'react';

const getGameThemeColor = (game: string | null) => {
  if (!game) return { omni: '#ffffff', host: '#cccccc' };
  const g = game.toLowerCase();
  if (g.includes('minecraft')) return { omni: '#4ade80', host: '#bbf7d0' };
  if (g.includes('palworld')) return { omni: '#3b82f6', host: '#bfdbfe' };
  if (g.includes('dayz')) return { omni: '#ef4444', host: '#fecaca' };
  if (g.includes('satisfactory')) return { omni: '#eab308', host: '#fef08a' };
  return { omni: '#ffffff', host: '#cccccc' };
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const TopNavbar: React.FC = () => {
  const { activeServerId, setActiveServerId } = useServerStore();
  const { 
    activeGameHub, 
    lastGameHub, 
    setActiveGameHub, 
    isClearingCache, 
    setIsClearingCache, 
    cacheSizes, 
    setCacheSizes 
  } = useUiStore();
  const { showToast } = useToastStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCacheMenuOpen, setIsCacheMenuOpen] = useState(false);
  const [cacheToClear, setCacheToClear] = useState<{ id: string, name: string, warning: string } | null>(null);

  const fetchCacheSizes = async () => {
    try {
      // @ts-ignore
      const sizes = await window.api.system.getDetailedCacheInfo();
      setCacheSizes(sizes);
    } catch (e) {
      console.error('Failed to fetch cache sizes', e);
    }
  };

  React.useEffect(() => {
    fetchCacheSizes();
  }, [setCacheSizes]);

  const totalCacheSize = Object.values(cacheSizes).reduce((acc, curr) => acc + curr, 0);

  const handleClearSpecificCache = async (cacheId: string) => {
    setIsClearingCache(true);
    setCacheToClear(null);
    try {
      // @ts-ignore
      await window.api.system.clearSpecificCache(cacheId);
      await fetchCacheSizes();
      showToast('Cache successfully cleared!');
    } catch (e: any) {
      showToast(`Failed to clear cache: ${e.message || e}`);
    } finally {
      setIsClearingCache(false);
    }
  };

  const cacheOptions = [
    { id: 'minecraft', name: 'Minecraft Files', size: cacheSizes.minecraft, warning: 'This will delete downloaded server jars and CurseForge mods. They will be re-downloaded automatically when needed.' },
    { id: 'dayzBase', name: 'DayZ Server Files', size: cacheSizes.dayzBase, warning: 'This deletes the cached DayZ dedicated server files. New servers will require a full download from SteamCMD.' },
    { id: 'dayzWorkshop', name: 'DayZ Workshop Mods', size: cacheSizes.dayzWorkshop, warning: 'This deletes the downloaded DayZ workshop mods cache. SteamCMD will be forced to redownload all mods next time you update a server.' },
    { id: 'satisfactoryBase', name: 'Satisfactory Server Files', size: cacheSizes.satisfactoryBase, warning: 'This deletes the cached Satisfactory dedicated server files. New servers will require a full download from SteamCMD.' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#121212] to-[#050505] z-40 border-b border-white/5 shadow-lg [-webkit-app-region:drag]">
      <div className="h-full px-gutter w-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-default group">
            <h1 className="text-[34px] leading-none tracking-tight font-bold flex items-center whitespace-nowrap transition-transform duration-300 group-hover:scale-105" style={{ fontFamily: '"Oswald", sans-serif' }}>
              <span 
                className={`mr-2 logo-sweep ${activeGameHub ? 'active' : ''}`}
                style={{ '--logo-default-color': '#ffffff', '--logo-game-color': getGameThemeColor(activeGameHub || lastGameHub).omni } as React.CSSProperties}
              >
                Omni
              </span>
              <span 
                className={`logo-sweep ${activeGameHub ? 'active' : ''}`}
                style={{ '--logo-default-color': '#cccccc', '--logo-game-color': getGameThemeColor(activeGameHub || lastGameHub).host } as React.CSSProperties}
              >
                Host
              </span>
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => { setActiveServerId(null); setActiveGameHub(null); }} className={`flex items-center gap-2 font-bold transition-all [-webkit-app-region:no-drag] ${activeServerId === null && activeGameHub === null ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
              <span className="font-label-md text-label-md">Dashboard</span>
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-6 mr-[150px]">
          <button onClick={() => setIsSettingsOpen(true)} className="relative overflow-hidden group px-2.5 py-2 rounded-lg border bg-surface/40 border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all flex items-center justify-center [-webkit-app-region:no-drag]">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 ease-out whitespace-nowrap ml-0 group-hover:ml-2 text-sm font-semibold opacity-0 group-hover:opacity-100">
              Settings
            </span>
          </button>
          
          {activeServerId === null && activeGameHub === null && (
            <div className="relative">
              <button 
                onClick={() => setIsCacheMenuOpen(!isCacheMenuOpen)} 
                disabled={isClearingCache} 
                className={`relative overflow-hidden group px-2.5 py-2 rounded-lg border bg-surface/40 border-outline-variant/30 text-on-surface-variant hover:text-red-400 hover:border-red-500/50 transition-all flex items-center justify-center [-webkit-app-region:no-drag] ${isCacheMenuOpen ? 'text-red-400 border-red-500/50' : ''}`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isClearingCache ? 'animate-spin' : ''}`}>
                  {isClearingCache ? 'sync' : 'delete'}
                </span>
                <span className="max-w-0 overflow-hidden group-hover:max-w-[200px] transition-all duration-300 ease-out whitespace-nowrap ml-0 group-hover:ml-2 text-sm font-semibold opacity-0 group-hover:opacity-100">
                  Clear {formatBytes(totalCacheSize)}
                </span>
              </button>
              
              {isCacheMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40 [-webkit-app-region:no-drag]" onClick={() => setIsCacheMenuOpen(false)}></div>
                  <div className="absolute top-full right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2 min-w-[250px] animate-in fade-in slide-in-from-top-2 duration-200 [-webkit-app-region:no-drag]">
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-1">
                      Available Caches
                    </div>
                    {cacheOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setCacheToClear(opt);
                          setIsCacheMenuOpen(false);
                        }}
                        disabled={opt.size === 0}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors flex justify-between items-center group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="text-gray-300 group-hover:text-white font-medium">{opt.name}</span>
                        <span className="text-xs text-gray-500 group-hover:text-red-400">{formatBytes(opt.size)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
      
      {cacheToClear && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-white/10 rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-red-500">warning</span>
                </div>
                <h3 className="text-xl font-bold text-white">Clear {cacheToClear.name}</h3>
              </div>
              <p className="text-gray-400 leading-relaxed text-sm">
                You are about to delete <span className="text-white font-bold">{formatBytes(cacheOptions.find(o => o.id === cacheToClear.id)?.size || 0)}</span> of cached data.
                <br/><br/>
                {cacheToClear.warning}
              </p>
            </div>
            <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-black/40">
              <button
                onClick={() => setCacheToClear(null)}
                className="px-4 py-2 rounded font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClearSpecificCache(cacheToClear.id)}
                className="bg-red-500/20 border border-red-500/50 hover:bg-red-500 hover:text-white text-red-400 px-6 py-2 rounded font-bold shadow-lg transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

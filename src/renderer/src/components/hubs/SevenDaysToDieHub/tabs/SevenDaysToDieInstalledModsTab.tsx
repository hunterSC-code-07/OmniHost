import React, { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
interface Props {
  serverId: number;
}

interface Mod {
  folderName: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  path: string;
  dependencies?: string[];
  missingDependencies?: string[];
}

export const SevenDaysToDieInstalledModsTab: React.FC<Props> = ({ serverId }) => {
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMods = async () => {
    setLoading(true);
    // @ts-ignore
    const installedMods = await window.api.sevenDaysToDie.getMods(serverId);
    setMods(installedMods);
    setLoading(false);
  };

  useEffect(() => {
    fetchMods();
  }, [serverId]);

  const toggleMod = async (folderName: string, enabled: boolean) => {
    // @ts-ignore
    const success = await window.api.sevenDaysToDie.toggleMod(serverId, folderName, !enabled);
    if (success) {
      fetchMods();
    }
  };

  const deleteMod = async (folderName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${folderName}?`)) return;
    // @ts-ignore
    const success = await window.api.sevenDaysToDie.deleteMod(serverId, folderName);
    if (success) {
      fetchMods();
    }
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden sevendays-ui min-h-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="sevendays-title text-3xl mb-1">INSTALLED MODS</h2>
        </div>
        <button 
          onClick={fetchMods}
          className="sevendays-btn px-6 py-2 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
          REFRESH
        </button>
      </div>
      
      <div className="flex-1 min-h-0">
        <OverlayScrollbarsComponent 
            className="flex-1 min-h-0 h-full bg-[var(--7dtd-bg-panel-dark)] border border-[var(--7dtd-border)] p-6" 
            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
            defer
        >
        {loading ? (
          <div className="p-8 text-center text-white/50 animate-pulse sevendays-title">
            LOADING MODS...
          </div>
        ) : mods.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center h-full">
            <span className="material-symbols-outlined text-6xl text-[var(--7dtd-text-dim)] mb-4">extension_off</span>
            <h3 className="sevendays-title text-2xl mb-2">NO MODS INSTALLED</h3>
            <p className="text-[var(--7dtd-text-dim)] uppercase">Download mods from the Nexus Mods or Community Mods tabs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mods.map((mod) => (
              <div key={mod.folderName} className={`sevendays-panel flex flex-col p-5 border border-[var(--7dtd-border)] ${mod.enabled ? 'border-l-4 border-l-white bg-[var(--7dtd-bg-panel-light)]' : 'border-l-4 border-l-white/20 opacity-70'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="sevendays-title text-xl leading-tight truncate pr-2" title={mod.name}>{mod.name}</h3>
                    <div className="text-sm text-white/50 font-bold mt-1 uppercase">v{mod.version}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => toggleMod(mod.folderName, mod.enabled)}
                      className={`w-8 h-8 flex items-center justify-center border transition-colors ${mod.enabled ? 'bg-white/20 border-white text-white' : 'bg-transparent border-[var(--7dtd-border)] text-[var(--7dtd-text-dim)] hover:text-white hover:border-white/50'}`}
                      title={mod.enabled ? 'Disable Mod' : 'Enable Mod'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {mod.enabled ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </button>
                    <button 
                      onClick={() => deleteMod(mod.folderName)}
                      className="w-8 h-8 flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete Mod"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-[var(--7dtd-text-dim)] line-clamp-2 uppercase">{mod.description || 'NO DESCRIPTION'}</p>
                
                {mod.missingDependencies && mod.missingDependencies.length > 0 && (
                  <div className="mt-4 bg-red-500/20 border border-red-500/50 p-3 text-xs text-red-100">
                    <div className="font-bold mb-1 flex items-center gap-1 sevendays-title">
                      <span className="material-symbols-outlined text-[16px]">warning</span>
                      MISSING DEPENDENCIES
                    </div>
                    <ul className="list-disc list-inside uppercase pl-1">
                      {mod.missingDependencies.map(dep => <li key={dep}>{dep}</li>)}
                    </ul>
                  </div>
                )}
                
                <div className="mt-auto pt-4 border-t border-[var(--7dtd-border)] flex justify-between items-center text-xs text-[var(--7dtd-text-dim)] uppercase font-bold">
                  <span className="truncate" title={mod.folderName}>{mod.folderName}</span>
                  <span className="text-white shrink-0 ml-2">{mod.author}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};

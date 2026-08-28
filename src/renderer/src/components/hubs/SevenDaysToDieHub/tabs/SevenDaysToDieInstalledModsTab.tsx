import React, { useState, useEffect } from 'react';

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
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Installed Mods</h2>
          <p className="text-gray-400 text-sm">Manage your downloaded mods. Mods are dynamically loaded when the server starts.</p>
        </div>
        <button 
          onClick={fetchMods}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">refresh</span>
          Refresh List
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="glass-panel p-8 text-center text-gray-400 animate-pulse">
            Loading mods...
          </div>
        ) : mods.length === 0 ? (
          <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-6xl text-white/20 mb-4">extension_off</span>
            <h3 className="text-xl font-bold text-white mb-2">No Mods Installed</h3>
            <p className="text-gray-400">Download mods from the Nexus Mods or Community Mods tabs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mods.map((mod) => (
              <div key={mod.folderName} className={`glass-panel p-5 flex flex-col gap-3 transition-colors ${mod.enabled ? 'border-l-4 border-l-brand' : 'border-l-4 border-l-gray-600 opacity-60'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{mod.name}</h3>
                    <div className="text-xs text-brand font-mono mt-1">v{mod.version}</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => toggleMod(mod.folderName, mod.enabled)}
                      className={`p-1.5 rounded transition-colors ${mod.enabled ? 'bg-brand/20 text-brand hover:bg-brand/30' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                      title={mod.enabled ? 'Disable Mod' : 'Enable Mod'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {mod.enabled ? 'toggle_on' : 'toggle_off'}
                      </span>
                    </button>
                    <button 
                      onClick={() => deleteMod(mod.folderName)}
                      className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition-colors"
                      title="Delete Mod"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 line-clamp-2 mt-1">{mod.description || 'No description provided.'}</p>
                
                {mod.missingDependencies && mod.missingDependencies.length > 0 && (
                  <div className="mt-2 bg-red-500/10 border border-red-500/30 rounded p-2 text-xs text-red-400">
                    <div className="font-bold mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      Missing Dependencies:
                    </div>
                    <ul className="list-disc list-inside">
                      {mod.missingDependencies.map(dep => <li key={dep}>{dep}</li>)}
                    </ul>
                  </div>
                )}
                
                <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                  <span className="text-gray-500 truncate" title={mod.folderName}>{mod.folderName}</span>
                  <span className="text-gray-400 font-medium">{mod.author}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';

interface DayzInstalledModsHeaderPanelProps {
  mods: any[];
  loadInstalledMods: () => void;
  isRebuilding: boolean;
  handleRebuildLoadOrder: () => void;
  handleUninstallAll: () => void;
}

export const DayzInstalledModsHeaderPanel: React.FC<DayzInstalledModsHeaderPanelProps> = ({
  mods,
  loadInstalledMods,
  isRebuilding,
  handleRebuildLoadOrder,
  handleUninstallAll
}) => {

  return (
    <div className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between shadow-sm">
      <h2 className="text-lg font-bold text-white">Installed Mods ({mods.length})</h2>
      <div className="flex gap-2">
        {mods.length > 0 && (
          <button
            onClick={handleUninstallAll}
            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-colors flex items-center gap-2 text-sm font-bold shadow"
            title="Delete All Installed Mods"
          >
            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
            <span className="hidden sm:inline">Delete All</span>
          </button>
        )}
        <button
          onClick={handleRebuildLoadOrder}
          disabled={isRebuilding}
          className={`p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 transition-colors flex items-center gap-2 text-sm font-bold shadow ${isRebuilding ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Fix Load Order (Rebuild Cache)"
        >
          <span className="material-symbols-outlined text-[20px]">{isRebuilding ? 'sync' : 'account_tree'}</span>
          <span className="hidden sm:inline">{isRebuilding ? 'Rebuilding...' : 'Fix Load Order'}</span>
        </button>
        <button
          onClick={loadInstalledMods}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          title="Refresh"
        >
          <span className="material-symbols-outlined text-[20px] text-gray-300">refresh</span>
        </button>
      </div>
    </div>
  );
};

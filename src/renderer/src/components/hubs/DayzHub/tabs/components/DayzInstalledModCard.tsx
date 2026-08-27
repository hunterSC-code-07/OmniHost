import React from 'react';

interface DayzInstalledModCardProps {
  mod: any;
  handleToggleModStatus: (mod: any) => void;
  handleToggleMap: (folderName: string, isMap: boolean) => void;
  handleDownloadMission: (modId: string) => void;
  downloadingMission: string | null;
  handleExtractLocalMission: (modId: string, localMissionsPath: string) => void;
  handleCheckDependencies: (mod: any) => void;
  checkingDeps: string | null;
  openWorkshopPage: (id: string) => void;
  handleUninstall: (folderName: string, title: string) => void;
}

export const DayzInstalledModCard: React.FC<DayzInstalledModCardProps> = ({
  mod,
  handleToggleModStatus,
  handleToggleMap,
  handleDownloadMission,
  downloadingMission,
  handleExtractLocalMission,
  handleCheckDependencies,
  checkingDeps,
  openWorkshopPage,
  handleUninstall,
}) => {
  return (
    <div className={`bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border flex flex-col group transition-all relative shadow-lg ${mod.isDisabled ? 'border-red-500/30 opacity-75 grayscale-[50%]' : 'border-white/5 hover:border-red-500/30 hover:bg-black/50'}`}>
      {/* Mod Status Toggle (Top Right) */}
      <div className="absolute top-2 right-2 z-10 flex items-center bg-black/60 rounded-full pr-2 pl-1 py-1 gap-2">
        <div
          onClick={() => handleToggleModStatus(mod)}
          className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${mod.isDisabled ? 'bg-surface-container-highest' : 'bg-primary'}`}
        >
          <div className={`w-3 h-3 rounded-full bg-white transition-transform ${mod.isDisabled ? 'translate-x-0' : 'translate-x-4'}`} />
        </div>
        <span className={`text-[10px] font-bold ${mod.isDisabled ? 'text-gray-400' : 'text-primary'}`}>
          {mod.isDisabled ? 'DISABLED' : 'ENABLED'}
        </span>
      </div>

      {mod.isMap && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-lg z-10 border border-green-500/30">
          MAP
        </div>
      )}
      {mod.preview_url ? (
        <div
          className="h-32 bg-cover bg-center border-b border-white/5 group-hover:scale-105 transition-transform origin-bottom"
          style={{ backgroundImage: `url(${mod.preview_url})` }}
        />
      ) : (
        <div className="h-32 bg-black/40 border-b border-white/5 flex items-center justify-center group-hover:scale-105 transition-transform origin-bottom">
          <span className="material-symbols-outlined text-[48px] text-gray-500 opacity-30">extension</span>
        </div>
      )}
      <div className="p-4 flex flex-col flex-1 relative z-10 bg-inherit">
        <h3 className="font-bold text-white text-sm truncate mb-1 group-hover:text-red-300 transition-colors" title={mod.title}>{mod.title}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="text-[11px] text-gray-500 font-mono truncate bg-black/40 inline-block px-2 py-0.5 rounded border border-white/5" title={mod.folderName}>{mod.folderName}</div>
          {mod.id && String(mod.id) !== '0' && (
            <div className="text-[11px] text-gray-500 font-mono truncate bg-black/40 inline-block px-2 py-0.5 rounded border border-white/5" title={`Mod ID: ${mod.id}`}>ID: {mod.id}</div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {mod.tags && mod.tags.slice(0, 3).map((tag: any, idx: number) => (
            <span key={idx} className="px-1.5 py-0.5 bg-red-900/20 border border-red-500/20 text-red-300 rounded text-[10px] uppercase font-bold">
              {tag.tag}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2 mt-auto mb-3">
          <button
            onClick={() => handleToggleMap(mod.folderName, mod.isMap)}
            className={`text-xs py-1.5 px-3 rounded-lg border transition-colors ${mod.isMap ? 'border-primary text-primary bg-primary/10 hover:bg-primary/20' : 'border-white/10 text-on-surface-variant hover:bg-white/5'}`}
          >
            {mod.isMap ? 'Unmark as Map' : 'Mark as Map'}
          </button>

          {mod.isMap && ['2289456201', '1602372402', '2699824632', '2938009193'].includes(mod.id) && (
            <button
              onClick={() => handleDownloadMission(mod.id)}
              disabled={downloadingMission === mod.id}
              className="text-xs py-1.5 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-on-surface transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloadingMission === mod.id ? (
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary"></div>
              ) : (
                <span className="material-symbols-outlined text-[14px]">download</span>
              )}
              Download Mission
            </button>
          )}

          {mod.isMap && mod.hasLocalMissions && (
            <button
              onClick={() => handleExtractLocalMission(mod.id, mod.localMissionsPath)}
              disabled={downloadingMission === mod.id}
              className="text-xs py-1.5 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-container-high text-on-surface transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-primary/30 text-primary"
            >
              {downloadingMission === mod.id ? (
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-primary"></div>
              ) : (
                <span className="material-symbols-outlined text-[14px]">folder_zip</span>
              )}
              Extract Mission
            </button>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-white/5">
          {mod.file_size && (
            <span className="text-[10px] text-gray-400 font-mono">
              {(parseInt(mod.file_size) / 1024 / 1024).toFixed(1)} MB
            </span>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => handleCheckDependencies(mod)}
              disabled={checkingDeps === mod.id}
              className="text-[10px] font-bold text-gray-300 hover:text-red-400 transition-colors flex items-center gap-1 bg-white/5 hover:bg-red-500/10 px-2 py-1 rounded border border-white/10 hover:border-red-500/30 disabled:opacity-50"
            >
              {checkingDeps === mod.id ? (
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-red-500"></div>
              ) : (
                <span className="material-symbols-outlined text-[14px]">account_tree</span>
              )}
              CHECK DEPS
            </button>
            <button
              onClick={() => openWorkshopPage(mod.id)}
              className="text-[10px] font-bold text-gray-300 hover:text-red-400 transition-colors flex items-center gap-1 bg-white/5 hover:bg-red-500/10 px-2 py-1 rounded border border-white/10 hover:border-red-500/30"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              WORKSHOP
            </button>
            <button
              onClick={() => handleUninstall(mod.folderName || mod.id, mod.title || mod.folderName || 'this mod')}
              className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/20 hover:border-red-500/40"
              title="Uninstall Mod"
            >
              <span className="material-symbols-outlined text-[14px]">delete</span>
              DELETE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

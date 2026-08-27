import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { DayzPendingDownloadCard } from './DayzPendingDownloadCard';
import { DayzInstalledModCard } from './DayzInstalledModCard';

interface DayzInstalledModsGridPanelProps {
  mods: any[];
  loading: boolean;
  activeServerId: number | null;
  pendingDownloads: Record<number, Record<string, any>>;
  removePendingDownload: (serverId: number, modId: string) => void;
  downloadingMission: string | null;
  handleDownloadMission: (modId: string) => Promise<void> | void;
  handleExtractLocalMission: (modId: string, localMissionsPath: string) => Promise<void> | void;
  checkingDeps: string | null;
  handleCheckDependencies: (mod: any) => Promise<void> | void;
  handleToggleMap: (folderName: string, isMap: boolean) => Promise<void> | void;
  handleToggleModStatus: (mod: any) => Promise<void> | void;
  handleUninstall: (modId: string, modName: string) => void;
}

export const DayzInstalledModsGridPanel: React.FC<DayzInstalledModsGridPanelProps> = ({
  mods,
  loading,
  activeServerId,
  pendingDownloads,
  removePendingDownload,
  downloadingMission,
  handleDownloadMission,
  handleExtractLocalMission,
  checkingDeps,
  handleCheckDependencies,
  handleToggleMap,
  handleToggleModStatus,
  handleUninstall
}) => {
  const openWorkshopPage = (id: string) => {
    if (/^\d+$/.test(id)) {
      window.open(`https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`, '_blank');
    }
  };

  return (
    <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 p-6">
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
        </div>
      ) : mods.length === 0 && (!pendingDownloads || Object.keys(pendingDownloads).length === 0) ? (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-center">
          <span className="material-symbols-outlined text-[48px] opacity-50 mb-4 text-red-500/50">folder_off</span>
          <p className="font-bold text-lg text-white">No mods installed</p>
          <p className="text-sm opacity-70 mt-1">Install mods from the Workshop tab</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {activeServerId && pendingDownloads[activeServerId] && Object.values(pendingDownloads[activeServerId]).map((pending: any) => {
            const mod = pending.mod || pending;
            const isInstalled = mods.some(m => String(m.id) === String(mod.id || mod.publishedfileid));
            if (isInstalled) return null; // Prevent duplicate rendering if installed list is updated early

            return (
              <DayzPendingDownloadCard
                key={mod.id || mod.publishedfileid}
                pending={pending}
                activeServerId={activeServerId}
                removePendingDownload={removePendingDownload}
              />
            );
          })}

          {mods.map((mod, i) => (
            <DayzInstalledModCard
              key={i}
              mod={mod}
              handleToggleModStatus={handleToggleModStatus}
              handleToggleMap={handleToggleMap}
              handleDownloadMission={handleDownloadMission}
              downloadingMission={downloadingMission}
              handleExtractLocalMission={handleExtractLocalMission}
              handleCheckDependencies={handleCheckDependencies}
              checkingDeps={checkingDeps}
              openWorkshopPage={openWorkshopPage}
              handleUninstall={handleUninstall}
            />
          ))}
        </div>
      )}
    </OverlayScrollbarsComponent>
  );
};

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useDayzInstalledMods } from '../../../../hooks/useDayzInstalledMods';
import { useDayzMissions } from '../../../../hooks/useDayzMissions';
import { useDayzModDependencies } from '../../../../hooks/useDayzModDependencies';
import { useDayzModStatus } from '../../../../hooks/useDayzModStatus';
import { useDayzModUninstall } from '../../../../hooks/useDayzModUninstall';
import { useDayzModRebuild } from '../../../../hooks/useDayzModRebuild';
import { useSteamCredentials } from '../../../../hooks/useSteamCredentials';
import { useDayzModStore } from '../../../../store/useDayzModStore';
import { DayzInstalledModCard } from './components/DayzInstalledModCard';
import { DayzPendingDownloadCard } from './components/DayzPendingDownloadCard';
import { DayzSteamCredentialsForm } from './components/DayzSteamCredentialsForm';
import { DayzDependencyResultModal } from './components/DayzDependencyResultModal';

export const DayzInstalledModsTab: React.FC = () => {
  const { pendingDownloads, removePendingDownload } = useDayzModStore();

  const { mods, loading, setLoading, loadInstalledMods, activeServerId } = useDayzInstalledMods();
  const { steamCreds, setSteamCreds, rememberMe, setRememberMe, showCreds, setShowCreds, saveCredentials } = useSteamCredentials();
  
  const { downloadingMission, handleDownloadMission, handleExtractLocalMission } = useDayzMissions(activeServerId);
  
  const { installingDep, depProgress, checkingDeps, dependencyResult, setDependencyResult, handleInstallDependencies, executeMissingDepsInstall, handleCheckDependencies } = useDayzModDependencies(activeServerId, steamCreds, setShowCreds, loadInstalledMods, mods);
  
  const { handleToggleMap, handleToggleModStatus } = useDayzModStatus(activeServerId, mods, loadInstalledMods, executeMissingDepsInstall);
  
  const { handleUninstall, handleUninstallAll } = useDayzModUninstall(activeServerId, mods, loadInstalledMods, setLoading);
  
  const { isRebuilding, handleRebuildLoadOrder } = useDayzModRebuild(activeServerId);

  const openWorkshopPage = (id: string) => {
    if (/^\d+$/.test(id)) {
      window.open(`https://steamcommunity.com/sharedfiles/filedetails/?id=${id}`, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent font-body text-white">
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

      {installingDep && depProgress && (
        <div className="mx-4 my-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-primary">Installing Dependencies...</span>
            <span className="text-xs text-primary">{Math.round(depProgress.percent)}%</span>
          </div>
          <div className="text-xs text-on-surface-variant mb-2 truncate">{depProgress.msg}</div>
          <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${depProgress.percent}%` }}
            ></div>
          </div>
        </div>
      )}

      {showCreds && (
        <DayzSteamCredentialsForm
          steamCreds={steamCreds}
          setSteamCreds={setSteamCreds}
          rememberMe={rememberMe}
          setRememberMe={setRememberMe}
          setShowCreds={setShowCreds}
          saveCredentials={saveCredentials}
          handleInstallDependencies={handleInstallDependencies}
        />
      )}

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

      <DayzDependencyResultModal
        dependencyResult={dependencyResult}
        setDependencyResult={setDependencyResult}
      />
    </div>
  );
};

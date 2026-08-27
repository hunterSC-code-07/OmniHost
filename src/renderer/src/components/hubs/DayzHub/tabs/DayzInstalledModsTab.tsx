import React from 'react';
import { useSteamCredentialsStore } from '../../../../store/useSteamCredentialsStore';
import { DayzInstalledModsHeaderPanel } from './components/DayzInstalledModsHeaderPanel';
import { DayzInstalledModsGridPanel } from './components/DayzInstalledModsGridPanel';
import { DayzSteamCredentialsPanel } from './components/DayzSteamCredentialsPanel';

import { useDayzInstalledMods } from '../../../../hooks/useDayzInstalledMods';
import { useDayzModStore } from '../../../../store/useDayzModStore';
import { useDayzMissions } from '../../../../hooks/useDayzMissions';
import { useDayzModDependencies } from '../../../../hooks/useDayzModDependencies';
import { useDayzModStatus } from '../../../../hooks/useDayzModStatus';
import { useDayzModUninstall } from '../../../../hooks/useDayzModUninstall';
import { useDayzModRebuild } from '../../../../hooks/useDayzModRebuild';

export const DayzInstalledModsTab: React.FC = () => {
  const { showCreds } = useSteamCredentialsStore();

  const { mods, loading, activeServerId, loadInstalledMods, setLoading } = useDayzInstalledMods();
  const { pendingDownloads, removePendingDownload } = useDayzModStore();

  const { downloadingMission, handleDownloadMission, handleExtractLocalMission } = useDayzMissions(activeServerId);
  const { checkingDeps, handleCheckDependencies, executeMissingDepsInstall } = useDayzModDependencies(activeServerId, loadInstalledMods, mods);
  const { handleToggleMap, handleToggleModStatus } = useDayzModStatus(activeServerId, mods, loadInstalledMods, executeMissingDepsInstall);
  const { handleUninstall, handleUninstallAll } = useDayzModUninstall(activeServerId, mods, loadInstalledMods, setLoading);
  const { isRebuilding, handleRebuildLoadOrder } = useDayzModRebuild(activeServerId);

  return (
    <div className="flex flex-col h-full bg-transparent font-body text-white">
      <DayzInstalledModsHeaderPanel 
        mods={mods}
        loadInstalledMods={loadInstalledMods}
        isRebuilding={isRebuilding}
        handleRebuildLoadOrder={handleRebuildLoadOrder}
        handleUninstallAll={handleUninstallAll}
      />
      {showCreds && <DayzSteamCredentialsPanel />}
      <DayzInstalledModsGridPanel 
        mods={mods}
        loading={loading}
        activeServerId={activeServerId}
        pendingDownloads={pendingDownloads}
        removePendingDownload={removePendingDownload}
        downloadingMission={downloadingMission}
        handleDownloadMission={handleDownloadMission}
        handleExtractLocalMission={handleExtractLocalMission}
        checkingDeps={checkingDeps}
        handleCheckDependencies={handleCheckDependencies}
        handleToggleMap={handleToggleMap}
        handleToggleModStatus={handleToggleModStatus}
        handleUninstall={handleUninstall}
      />
    </div>
  );
};

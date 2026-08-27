import React from 'react';
import { useSteamCredentialsStore } from '../../../../store/useSteamCredentialsStore';
import { DayzInstalledModsHeaderPanel } from './components/DayzInstalledModsHeaderPanel';
import { DayzInstalledModsGridPanel } from './components/DayzInstalledModsGridPanel';
import { DayzSteamCredentialsPanel } from './components/DayzSteamCredentialsPanel';

import { useDayzInstalledMods } from '../../../../hooks/useDayzInstalledMods';

export const DayzInstalledModsTab: React.FC = () => {
  const { showCreds } = useSteamCredentialsStore();

  const { mods, loading, activeServerId, loadInstalledMods, setLoading } = useDayzInstalledMods();

  return (
    <div className="flex flex-col h-full bg-transparent font-body text-white">
      <DayzInstalledModsHeaderPanel 
        mods={mods}
        activeServerId={activeServerId}
        loadInstalledMods={loadInstalledMods}
        setLoading={setLoading}
      />
      {showCreds && <DayzSteamCredentialsPanel />}
      <DayzInstalledModsGridPanel 
        mods={mods}
        loading={loading}
        activeServerId={activeServerId}
        loadInstalledMods={loadInstalledMods}
        setLoading={setLoading}
      />
    </div>
  );
};

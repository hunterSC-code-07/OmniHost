import React from 'react';
import { useSteamCredentialsStore } from '../../../../store/useSteamCredentialsStore';
import { DayzInstalledModsHeaderPanel } from './components/DayzInstalledModsHeaderPanel';
import { DayzInstalledModsGridPanel } from './components/DayzInstalledModsGridPanel';
import { DayzSteamCredentialsPanel } from './components/DayzSteamCredentialsPanel';

export const DayzInstalledModsTab: React.FC = () => {
  const { showCreds } = useSteamCredentialsStore();

  return (
    <div className="flex flex-col h-full bg-transparent font-body text-white">
      <DayzInstalledModsHeaderPanel />
      {showCreds && <DayzSteamCredentialsPanel />}
      <DayzInstalledModsGridPanel />
    </div>
  );
};

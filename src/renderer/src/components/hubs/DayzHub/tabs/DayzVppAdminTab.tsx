import React, { useMemo } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useDayzInstalledMods } from '../../../../hooks/useDayzInstalledMods';
import { useServerStore } from '../../../../store/useServerStore';
import { DayzVppSuperAdminsPanel } from './components/DayzVppSuperAdminsPanel';
import { DayzVppCredentialsPanel } from './components/DayzVppCredentialsPanel';

export const DayzVppAdminTab: React.FC = () => {
  const { mods, loading } = useDayzInstalledMods();
  const { activeServerId } = useServerStore();

  // Check if VPPAdminTools is installed and enabled
  const vppAdminMod = useMemo(() => {
    return mods.find(
      (m) =>
        m.id === '1820430124' ||
        m.folderName?.toLowerCase() === '@vppadmintools' ||
        m.title?.toLowerCase().includes('vppadmintools')
    );
  }, [mods]);

  const isVppInstalledAndEnabled = !!vppAdminMod && !vppAdminMod.isDisabled;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!isVppInstalledAndEnabled) {
    return (
      <div className="flex flex-col h-full bg-transparent font-body text-white">
        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
          <span className="material-symbols-outlined text-[64px] opacity-50 mb-4 text-red-500/50">
            admin_panel_settings
          </span>
          <p className="font-bold text-xl text-white">VPP Admin Tools Mod Required</p>
          <p className="text-sm opacity-70 mt-2 max-w-md">
            This tab requires the <strong>VPPAdminTools</strong> mod to be installed and enabled. 
            Please install it from the Workshop or enable it in the Installed Mods tab to access these settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent font-body text-white">
      <div className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between shadow-sm shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">admin_panel_settings</span>
          VPP Admin Tools Settings
        </h2>
      </div>

      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <DayzVppSuperAdminsPanel activeServerId={activeServerId} />
          <DayzVppCredentialsPanel activeServerId={activeServerId} />
        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
};

import { useState } from 'react';
import { useDayzModStore } from '../store/useDayzModStore';


export const useDayzModInstallation = (
  activeServerId: number | null,
  installedMods: any[],
  onNavigateToInstalled: () => void,
  loadInstalledMods: () => Promise<void>
) => {
  const { addPendingDownload, removePendingDownload } = useDayzModStore();

  const [downloadProgress, setDownloadProgress] = useState<{ [id: string]: { percent: number, msg: string } }>({});
  const [installingMod, setInstallingMod] = useState<string | null>(null);

  const handleInstall = async (mod: any, steamCreds: any, requestLogin: () => void, onSteamGuardRequired: () => void) => {
    if (!steamCreds.username || !steamCreds.password) {
      requestLogin();
      return;
    }

    setInstallingMod(mod.id);
    setDownloadProgress(prev => ({
      ...prev,
      [mod.id]: { percent: 0, msg: 'Starting download...' }
    }));

    let modsToInstall = [mod];

    try {
      const dependencies = await window.api.steam.getModDependencies(mod.id);

      if (dependencies && dependencies.length > 0) {
        const missingDeps = dependencies.filter(depId => !installedMods.find(m => m.id === depId));

        if (missingDeps.length > 0) {
          const depDetails = await window.api.steam.getWorkshopItemDetails(missingDeps);
          if (depDetails && depDetails.length > 0) {
            const depNames = depDetails.map((d: any) => d.title).join(', ');
            const confirmInstall = confirm(`This mod requires the following dependencies:\n\n${depNames}\n\nDo you want to install them automatically?`);
            if (confirmInstall) {
              modsToInstall = [...depDetails, mod];
            }
          }
        }
      }

      setInstallingMod(mod.id);
      const startMsg = `Starting batch download for ${modsToInstall.length} mods...`;
      setDownloadProgress(prev => ({
        ...prev,
        [mod.id]: { percent: 0, msg: startMsg }
      }));
      
      if (addPendingDownload && activeServerId) {
        modsToInstall.forEach((m: any) => addPendingDownload(activeServerId, m));
        onNavigateToInstalled();
      }

      const batchMods = modsToInstall.map((m: any) => ({
        modId: m.id || m.publishedfileid,
        modTitle: m.title
      }));

      await window.api.dayz.installMods(
        activeServerId!,
        batchMods,
        steamCreds.username,
        steamCreds.password,
        steamCreds.steamGuard || undefined
      );

      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[mod.id];
        return next;
      });

      await loadInstalledMods();
      
      if (removePendingDownload && activeServerId) {
        modsToInstall.forEach((m: any) => removePendingDownload(activeServerId, m.id || m.publishedfileid));
      }
    } catch (e: any) {
      if (e.message && e.message.includes('STEAM_GUARD_REQUIRED')) {
        alert('Steam Guard code is required. Please check your email or Steam app for the code and enter it in the credentials box.');
        onSteamGuardRequired();
      } else if (e.message?.includes('LOGIN_REQUIRED')) {
        setInstallingMod(null);
        requestLogin();
        return;
      } else if (e.message?.includes('ENOSPC')) {
        alert("Installation failed: Your hard drive has run out of space.\n\nDayZ mods require significant storage. Please free up some space on your disk and try again. The installation will instantly resume where it left off!");
        return;
      } else {
        alert(`Failed to install mods: ${e.message}`);
      }
      
      if (removePendingDownload && activeServerId) {
        modsToInstall.forEach((m: any) => removePendingDownload(activeServerId, m.id || m.publishedfileid));
      }
    } finally {
      setInstallingMod(null);
      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[mod.id];
        return next;
      });
    }
  };

  const handleUninstall = async (modId: string) => {
    if (!activeServerId) return;
    if (confirm('Are you sure you want to uninstall this mod?')) {
      await window.api.dayz.uninstallMod(activeServerId, modId);
      await loadInstalledMods();
    }
  };

  return {
    downloadProgress,
    setDownloadProgress,
    installingMod,
    setInstallingMod,
    handleInstall,
    handleUninstall
  };
};

import { useState } from 'react';
import { useDayzModStore } from '../store/useDayzModStore';
import { useModalStore } from '../store/useModalStore';
import { useSteamCredentialsStore } from '../store/useSteamCredentialsStore';

export const useDayzModDependencies = (
  activeServerId: number | null,
  loadInstalledMods: () => Promise<void>,
  mods: any[]
) => {
  const { addPendingDownload } = useDayzModStore();

  const [pendingDeps, setPendingDeps] = useState<any[]>([]);
  const [checkingDeps, setCheckingDeps] = useState<string | null>(null);

  const handleInstallDependencies = async (depsToInstall: any[] = pendingDeps) => {
    if (!activeServerId) return;
    useSteamCredentialsStore.getState().setShowCreds(false);

    depsToInstall.forEach(dep => {
      addPendingDownload(activeServerId, {
        id: dep.id,
        title: dep.title,
        folderName: `@${dep.title.replace(/[^a-zA-Z0-9]/g, '') || dep.id}`,
        tags: []
      });
    });

    try {
      const modsToInstall = depsToInstall.map(m => ({ modId: m.id, modTitle: m.title }));
      const { steamCreds } = useSteamCredentialsStore.getState();
      await window.api.dayz.installMods(
        activeServerId,
        modsToInstall,
        steamCreds.username,
        steamCreds.password || undefined,
        steamCreds.steamGuard || undefined
      );
    } catch (e: any) {
      if (e.message && e.message.includes('STEAM_GUARD_REQUIRED')) {
        alert('Steam Guard code is required. Please check your email or Steam app for the code and enter it in the credentials box.');
        useSteamCredentialsStore.getState().setShowCreds(true);
        return;
      } else if (e.message && e.message.includes('INVALID_CREDENTIALS')) {
        alert('Invalid Steam Username or Password. Please update your credentials.');
        useSteamCredentialsStore.getState().setShowCreds(true);
        return;
      } else if (e.message?.includes('LOGIN_REQUIRED')) {
        alert(`SteamCMD Login Failed:\n${e.message}\n\nPlease check your credentials.`);
        useSteamCredentialsStore.getState().setShowCreds(true);
        return;
      } else if (e.message?.includes('ENOSPC')) {
        alert("Installation failed: Your hard drive has run out of space.\n\nDayZ mods require significant storage. Please free up some space on your disk and try again. The installation will instantly resume where it left off!");
        return;
      } else {
        alert(`Failed to batch install dependencies: ${e.message}`);
      }
    }

    setPendingDeps([]);
    await loadInstalledMods();
  };

  const executeMissingDepsInstall = (depDetails: any[]) => {
    useModalStore.getState().closeDayzMissingDepsModal();
    setPendingDeps(depDetails);
    const { steamCreds } = useSteamCredentialsStore.getState();
    if (!steamCreds.username) {
      useSteamCredentialsStore.getState().setShowCreds(true);
    } else {
      handleInstallDependencies(depDetails);
    }
  };

  const handleCheckDependencies = async (mod: any) => {
    setCheckingDeps(mod.id);
    try {
      const depIds = await window.api.steam.getModDependencies(mod.id);
      if (!depIds || depIds.length === 0) {
        useModalStore.getState().openDayzInfoModal('No dependencies required for this mod.');
        setCheckingDeps(null);
        return;
      }

      const details = await window.api.steam.getWorkshopItemDetails(depIds);

      const results = details.map((d: any) => {
        const localMod = mods.find(m => String(m.id) === String(d.id));
        return {
          id: d.id,
          title: d.title,
          isInstalled: !!localMod,
          isDisabled: localMod ? localMod.isDisabled : false
        };
      });

      useModalStore.getState().openDayzDependencyResultModal(mod.title, results);
    } catch (e: any) {
      useModalStore.getState().openDayzInfoModal('Failed to check dependencies: ' + e.message);
    } finally {
      setCheckingDeps(null);
    }
  };

  return {
    checkingDeps,
    handleInstallDependencies,
    executeMissingDepsInstall,
    handleCheckDependencies
  };
};

import { useState } from 'react';
import { useDayzModStore } from '../store/useDayzModStore';
import { useModalStore } from '../store/useModalStore';

export const useDayzModDependencies = (
  activeServerId: number | null,
  steamCreds: any,
  setShowCreds: React.Dispatch<React.SetStateAction<boolean>>,
  loadInstalledMods: () => Promise<void>,
  mods: any[]
) => {
  const { addPendingDownload } = useDayzModStore();

  const [pendingDeps, setPendingDeps] = useState<any[]>([]);
  const [installingDep, setInstallingDep] = useState<string | null>(null);
  const [depProgress, setDepProgress] = useState<{ percent: number, msg: string } | null>(null);
  const [checkingDeps, setCheckingDeps] = useState<string | null>(null);
  const [dependencyResult, setDependencyResult] = useState<{ modTitle: string, deps: any[] } | null>(null);

  const handleInstallDependencies = async (depsToInstall: any[] = pendingDeps) => {
    if (!activeServerId) return;
    setShowCreds(false);

    if (addPendingDownload) {
      depsToInstall.forEach(dep => {
        addPendingDownload(activeServerId, {
          id: dep.id,
          title: dep.title,
          folderName: `@${dep.title.replace(/[^a-zA-Z0-9]/g, '') || dep.id}`,
          tags: []
        });
      });
    } else {
      setInstallingDep('batch');
      setDepProgress({ percent: 0, msg: `Starting batch download for ${depsToInstall.length} dependencies...` });
    }

    try {
      const modsToInstall = depsToInstall.map(m => ({ modId: m.id, modTitle: m.title }));
      await window.api.dayz.installMods(
        activeServerId,
        modsToInstall,
        steamCreds.username,
        steamCreds.password,
        steamCreds.steamGuard || undefined
      );
    } catch (e: any) {
      if (e.message && e.message.includes('STEAM_GUARD_REQUIRED')) {
        alert('Steam Guard code is required. Please check your email or Steam app for the code and enter it in the credentials box.');
        setShowCreds(true);
        return;
      } else if (e.message?.includes('LOGIN_REQUIRED')) {
        alert(`SteamCMD Login Failed:\n${e.message}\n\nPlease check your credentials.`);
        setShowCreds(true);
        return;
      } else if (e.message?.includes('ENOSPC')) {
        alert("Installation failed: Your hard drive has run out of space.\n\nDayZ mods require significant storage. Please free up some space on your disk and try again. The installation will instantly resume where it left off!");
        return;
      } else {
        alert(`Failed to batch install dependencies: ${e.message}`);
      }
    }

    setInstallingDep(null);
    setDepProgress(null);
    setPendingDeps([]);
    await loadInstalledMods();
  };

  const executeMissingDepsInstall = (depDetails: any[]) => {
    useModalStore.getState().closeDayzMissingDepsModal();
    setPendingDeps(depDetails);
    if (!steamCreds.username || !steamCreds.password) {
      setShowCreds(true);
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

      setDependencyResult({ modTitle: mod.title, deps: results });
    } catch (e: any) {
      useModalStore.getState().openDayzInfoModal('Failed to check dependencies: ' + e.message);
    } finally {
      setCheckingDeps(null);
    }
  };

  return {
    installingDep,
    depProgress,
    checkingDeps,
    dependencyResult,
    setDependencyResult,
    handleInstallDependencies,
    executeMissingDepsInstall,
    handleCheckDependencies
  };
};

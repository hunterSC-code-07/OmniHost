import { useState } from 'react';

export interface DayzModOperationCallbacks {
  onMissingDependencies: (depNames: string, depDetails: any[]) => void;
  onUninstallSingle: (modId: string, modName: string) => void;
  onUninstallAll: () => void;
  onRebuildConfirm: () => void;
  onRebuildSuccess: () => void;
  onError: (message: string) => void;
}

export const useDayzModOperations = (
  activeServerId: number | null,
  mods: any[],
  loadInstalledMods: () => Promise<void>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  callbacks: DayzModOperationCallbacks
) => {
  const [isRebuilding, setIsRebuilding] = useState(false);

  const handleToggleMap = async (folderName: string, currentIsMap: boolean) => {
    if (!activeServerId) return;
    await window.api.dayz.toggleMapMod(activeServerId, folderName, !currentIsMap);
    loadInstalledMods();
  };

  const handleToggleModStatus = async (mod: any) => {
    if (!activeServerId) return;
    const isEnabling = mod.isDisabled;
    await window.api.dayz.toggleModStatus(activeServerId, mod.folderName, !isEnabling);

    if (isEnabling && mod.id && /^\d+$/.test(mod.id)) {
      try {
        const dependencies = await window.api.steam.getModDependencies(mod.id);
        if (dependencies && dependencies.length > 0) {
          const installedDeps = mods.filter(m => dependencies.includes(m.id));
          const missingDepIds = dependencies.filter(depId => !mods.find(m => m.id === depId));

          for (const installedDep of installedDeps) {
            if (installedDep.isDisabled) {
              await window.api.dayz.toggleModStatus(activeServerId, installedDep.folderName, false);
            }
          }

          if (missingDepIds.length > 0) {
            const depDetails = await window.api.steam.getWorkshopItemDetails(missingDepIds);
            if (depDetails && depDetails.length > 0) {
              const depNames = depDetails.map((d: any) => d.title).join(', ');
              callbacks.onMissingDependencies(depNames, depDetails);
              return;
            }
          }
        }
      } catch (e: any) {
        callbacks.onError('Failed to process missing dependencies: ' + e.message);
      }
    }

    loadInstalledMods();
  };

  const handleUninstall = (modId: string, modName: string) => {
    if (!activeServerId) return;
    callbacks.onUninstallSingle(modId, modName);
  };
  
  const executeUninstall = async (modId: string) => {
    try {
      await window.api.dayz.uninstallMod(activeServerId!, modId);
      await loadInstalledMods();
    } catch (e: any) {
      callbacks.onError(`Failed to uninstall mod: ${e.message}`);
    }
  };

  const handleUninstallAll = () => {
    if (mods.length === 0 || !activeServerId) return;
    callbacks.onUninstallAll();
  };

  const executeUninstallAll = async () => {
    setLoading(true);
    try {
      for (const mod of mods) {
        await window.api.dayz.uninstallMod(activeServerId!, mod.folderName || mod.id);
      }
      await loadInstalledMods();
    } catch (e: any) {
      callbacks.onError(`Failed to uninstall some mods: ${e.message}`);
      await loadInstalledMods();
    }
    setLoading(false);
  };

  const handleRebuildLoadOrder = () => {
    if (!activeServerId) return;
    callbacks.onRebuildConfirm();
  };

  const executeRebuildLoadOrder = async () => {
    setIsRebuilding(true);
    try {
      await window.api.dayz.rebuildModDependencies(activeServerId!);
      callbacks.onRebuildSuccess();
    } catch (e: any) {
      callbacks.onError('Failed to rebuild load order: ' + e.message);
    }
    setIsRebuilding(false);
  };

  return {
    isRebuilding,
    handleToggleMap,
    handleToggleModStatus,
    handleUninstall,
    executeUninstall,
    handleUninstallAll,
    executeUninstallAll,
    handleRebuildLoadOrder,
    executeRebuildLoadOrder
  };
};

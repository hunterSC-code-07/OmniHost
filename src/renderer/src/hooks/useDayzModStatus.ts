import { useModalStore } from '../store/useModalStore';

export const useDayzModStatus = (
  activeServerId: number | null,
  mods: any[],
  loadInstalledMods: () => Promise<void>,
  executeMissingDepsInstall: (deps: any[]) => void
) => {
  const { openDayzMissingDepsModal, openDayzInfoModal } = useModalStore.getState();

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
              openDayzMissingDepsModal(depDetails, executeMissingDepsInstall);
            }
          }
        }
      } catch (e: any) {
        openDayzInfoModal('Failed to process missing dependencies: ' + e.message);
      }
    }

    loadInstalledMods();
  };

  return {
    handleToggleMap,
    handleToggleModStatus
  };
};

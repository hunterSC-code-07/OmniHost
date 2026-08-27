import { useModalStore } from '../store/useModalStore';

export const useDayzModUninstall = (
  activeServerId: number | null,
  mods: any[],
  loadInstalledMods: () => Promise<void>,
  setLoading: (loading: boolean) => void
) => {
  const { openDayzUninstallSingleModal, openDayzUninstallAllModal, openDayzInfoModal } = useModalStore.getState();

  const executeUninstall = async (modId: string) => {
    try {
      await window.api.dayz.uninstallMod(activeServerId!, modId);
      await loadInstalledMods();
    } catch (e: any) {
      openDayzInfoModal(`Failed to uninstall mod: ${e.message}`);
    }
  };

  const handleUninstall = (modId: string, modName: string) => {
    if (!activeServerId) return;
    openDayzUninstallSingleModal(modId, modName, executeUninstall);
  };

  const executeUninstallAll = async () => {
    setLoading(true);
    try {
      for (const mod of mods) {
        await window.api.dayz.uninstallMod(activeServerId!, mod.folderName || mod.id);
      }
      await loadInstalledMods();
    } catch (e: any) {
      openDayzInfoModal(`Failed to uninstall some mods: ${e.message}`);
      await loadInstalledMods();
    }
    setLoading(false);
  };

  const handleUninstallAll = () => {
    if (mods.length === 0 || !activeServerId) return;
    openDayzUninstallAllModal(mods.length, executeUninstallAll);
  };

  return {
    handleUninstall,
    handleUninstallAll
  };
};

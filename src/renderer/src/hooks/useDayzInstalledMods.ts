import { useEffect } from 'react';
import { useServerStore } from '../store/useServerStore';
import { useDayzModStore } from '../store/useDayzModStore';

export const useDayzInstalledMods = () => {
  const { activeServerId } = useServerStore();
  const { installedMods, installedModsLoading, loadInstalledMods, setInstalledModsLoading } = useDayzModStore();

  useEffect(() => {
    if (activeServerId) {
      loadInstalledMods(activeServerId);
    }
  }, [activeServerId, loadInstalledMods]);

  return {
    mods: (activeServerId && installedMods[activeServerId]) || [],
    loading: activeServerId ? installedModsLoading[activeServerId] ?? true : false,
    loadInstalledMods: async () => { if (activeServerId) await loadInstalledMods(activeServerId); },
    setLoading: (loading: boolean) => { if (activeServerId) setInstalledModsLoading(activeServerId, loading); },
    activeServerId
  };
};

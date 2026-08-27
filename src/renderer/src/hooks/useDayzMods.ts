import { useState, useEffect } from 'react';
import { useServerStore } from '../store/useServerStore';
import { useDayzModSearch } from './useDayzModSearch';
import { useDayzModImport } from './useDayzModImport';

export function useDayzMods() {
  const { activeServerId } = useServerStore();

  const [installedMods, setInstalledMods] = useState<any[]>([]);
  const [viewingMod, setViewingMod] = useState<any | null>(null);

  const loadInstalledMods = async () => {
    if (!activeServerId) return;
    const mods = await window.api.dayz.getInstalledMods(activeServerId);
    if (mods) {
      setInstalledMods(mods);
    }
  };

  useEffect(() => {
    loadInstalledMods();
  }, [activeServerId]);

  const searchControls = useDayzModSearch();
  const importControls = useDayzModImport(activeServerId, loadInstalledMods);

  // Expose the old flat API for backwards compatibility with DayzModsTab
  return {
    ...searchControls,
    ...importControls,
    installedMods,
    setInstalledMods,
    viewingMod,
    setViewingMod,
    loadInstalledMods
  };
}

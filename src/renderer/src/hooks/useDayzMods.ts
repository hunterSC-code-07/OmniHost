import { useState, useEffect } from 'react';
import { useServerStore } from '../store/useServerStore';
import { useDayzModStore } from '../store/useDayzModStore';
import { useDayzModSearch } from './useDayzModSearch';
import { useDayzModImport } from './useDayzModImport';

export function useDayzMods() {
  const { activeServerId } = useServerStore();
  
  const { installedMods: allInstalledMods, loadInstalledMods: globalLoadInstalledMods } = useDayzModStore();

  const [viewingMod, setViewingMod] = useState<any | null>(null);

  const installedMods = activeServerId ? (allInstalledMods[activeServerId] || []) : [];

  const loadInstalledMods = async () => {
    if (!activeServerId) return;
    await globalLoadInstalledMods(activeServerId);
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
    viewingMod,
    setViewingMod,
    loadInstalledMods
  };
}

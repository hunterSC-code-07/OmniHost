import { useState, useEffect } from 'react';
import { useServerStore } from '../store/useServerStore';

export const useDayzInstalledMods = () => {
  const { activeServerId } = useServerStore();
  const [mods, setMods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInstalledMods = async () => {
    if (!activeServerId) return;
    setLoading(true);
    try {
      const basicMods = await window.api.dayz.getInstalledMods(activeServerId);

      const workshopIds = basicMods
        .filter((m: any) => m.id && /^\d+$/.test(m.id) && String(m.id) !== '0')
        .map((m: any) => m.id);

      let detailedMods: any[] = [];
      if (workshopIds.length > 0) {
        detailedMods = await window.api.steam.getWorkshopItemDetails(workshopIds);
      }

      const mergedMods = basicMods.map((basicMod: any) => {
        const detail = detailedMods.find((d: any) => d.publishedfileid === basicMod.id);
        if (detail) {
          return {
            ...basicMod,
            title: detail.title || basicMod.title,
            preview_url: detail.preview_url,
            file_size: detail.file_size,
            tags: detail.tags,
            description: detail.description
          };
        }
        return basicMod;
      }).sort((a: any, b: any) => {
        if (a.isDisabled === b.isDisabled) {
          return (a.title || a.folderName || '').localeCompare(b.title || b.folderName || '', undefined, { sensitivity: 'base' });
        }
        return a.isDisabled ? 1 : -1;
      });

      setMods(mergedMods);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInstalledMods();
  }, [activeServerId]);

  return {
    mods,
    setMods,
    loading,
    setLoading,
    loadInstalledMods,
    activeServerId
  };
};

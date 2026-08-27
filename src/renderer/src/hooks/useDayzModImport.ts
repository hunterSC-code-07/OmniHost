import { useState } from 'react';

export function useDayzModImport(activeServerId: number | null, loadInstalledMods: () => Promise<void>) {
  const [workshopPath, setWorkshopPath] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  const handleBrowseWorkshop = async () => {
    const path = await window.api.steam.selectWorkshopFolder();
    if (path) {
      setWorkshopPath(path);
    }
  };

  const handleImportWorkshop = async () => {
    if (!workshopPath || !activeServerId) return;
    setIsImporting(true);
    try {
      const count = await window.api.dayz.importLocalWorkshop(activeServerId, workshopPath);
      alert(`Successfully imported ${count} mods from your !Workshop folder!\n\nNote: They have been marked as 'DISABLED' by default so your server doesn't crash on startup. Go to the 'Installed Mods' tab to enable the ones you want.`);
      await loadInstalledMods();
    } catch (e: any) {
      console.error(e);
      alert('Failed to import local workshop mods: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  return {
    workshopPath,
    setWorkshopPath,
    isImporting,
    handleBrowseWorkshop,
    handleImportWorkshop
  };
}

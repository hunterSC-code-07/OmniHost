import { useState, useEffect, useRef } from 'react';
import { useServerStore } from '../store/useServerStore';
import { useDayzModStore } from '../store/useDayzModStore';

export function useDayzMods(onNavigateToInstalled: () => void) {
  const { activeServerId } = useServerStore();
  const { addPendingDownload, removePendingDownload } = useDayzModStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<number>(9);
  const [results, setResults] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [installedMods, setInstalledMods] = useState<any[]>([]);
  const [workshopPath, setWorkshopPath] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = useRef(null);
  const [downloadProgress, setDownloadProgress] = useState<{ [id: string]: { percent: number, msg: string } }>({});
  
  const [steamCreds, setSteamCreds] = useState(() => {
    try {
      const saved = localStorage.getItem('omnihost_steam_creds');
      return saved ? JSON.parse(atob(saved)) : { username: '', password: '', steamGuard: '' };
    } catch {
      return { username: '', password: '', steamGuard: '' };
    }
  });
  
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('omnihost_steam_creds'));
  const [showCreds, setShowCreds] = useState(false);
  const [installingMod, setInstallingMod] = useState<string | null>(null);
  const [viewingMod, setViewingMod] = useState<any | null>(null);

  const loadInstalledMods = async () => {
    if (!activeServerId) return;
    const mods = await window.api.dayz.getInstalledMods(activeServerId);
    if (mods) {
      setInstalledMods(mods);
    }
  };

  const handleSearch = async (queryOverride?: string, categoryOverride?: number, pageOverride: number = 1, tagsOverride?: string[]) => {
    const queryToUse = queryOverride !== undefined ? queryOverride : searchQuery;
    const categoryToUse = categoryOverride !== undefined ? categoryOverride : activeCategory;
    const tagsToUse = tagsOverride !== undefined ? tagsOverride : selectedTags;

    if (pageOverride === 1) {
      setResults([]);
      setHasMore(true);
    }

    setLoading(true);
    const res = await window.api.steam.searchWorkshop(queryToUse, categoryToUse, pageOverride, tagsToUse);

    if (res && res.length > 0) {
      if (pageOverride === 1) {
        setResults(res);
      } else {
        setResults(prev => [...prev, ...res]);
      }
      setPage(pageOverride);
    } else {
      setHasMore(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInstalledMods();
    setPage(1);
    setSelectedTags([]);
    handleSearch('', 9, 1, []);
    setActiveCategory(9);
  }, [activeServerId]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && hasMore && results.length > 0) {
        handleSearch(undefined, undefined, page + 1, undefined);
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore, page, results.length]);

  const handleCategoryChange = (categoryId: number) => {
    setActiveCategory(categoryId);
    handleSearch(undefined, categoryId, 1, undefined);
  };

  const handleInstall = async (mod: any) => {
    if (!steamCreds.username || !steamCreds.password) {
      setShowCreds(true);
      return;
    }

    setInstallingMod(mod.id);
    setDownloadProgress(prev => ({
      ...prev,
      [mod.id]: { percent: 0, msg: 'Starting download...' }
    }));

    let modsToInstall = [mod];

    try {
      const dependencies = await window.api.steam.getModDependencies(mod.id);

      if (dependencies && dependencies.length > 0) {
        const missingDeps = dependencies.filter(depId => !installedMods.find(m => m.id === depId));

        if (missingDeps.length > 0) {
          const depDetails = await window.api.steam.getWorkshopItemDetails(missingDeps);
          if (depDetails && depDetails.length > 0) {
            const depNames = depDetails.map((d: any) => d.title).join(', ');
            const confirmInstall = confirm(`This mod requires the following dependencies:\n\n${depNames}\n\nDo you want to install them automatically?`);
            if (confirmInstall) {
              modsToInstall = [...depDetails, mod];
            }
          }
        }
      }

      setInstallingMod(mod.id);
      const startMsg = `Starting batch download for ${modsToInstall.length} mods...`;
      setDownloadProgress(prev => ({
        ...prev,
        [mod.id]: { percent: 0, msg: startMsg }
      }));
      
      if (addPendingDownload && activeServerId) {
        modsToInstall.forEach((m: any) => addPendingDownload(activeServerId, m));
        onNavigateToInstalled();
      }

      const batchMods = modsToInstall.map((m: any) => ({
        modId: m.id || m.publishedfileid,
        modTitle: m.title
      }));

      await window.api.dayz.installMods(
        activeServerId,
        batchMods,
        steamCreds.username,
        steamCreds.password,
        steamCreds.steamGuard || undefined
      );

      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[mod.id];
        return next;
      });

      setSteamCreds(prev => ({ ...prev, steamGuard: '' }));
      await loadInstalledMods();
      
      if (removePendingDownload && activeServerId) {
        modsToInstall.forEach((m: any) => removePendingDownload(activeServerId, m.id || m.publishedfileid));
      }
    } catch (e: any) {
      if (e.message && e.message.includes('STEAM_GUARD_REQUIRED')) {
        alert('Steam Guard code is required. Please check your email or Steam app for the code and enter it in the credentials box.');
        setShowCreds(true);
      } else if (e.message?.includes('LOGIN_REQUIRED')) {
        setInstallingMod(null);
        setShowCreds(true);
        return;
      } else if (e.message?.includes('ENOSPC')) {
        alert("Installation failed: Your hard drive has run out of space.\n\nDayZ mods require significant storage. Please free up some space on your disk and try again. The installation will instantly resume where it left off!");
        return;
      } else {
        alert(`Failed to install mods: ${e.message}`);
      }
      
      if (removePendingDownload && activeServerId) {
        modsToInstall.forEach((m: any) => removePendingDownload(activeServerId, m.id || m.publishedfileid));
      }
    } finally {
      setInstallingMod(null);
      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[mod.id];
        return next;
      });
    }
  };

  const handleUninstall = async (modId: string) => {
    if (!activeServerId) return;
    if (confirm('Are you sure you want to uninstall this mod?')) {
      await window.api.dayz.uninstallMod(activeServerId, modId);
      await loadInstalledMods();
    }
  };

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
      loadInstalledMods();
    } catch (e: any) {
      console.error(e);
      alert('Failed to import local workshop mods: ' + e.message);
    } finally {
      setIsImporting(false);
    }
  };

  const stripBBCode = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\[\/?(b|i|u|s|url|img|quote|code|list|list=1|\*|h1|h2|h3)\]/g, '')
      .replace(/\[url=[^\]]+\]/g, '')
      .replace(/\[img\][^\[]+\[\/img\]/g, '')
      .trim();
  };

  return {
    searchQuery, setSearchQuery,
    activeCategory, setActiveCategory,
    results, setResults,
    page, setPage,
    hasMore, setHasMore,
    selectedTags, setSelectedTags,
    installedMods, setInstalledMods,
    workshopPath, setWorkshopPath,
    isImporting, setIsImporting,
    loading, setLoading,
    loadMoreRef,
    downloadProgress, setDownloadProgress,
    steamCreds, setSteamCreds,
    rememberMe, setRememberMe,
    showCreds, setShowCreds,
    installingMod, setInstallingMod,
    viewingMod, setViewingMod,
    loadInstalledMods,
    handleSearch,
    handleCategoryChange,
    handleInstall,
    handleUninstall,
    handleBrowseWorkshop,
    handleImportWorkshop,
    stripBBCode
  };
}

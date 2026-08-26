import { useState, useEffect } from 'react';
import { useToastStore } from '../store/useToastStore';
import { useUiStore } from '../store/useUiStore';

export function useMinecraftMods(activeServerId: number | null, serverMeta: any, activeTab: string) {
  const [modSearchQuery, setModSearchQuery] = useState('');
  const [modResults, setModResults] = useState<any[]>([]);
  const [isSearchingMods, setIsSearchingMods] = useState(false);
  const [installedMods, setInstalledMods] = useState<any[]>([]);
  const [installingModId, setInstallingModId] = useState<number | null>(null);
  const [installProgressText, setInstallProgressText] = useState<string>('');
  const [modViewType, setModViewType] = useState<'browse' | 'installed'>('browse');
  const [activeClassId, setActiveClassId] = useState<number>(6);
  const [activeSortField, setActiveSortField] = useState<number>(2);
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [totalModCount, setTotalModCount] = useState<number>(0);

  const { showToast } = useToastStore();
  const { setCacheSize } = useUiStore();

  const fetchMods = async () => {
    if (activeServerId === null || !serverMeta) return;
    
    // @ts-ignore
    const installed = await window.api.getInstalledMods(activeServerId);
    setInstalledMods(installed);
    
    let defaultClassId = 6; // Mods
    if (serverMeta.type === 'Paper') defaultClassId = 5; // Bukkit Plugins
    else if (serverMeta.type === 'Vanilla') defaultClassId = 6945; // Data Packs
    
    setActiveClassId(defaultClassId);

    setIsSearchingMods(true);
    // @ts-ignore
    const results = await window.api.searchCurseforgeMods('', serverMeta.type, serverMeta.version, 0, defaultClassId, activeSortField);
    setModResults(results);
    setTotalModCount(results?.length > 0 ? 10000 : 0);
    setIsSearchingMods(false);
  };

  useEffect(() => {
    if (activeServerId !== null && serverMeta && (activeTab === 'mods' || activeTab === 'software')) {
      fetchMods();
    }
  }, [activeServerId, activeTab, modViewType, serverMeta]);

  useEffect(() => {
    if (activeTab === 'mods' && serverMeta && !isSearchingMods) {
       handleSearchMods(undefined, activeClassId, activeSortField);
    }
  }, [activeClassId, activeSortField]);

  const handleSearchMods = async (e?: React.FormEvent, cId?: number, sField?: number) => {
    if (e) e.preventDefault();
    if (!serverMeta) return;
    setIsSearchingMods(true);
    const targetClassId = cId !== undefined ? cId : activeClassId;
    const targetSortField = sField !== undefined ? sField : activeSortField;
    try {
      // @ts-ignore
      const results = await window.api.searchCurseforgeMods(modSearchQuery, serverMeta.type, serverMeta.version, 0, targetClassId, targetSortField);
      setModResults(results);
      setTotalModCount(results?.length > 0 ? 10000 : 0);
    } catch (error) {
      console.error('[ERROR] handleSearchMods failed', error);
    }
    setIsSearchingMods(false);
  };

  const handleInstallMod = async (mod: any) => {
    if (activeServerId === null || !serverMeta) return;
    if (installingModId !== null) return;
    
    setInstallingModId(mod.id);
    setInstallProgressText('Resolving dependencies...');
    
    const installWithDeps = async (targetMod: any, depth = 0) => {
      let targetFile = targetMod.latestFiles?.find((f: any) => f.gameVersions?.includes(serverMeta.version));
      
      if (!targetFile && targetMod.latestFilesIndexes) {
        let expectedModLoader = 0;
        if (serverMeta.type === 'Forge') expectedModLoader = 1;
        else if (serverMeta.type === 'Fabric') expectedModLoader = 4;
        else if (serverMeta.type === 'NeoForge') expectedModLoader = 6;
        
        const fileIndex = targetMod.latestFilesIndexes.find((idx: any) => idx.gameVersion === serverMeta.version && (expectedModLoader === 0 || idx.modLoader === expectedModLoader || idx.modLoader === 0));
        if (fileIndex) {
           setInstallProgressText(`Fetching file details for ${serverMeta.version}...`);
           // @ts-ignore
           targetFile = await window.api.getCurseforgeFile(targetMod.id, fileIndex.fileId);
        }
      }

      if (!targetFile && targetMod.latestFiles?.length > 0) targetFile = targetMod.latestFiles[0];
      
      if (!targetFile || !targetFile.downloadUrl) {
         if (depth === 0) showToast(`Failed to find compatible file for ${targetMod.name}`);
         return;
      }

      const isAlreadyInstalled = installedMods.some(m => m.name.toLowerCase().includes(targetMod.slug?.replace(/-/g, '') || targetMod.name.toLowerCase().replace(/ /g, '')));
      if (isAlreadyInstalled) return;

      if (targetFile.dependencies && targetFile.dependencies.length > 0) {
        const requiredDeps = targetFile.dependencies.filter((d: any) => d.relationType === 3);
        for (const dep of requiredDeps) {
           setInstallProgressText(`Installing Dependency (ID: ${dep.modId})...`);
           // @ts-ignore
           const depMod = await window.api.getCurseforgeMod(dep.modId);
           if (depMod) {
              setInstallProgressText(`Installing ${depMod.name}...`);
              await installWithDeps(depMod, depth + 1);
           }
        }
      }

      setInstallProgressText(`Downloading ${targetMod.name}...`);
      // @ts-ignore
      await window.api.installCurseforgeMod(activeServerId, targetFile.downloadUrl, targetFile.fileName, activeClassId);
    };

    await installWithDeps(mod);
    
    showToast(`Installed ${mod.name} and dependencies!`);
    fetchMods();
    // @ts-ignore
    window.api.getCacheInfo().then(size => setCacheSize(size));
    setInstallingModId(null);
    setInstallProgressText('');
  };

  const handleDeleteMod = async (fileName: string) => {
    if (activeServerId === null) return;
    // @ts-ignore
    await window.api.deleteMod(activeServerId, fileName);
    fetchMods();
  };

  return {
    modSearchQuery, setModSearchQuery,
    modResults, setModResults,
    isSearchingMods, setIsSearchingMods,
    installedMods, setInstalledMods,
    installingModId, setInstallingModId,
    installProgressText, setInstallProgressText,
    modViewType, setModViewType,
    activeClassId, setActiveClassId,
    activeSortField, setActiveSortField,
    isClassMenuOpen, setIsClassMenuOpen,
    isSortMenuOpen, setIsSortMenuOpen,
    totalModCount, setTotalModCount,
    handleSearchMods, handleInstallMod, handleDeleteMod
  };
}

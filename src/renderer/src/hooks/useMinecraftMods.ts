import { useState, useEffect } from 'react';
import { useToastStore } from '../store/useToastStore';
import { useUiStore } from '../store/useUiStore';

export function useMinecraftMods(activeServerId: number | null, serverMeta: any, activeTab: string) {
  const [modSearchQuery, setModSearchQuery] = useState('');
  const [modResults, setModResults] = useState<any[]>([]);
  const [isSearchingMods, setIsSearchingMods] = useState(false);
  const [installedMods, setInstalledMods] = useState<any[]>([]);
  const [installingModId, setInstallingModId] = useState<number | string | null>(null);
  const [installProgressText, setInstallProgressText] = useState<string>('');
  const [modViewType, setModViewType] = useState<'browse' | 'installed' | 'dependencies' | 'modpacks' | 'shaders' | 'resourcepacks'>('browse');
  const [activeClassId, setActiveClassId] = useState<number>(6);
  const [activeSortField, setActiveSortField] = useState<number>(2);
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [totalModCount, setTotalModCount] = useState<number>(0);

  // Dependencies state
  const [modDependencies, setModDependencies] = useState<any[]>([]);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);
  const [isInstallingAllDeps, setIsInstallingAllDeps] = useState(false);
  const [installAllProgress, setInstallAllProgress] = useState<{ current: number; total: number; text: string }>({ current: 0, total: 0, text: '' });

  // Modpacks state
  const [modpackSearchQuery, setModpackSearchQuery] = useState('');
  const [modpackResults, setModpackResults] = useState<any[]>([]);
  const [isSearchingModpacks, setIsSearchingModpacks] = useState(false);
  const [installingModpackId, setInstallingModpackId] = useState<string | number | null>(null);
  const [modpackProgressText, setModpackProgressText] = useState<string>('');

  // Shaders state
  const [shaderSearchQuery, setShaderSearchQuery] = useState('');
  const [shaderResults, setShaderResults] = useState<any[]>([]);
  const [isSearchingShaders, setIsSearchingShaders] = useState(false);

  // Resource Packs state
  const [resourcePackSearchQuery, setResourcePackSearchQuery] = useState('');
  const [resourcePackResults, setResourcePackResults] = useState<any[]>([]);
  const [isSearchingResourcePacks, setIsSearchingResourcePacks] = useState(false);

  const { showToast } = useToastStore();
  const { setCacheSize } = useUiStore();

  const fetchMods = async () => {
    if (activeServerId === null || !serverMeta) return;
    
    // @ts-ignore
    const installed = await window.api.minecraft.getInstalledMods(activeServerId);
    setInstalledMods(installed || []);
    
    let defaultClassId = 6; // Mods
    if (serverMeta.type === 'Paper') defaultClassId = 5; // Bukkit Plugins
    else if (serverMeta.type === 'Vanilla') defaultClassId = 6945; // Data Packs
    
    setActiveClassId(defaultClassId);

    setIsSearchingMods(true);
    try {
      // @ts-ignore
      const results = await window.api.minecraft.searchCurseforgeMods('', serverMeta.type, serverMeta.version, 0, defaultClassId, activeSortField);
      setModResults(results || []);
      setTotalModCount(results?.length > 0 ? 10000 : 0);
    } catch (e) {
      console.error('[ERROR] fetchMods failed', e);
    }
    setIsSearchingMods(false);
  };

  const fetchModDependencies = async () => {
    if (activeServerId === null) return;
    setIsLoadingDependencies(true);
    try {
      // @ts-ignore
      const deps = await window.api.minecraft.getInstalledModDependencies(activeServerId);
      setModDependencies(deps || []);
    } catch (e) {
      console.error('[ERROR] fetchModDependencies failed', e);
    }
    setIsLoadingDependencies(false);
  };

  const handleSearchModpacks = async (e?: React.FormEvent, query?: string) => {
    if (e) e.preventDefault();
    if (!serverMeta) return;
    setIsSearchingModpacks(true);
    const q = query !== undefined ? query : modpackSearchQuery;
    try {
      // @ts-ignore
      const results = await window.api.minecraft.searchCurseforgeMods(q, serverMeta.type, serverMeta.version, 0, 4471, activeSortField);
      setModpackResults(results || []);
    } catch (e) {
      console.error('[ERROR] handleSearchModpacks failed', e);
    }
    setIsSearchingModpacks(false);
  };

  useEffect(() => {
    if (activeServerId !== null && serverMeta && (activeTab === 'mods' || activeTab === 'software')) {
      fetchMods();
    }
  }, [activeServerId, activeTab, serverMeta]);

  useEffect(() => {
    if (activeTab === 'mods' && modViewType === 'dependencies') {
      fetchModDependencies();
    } else if (activeTab === 'mods' && modViewType === 'modpacks') {
      handleSearchModpacks();
    }
  }, [modViewType, activeServerId, activeTab]);

  useEffect(() => {
    if (activeTab === 'mods' && serverMeta && !isSearchingMods && modViewType === 'browse') {
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
      const results = await window.api.minecraft.searchCurseforgeMods(modSearchQuery, serverMeta.type, serverMeta.version, 0, targetClassId, targetSortField);
      setModResults(results || []);
      setTotalModCount(results?.length > 0 ? 10000 : 0);
    } catch (error) {
      console.error('[ERROR] handleSearchMods failed', error);
    }
    setIsSearchingMods(false);
  };

  const handleSearchShaders = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!serverMeta) return;
    setIsSearchingShaders(true);
    try {
      // @ts-ignore
      const results = await window.api.minecraft.searchCurseforgeMods(shaderSearchQuery, serverMeta.type, serverMeta.version, 0, 6552, 2);
      setShaderResults(results || []);
    } catch (error) {
      console.error('[ERROR] handleSearchShaders failed', error);
    }
    setIsSearchingShaders(false);
  };

  const handleSearchResourcePacks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!serverMeta) return;
    setIsSearchingResourcePacks(true);
    try {
      // @ts-ignore
      const results = await window.api.minecraft.searchCurseforgeMods(resourcePackSearchQuery, serverMeta.type, serverMeta.version, 0, 12, 2); // 12 is Resource Packs
      setResourcePackResults(results || []);
    } catch (error) {
      console.error('[ERROR] handleSearchResourcePacks failed', error);
    }
    setIsSearchingResourcePacks(false);
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
           targetFile = await window.api.minecraft.getCurseforgeFile(targetMod.id, fileIndex.fileId);
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
           const depMod = await window.api.minecraft.getCurseforgeMod(dep.modId);
           if (depMod) {
              setInstallProgressText(`Installing ${depMod.name}...`);
              await installWithDeps(depMod, depth + 1);
           }
        }
      }

      setInstallProgressText(`Downloading ${targetMod.name}...`);
      
      let finalClassId = activeClassId;
      if (modViewType === 'shaders') finalClassId = 6552;
      else if (modViewType === 'resourcepacks') finalClassId = 12;

      // @ts-ignore
      await window.api.minecraft.installCurseforgeMod(activeServerId, targetFile.downloadUrl, targetFile.fileName, finalClassId);
    };

    try {
      await installWithDeps(mod);
      showToast(`Installed ${mod.name} and dependencies!`);
      await fetchMods();
      if (modViewType === 'dependencies') await fetchModDependencies();
      // @ts-ignore
      window.api.system.getCacheInfo().then(size => setCacheSize(size));
    } catch (e: any) {
      showToast(`Installation failed: ${e.message}`);
    } finally {
      setInstallingModId(null);
      setInstallProgressText('');
    }
  };

  const handleInstallMissingDependency = async (depId: string) => {
    if (activeServerId === null || !serverMeta) return;
    setInstallingModId(depId);
    setInstallProgressText(`Searching for ${depId}...`);
    try {
      // Search for the mod by its id/name
      // @ts-ignore
      const results = await window.api.minecraft.searchCurseforgeMods(depId, serverMeta.type, serverMeta.version, 0, 6, 2);
      if (results && results.length > 0) {
        const bestMatch = results.find((m: any) => m.slug === depId || m.name.toLowerCase() === depId.toLowerCase()) || results[0];
        setInstallProgressText(`Installing ${bestMatch.name}...`);
        await handleInstallMod(bestMatch);
        await fetchModDependencies();
      } else {
        showToast(`Could not find mod package for '${depId}'`);
      }
    } catch (e: any) {
      showToast(`Failed to resolve dependency ${depId}: ${e.message}`);
    } finally {
      setInstallingModId(null);
      setInstallProgressText('');
    }
  };

  const handleInstallAllMissingDependencies = async () => {
    if (activeServerId === null || !serverMeta) return;
    if (isInstallingAllDeps || installingModId !== null) return;

    // Collect all missing dependency IDs that are not satisfied
    const missingIds = Array.from(new Set(
      modDependencies.flatMap(m => (m.dependencies || []).filter((d: any) => !d.satisfied).map((d: any) => d.id))
    ));

    if (missingIds.length === 0) {
      showToast('All dependencies are already satisfied!');
      return;
    }

    setIsInstallingAllDeps(true);
    setInstallAllProgress({ current: 0, total: missingIds.length, text: `Starting installation of ${missingIds.length} dependencies...` });

    let installedCount = 0;
    for (let i = 0; i < missingIds.length; i++) {
      const depId = missingIds[i];
      setInstallAllProgress({
        current: i + 1,
        total: missingIds.length,
        text: `Resolving ${depId} (${i + 1}/${missingIds.length})...`
      });

      try {
        // @ts-ignore
        const results = await window.api.minecraft.searchCurseforgeMods(depId, serverMeta.type, serverMeta.version, 0, 6, 2);
        if (results && results.length > 0) {
          const bestMatch = results.find((m: any) => m.slug === depId || m.name.toLowerCase() === depId.toLowerCase()) || results[0];
          await handleInstallMod(bestMatch);
          installedCount++;
        }
      } catch (e: any) {
        console.warn(`[useMinecraftMods] Failed installing dependency ${depId}:`, e.message);
      }
    }

    showToast(`Installed ${installedCount} of ${missingIds.length} dependencies!`);
    await fetchMods();
    await fetchModDependencies();
    setIsInstallingAllDeps(false);
    setInstallAllProgress({ current: 0, total: 0, text: '' });
  };

  const handleInstallModpack = async (modpack: any) => {
    if (activeServerId === null || !serverMeta) return;
    if (installingModpackId !== null) return;

    setInstallingModpackId(modpack.id);
    setModpackProgressText('Starting modpack installation...');

    // Subscribe to download progress
    // @ts-ignore
    const cleanup = window.api.server.onDownloadProgress(activeServerId, (_progress: number, text?: string) => {
      if (text) setModpackProgressText(text);
    });

    try {
      // @ts-ignore
      await window.api.minecraft.installCurseforgeModpack(activeServerId, modpack.id, 'latest');
      showToast(`Modpack ${modpack.name} installed successfully!`);
      await fetchMods();
      await fetchModDependencies();
    } catch (e: any) {
      showToast(`Modpack installation failed: ${e.message}`);
    } finally {
      setInstallingModpackId(null);
      setModpackProgressText('');
    }
  };

  const handleDeleteMod = async (fileName: string) => {
    if (activeServerId === null) return;
    // @ts-ignore
    await window.api.minecraft.deleteMod(activeServerId, fileName);
    await fetchMods();
    if (modViewType === 'dependencies') {
      await fetchModDependencies();
    }
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
    handleSearchMods, handleInstallMod, handleDeleteMod,

    // Dependencies
    modDependencies, isLoadingDependencies, fetchModDependencies, handleInstallMissingDependency,
    isInstallingAllDeps, installAllProgress, handleInstallAllMissingDependencies,

    // Modpacks
    modpackSearchQuery, setModpackSearchQuery,
    modpackResults, setModpackResults,
    isSearchingModpacks, setIsSearchingModpacks,
    installingModpackId, modpackProgressText,
    handleSearchModpacks, handleInstallModpack,

    // Shaders
    shaderSearchQuery, setShaderSearchQuery,
    shaderResults, setShaderResults,
    isSearchingShaders, handleSearchShaders,

    // Resource Packs
    resourcePackSearchQuery, setResourcePackSearchQuery,
    resourcePackResults, setResourcePackResults,
    isSearchingResourcePacks, handleSearchResourcePacks,
  };
}

import { useState, useEffect } from 'react';

export function useCreateServerData(newServerType: string, modpackSearch: string, modpackVersionFilter: string, modpackLoaderFilter: string) {
  const [newServerVersion, setNewServerVersion] = useState('');
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [newServerLoaderVersion, setNewServerLoaderVersion] = useState('');
  const [availableLoaderVersions, setAvailableLoaderVersions] = useState<string[]>([]);
  const [isSearchingPacks, setIsSearchingPacks] = useState(false);
  const [modpacks, setModpacks] = useState<any[]>([]);

  useEffect(() => {
    const fetchModpacks = async () => {
      if (newServerType !== 'CurseForge Modpack') return;
      setIsSearchingPacks(true);
      try {
        const typeStr = modpackLoaderFilter || 'Any';
        const versionStr = modpackVersionFilter || '';
        // @ts-ignore
        const results = await window.api.searchCurseforgeMods(modpackSearch, typeStr, versionStr, 0, 4471, 2);
        setModpacks(results || []);
      } catch (e) {
        console.error(e);
        setModpacks([]);
      } finally {
        setIsSearchingPacks(false);
      }
    };
    
    const timer = setTimeout(() => {
      fetchModpacks();
    }, 500);
    return () => clearTimeout(timer);
  }, [modpackSearch, modpackVersionFilter, modpackLoaderFilter, newServerType]);

  useEffect(() => {
    const fetchVersions = async () => {
      let versions: string[] = [];
      // @ts-ignore
      if (newServerType === 'Vanilla') versions = await window.api.getVanillaVersions();
      // @ts-ignore
      else if (newServerType === 'Paper') versions = await window.api.getPaperVersions();
      // @ts-ignore
      else if (newServerType === 'Fabric') versions = await window.api.getFabricVersions();
      // @ts-ignore
      else if (newServerType === 'Forge') versions = await window.api.getForgeVersions();
      // @ts-ignore
      else if (newServerType === 'NeoForge') versions = await window.api.getNeoForgeVersions();
      
      setAvailableVersions(versions);
      if (versions.length > 0) {
          setNewServerVersion(prev => versions.includes(prev) ? prev : versions[0]);
      }
    }
    
    if (newServerType !== 'CurseForge Modpack') {
      fetchVersions();
    } else {
      setAvailableVersions([]);
    }
  }, [newServerType]);

  useEffect(() => {
    const fetchLoaderVersions = async () => {
      if (!newServerVersion) return;
      if (['Forge', 'Fabric', 'NeoForge'].includes(newServerType)) {
        setAvailableLoaderVersions([]);
        // @ts-ignore
        const versions = await window.api.getLoaderVersions(newServerType, newServerVersion);
        setAvailableLoaderVersions(versions);
        if (versions && versions.length > 0) {
          setNewServerLoaderVersion(prev => versions.includes(prev) ? prev : versions[0]);
        }
      } else {
        setAvailableLoaderVersions([]);
        setNewServerLoaderVersion('');
      }
    }
    fetchLoaderVersions();
  }, [newServerType, newServerVersion]);

  return {
    newServerVersion, setNewServerVersion,
    availableVersions,
    newServerLoaderVersion, setNewServerLoaderVersion,
    availableLoaderVersions,
    isSearchingPacks,
    modpacks, setModpacks
  };
}

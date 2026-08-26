import { useState, useEffect } from 'react';

export function useMinecraftSoftware(serverMeta: any, activeTab: string) {
  const [editingSoftwareType, setEditingSoftwareType] = useState('Vanilla');
  const [editingSoftwareVersion, setEditingSoftwareVersion] = useState('');
  const [editingAvailableVersions, setEditingAvailableVersions] = useState<string[]>([]);
  const [editingLoaderVersion, setEditingLoaderVersion] = useState('');
  const [editingAvailableLoaderVersions, setEditingAvailableLoaderVersions] = useState<string[]>([]);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);
  const [isLoaderMenuOpen, setIsLoaderMenuOpen] = useState(false);
  const [isChangingSoftware, setIsChangingSoftware] = useState(false);

  useEffect(() => {
    if (activeTab === 'software' && serverMeta) {
       setEditingSoftwareType(serverMeta.type || 'Vanilla');
       setEditingSoftwareVersion(serverMeta.version || '');
    }
  }, [activeTab, serverMeta]);

  useEffect(() => {
    if (activeTab === 'software') {
      const fetchVersions = async () => {
        let versions: string[] = [];
        // @ts-ignore
        if (editingSoftwareType === 'Vanilla') versions = await window.api.minecraft.getVanillaVersions();
        // @ts-ignore
        else if (editingSoftwareType === 'Paper') versions = await window.api.minecraft.getPaperVersions();
        // @ts-ignore
        else if (editingSoftwareType === 'Fabric') versions = await window.api.minecraft.getFabricVersions();
        // @ts-ignore
        else if (editingSoftwareType === 'Forge') versions = await window.api.minecraft.getForgeVersions();
        // @ts-ignore
        else if (editingSoftwareType === 'NeoForge') versions = await window.api.minecraft.getNeoForgeVersions();
        
        setEditingAvailableVersions(versions);
        if (versions.length > 0) {
           setEditingSoftwareVersion(prev => versions.includes(prev) ? prev : versions[0]);
        }
      };
      fetchVersions();
    }
  }, [activeTab, editingSoftwareType]);

  useEffect(() => {
    if (activeTab === 'software' && ['Forge', 'Fabric', 'NeoForge'].includes(editingSoftwareType) && editingSoftwareVersion) {
      const fetchLoaderVersions = async () => {
        // @ts-ignore
        const loaders = await window.api.minecraft.getLoaderVersions(editingSoftwareType, editingSoftwareVersion);
        setEditingAvailableLoaderVersions(loaders);
        if (serverMeta && serverMeta.loaderVersion && loaders.includes(serverMeta.loaderVersion)) {
           setEditingLoaderVersion(serverMeta.loaderVersion);
        } else {
           setEditingLoaderVersion(loaders.length > 0 ? loaders[0] : '');
        }
      };
      fetchLoaderVersions();
    } else {
      setEditingAvailableLoaderVersions([]);
      setEditingLoaderVersion('');
    }
  }, [activeTab, editingSoftwareType, editingSoftwareVersion, serverMeta]);

  return {
    editingSoftwareType, setEditingSoftwareType,
    editingSoftwareVersion, setEditingSoftwareVersion,
    editingAvailableVersions, setEditingAvailableVersions,
    editingLoaderVersion, setEditingLoaderVersion,
    editingAvailableLoaderVersions, setEditingAvailableLoaderVersions,
    isTypeMenuOpen, setIsTypeMenuOpen,
    isVersionMenuOpen, setIsVersionMenuOpen,
    isLoaderMenuOpen, setIsLoaderMenuOpen,
    isChangingSoftware, setIsChangingSoftware
  };
}

import React, { useState, useEffect, useRef } from 'react'
import { ConsoleTab } from './components/tabs/ConsoleTab';
import { OptionsTab } from './components/tabs/OptionsTab';
import { PlayersTab } from './components/tabs/PlayersTab';
import { FilesTab } from './components/tabs/FilesTab';
import { OverviewTab } from './components/tabs/OverviewTab';
import minecraftBg from './assets/minecraft-bg.png';

const getGameImageUrl = (game: string) => {
  if (game.toLowerCase().includes('minecraft')) return minecraftBg;
  if (game.toLowerCase().includes('palworld')) return 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1000'
  if (game.toLowerCase().includes('dayz')) return 'https://images.unsplash.com/photo-1519082273180-60b61665a3c5?q=80&w=1000'
  return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000'
}

const classOptions = [
  { id: 6, name: 'Mods' },
  { id: 6945, name: 'Data Packs' },
  { id: 12, name: 'Resource Packs' },
  { id: 6552, name: 'Shaders' },
  { id: 17, name: 'Worlds' },
  { id: 4559, name: 'Addons' },
  { id: 5, name: 'Bukkit Plugins' },
  { id: 4546, name: 'Customization' }
];

function App() {
  const [servers, setServers] = useState<any[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [tunnelStatus, setTunnelStatus] = useState('Offline')

  const [activeServerId, setActiveServerId] = useState<number | null>(null)
  const [activeGameHub, setActiveGameHub] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'options' | 'players' | 'software' | 'mods' | 'files'>('overview')
  const [onlinePlayers, setOnlinePlayers] = useState<string[]>([])

  const [tunnelIp, setTunnelIp] = useState(() => localStorage.getItem('tunnelIp') || '34.131.235.17')
  const [showTunnelModal, setShowTunnelModal] = useState(false)
  const [tempTunnelIp, setTempTunnelIp] = useState('')


  const [rawConfigText, setRawConfigText] = useState('')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [props, setProps] = useState<Record<string, string>>({})

  const [playerListType, setPlayerListType] = useState<'live' | 'whitelist' | 'ops' | 'banned-players' | 'banned-ips'>('live')
  const [playerData, setPlayerData] = useState<any[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Performance Stats
  const [statsHistory, setStatsHistory] = useState<{cpu: number, ram: number}[]>([])


  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [playerInventory, setPlayerInventory] = useState<any[] | null>(null)
  const [toasts, setToasts] = useState<{ id: number, message: string }[]>([])

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newServerName, setNewServerName] = useState('')
  const [newServerType, setNewServerType] = useState('Vanilla')
  const [newServerVersion, setNewServerVersion] = useState('')
  const [availableVersions, setAvailableVersions] = useState<string[]>([])
  const [isCreatingServer, setIsCreatingServer] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadText, setDownloadText] = useState('Downloading server.jar...')

  // Modpack States
  const [modpackSearch, setModpackSearch] = useState('')
  const [modpackVersionFilter, setModpackVersionFilter] = useState('')
  const [modpackLoaderFilter, setModpackLoaderFilter] = useState('')
  const [modpacks, setModpacks] = useState<any[]>([])
  const [selectedModpack, setSelectedModpack] = useState<any>(null)
  const [isSearchingPacks, setIsSearchingPacks] = useState(false)

  // Mod Browser States
  const [serverMeta, setServerMeta] = useState<any>(null)
  const [modSearchQuery, setModSearchQuery] = useState('')
  const [modResults, setModResults] = useState<any[]>([])
  const [isSearchingMods, setIsSearchingMods] = useState(false)
  const [installedMods, setInstalledMods] = useState<any[]>([])
  const [installingModId, setInstallingModId] = useState<number | null>(null)
  const [installProgressText, setInstallProgressText] = useState<string>('')
  const [modViewType, setModViewType] = useState<'browse' | 'installed'>('browse')
  const [activeClassId, setActiveClassId] = useState<number>(6)
  const [activeSortField, setActiveSortField] = useState<number>(2)
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false)
  const [totalModCount, setTotalModCount] = useState<number>(0)

  // Software Switching States
  const [editingSoftwareType, setEditingSoftwareType] = useState('Vanilla')
  const [editingSoftwareVersion, setEditingSoftwareVersion] = useState('')
  const [editingAvailableVersions, setEditingAvailableVersions] = useState<string[]>([])
  const [isChangingSoftware, setIsChangingSoftware] = useState(false)
  const [isClearingCache, setIsClearingCache] = useState(false)
  const [cacheSize, setCacheSize] = useState<number>(0)
  const [serverToDelete, setServerToDelete] = useState<number | null>(null)

  const endOfLogsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchServers = async () => {
      // @ts-ignore
      const data = await window.api.getServers()
      setServers(data)
    }
    fetchServers()

    const fetchCacheSize = async () => {
      try {
        // @ts-ignore
        const size = await window.api.getCacheInfo()
        setCacheSize(size)
      } catch (e) {
        console.error('Failed to get cache size:', e)
      }
    }
    fetchCacheSize()
    
    // Poll cache size every 3 seconds to keep it updated in real-time
    const cacheInterval = setInterval(fetchCacheSize, 3000)



    // --- LISTENER 1: CONSOLE LOGS ---
    // @ts-ignore
    window.api.onConsoleLog((msg: string) => {
      setLogs(prev => [...prev, msg])
    })

    // --- LISTENER 2: LIVE PLAYERS ---
    // @ts-ignore
    window.api.onOnlinePlayers((data: { id: number, players: string[] }) => {
      setOnlinePlayers(data.players)
    })

    // --- LISTENER 3: SERVER STATS ---
    // @ts-ignore
    window.api.onServerStats((data: { id: number, cpu: number, ram: number }) => {
      setStatsHistory(prev => {
        const newHistory = [...prev, { cpu: data.cpu, ram: data.ram }]
        if (newHistory.length > 30) newHistory.shift() // keep last 30 data points (60 seconds at 2s interval)
        return newHistory
      })
    })

    return () => clearInterval(cacheInterval)
  }, [])

  useEffect(() => {
    if (showCreateModal) {
      const fetchVersions = async () => {
        let versions: string[] = []
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
        fetchVersions()
      } else {
        setAvailableVersions([]);
      }
    }
  }, [showCreateModal, newServerType])

  useEffect(() => {
    if (activeTab === 'software' && serverMeta) {
       setEditingSoftwareType(serverMeta.type || 'Vanilla');
       setEditingSoftwareVersion(serverMeta.version || '');
    }
  }, [activeTab, serverMeta])

  useEffect(() => {
    if (activeTab === 'software') {
      const fetchVersions = async () => {
        let versions: string[] = []
        // @ts-ignore
        if (editingSoftwareType === 'Vanilla') versions = await window.api.getVanillaVersions();
        // @ts-ignore
        else if (editingSoftwareType === 'Paper') versions = await window.api.getPaperVersions();
        // @ts-ignore
        else if (editingSoftwareType === 'Fabric') versions = await window.api.getFabricVersions();
        // @ts-ignore
        else if (editingSoftwareType === 'Forge') versions = await window.api.getForgeVersions();
        // @ts-ignore
        else if (editingSoftwareType === 'NeoForge') versions = await window.api.getNeoForgeVersions();
        
        setEditingAvailableVersions(versions);
        if (versions.length > 0) {
           setEditingSoftwareVersion(prev => versions.includes(prev) ? prev : versions[0]);
        }
      }
      fetchVersions()
    }
  }, [activeTab, editingSoftwareType])

  useEffect(() => {
    let delay: NodeJS.Timeout;
    if (showCreateModal && newServerType === 'CurseForge Modpack') {
      const search = async () => {
        setIsSearchingPacks(true);
        // @ts-ignore
        const res = await window.api.searchModpacks(modpackSearch, modpackVersionFilter, modpackLoaderFilter);
        setModpacks(res);
        setIsSearchingPacks(false);
      }
      delay = setTimeout(search, 500);
    }
    return () => { if (delay) clearTimeout(delay); };
  }, [modpackSearch, modpackVersionFilter, modpackLoaderFilter, newServerType, showCreateModal])

  useEffect(() => {
    if (activeTab === 'console') {
      endOfLogsRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, activeTab])

  useEffect(() => {
    if (activeServerId !== null) {
      if (activeTab === 'options') loadConfig(activeServerId);
      if (activeTab === 'players' && playerListType !== 'live') loadPlayers(activeServerId, playerListType);
    }
  }, [activeServerId, activeTab, playerListType])

  useEffect(() => {
    if (selectedPlayer && activeServerId !== null) {
      const fetchInv = async () => {
        // @ts-ignore
        const inv = await window.api.getInventory(activeServerId, selectedPlayer);
        setPlayerInventory(inv);
      };
      fetchInv();
    }
  }, [selectedPlayer, activeServerId])

  const fetchServerMeta = async () => {
    if (activeServerId === null) return;
    // @ts-ignore
    const meta = await window.api.getServerMeta(activeServerId);
    setServerMeta(meta);
  };

  useEffect(() => {
    if (activeServerId !== null) {
      fetchServerMeta();
      // Reset stats when switching servers
      setStatsHistory([]);
    } else {
      setServerMeta(null);
    }
  }, [activeServerId]);

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
    console.log('[DEBUG] Calling searchCurseforgeMods', { search: '', type: serverMeta.type, version: serverMeta.version, classId: defaultClassId, sortField: activeSortField });
    // @ts-ignore
    const results = await window.api.searchCurseforgeMods('', serverMeta.type, serverMeta.version, 0, defaultClassId, activeSortField);
    console.log('[DEBUG] searchCurseforgeMods returned:', results?.length);
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
    // @ts-ignore
    try {
      console.log('[DEBUG] Calling searchCurseforgeMods (handleSearch)', { search: modSearchQuery, type: serverMeta.type, version: serverMeta.version, classId: targetClassId, sortField: targetSortField });
      // @ts-ignore
      const results = await window.api.searchCurseforgeMods(modSearchQuery, serverMeta.type, serverMeta.version, 0, targetClassId, targetSortField);
      console.log('[DEBUG] handleSearch returned:', results?.length);
      setModResults(results);
      setTotalModCount(results?.length > 0 ? 10000 : 0);
    } catch (error) {
      console.error('[ERROR] handleSearchMods failed', error);
    }
    setIsSearchingMods(false);
  };

  const handleInstallMod = async (mod: any) => {
    if (activeServerId === null || !serverMeta) return;
    
    // Check if we are already installing something else (prevent double clicks)
    if (installingModId !== null) return;
    
    setInstallingModId(mod.id);
    setInstallProgressText('Resolving dependencies...');
    
    // Recursive function to install a mod and its dependencies
    const installWithDeps = async (targetMod: any, depth = 0) => {
      // Find the best file
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

      // Check if already installed
      const isAlreadyInstalled = installedMods.some(m => m.name.toLowerCase().includes(targetMod.slug?.replace(/-/g, '') || targetMod.name.toLowerCase().replace(/ /g, '')));
      if (isAlreadyInstalled) return; // Skip

      // Resolve Required Dependencies
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

      // Install the mod itself
      setInstallProgressText(`Downloading ${targetMod.name}...`);
      // @ts-ignore
      await window.api.installCurseforgeMod(activeServerId, targetFile.downloadUrl, targetFile.fileName, activeClassId);
    };

    await installWithDeps(mod);
    
    showToast(`Installed ${mod.name} and dependencies!`);
    fetchMods(); // Refresh installed mods
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

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }

  const handleTunnel = async () => {
    if (tunnelStatus === 'Offline') {
      setTunnelStatus('Starting...');
      // @ts-ignore
      await window.api.startTunnel(tunnelIp);
      setTunnelStatus('Online');
      showToast("Tunnel connected!");
    } else {
      // @ts-ignore
      await window.api.stopTunnel();
      setTunnelStatus('Offline');
      showToast("Tunnel disconnected.");
    }
  }



  const handleCreateServer = async () => {
    if (!newServerName || (newServerType !== 'CurseForge Modpack' && !newServerVersion)) return;
    if (newServerType === 'CurseForge Modpack' && !selectedModpack) return;
    
    setIsCreatingServer(true);
    setDownloadProgress(0);

    try {
      if (newServerType === 'CurseForge Modpack') {
        const versionFilter = modpackVersionFilter || selectedModpack.latestFiles[0].gameVersions.find(v => v.includes('.'));
        // @ts-ignore
        const newId = await window.api.createServer(newServerName, 'Forge', versionFilter); // Dummy values, updated below
        
        // @ts-ignore
        window.api.onDownloadProgress(newId, (progress: number, text?: string) => {
          setDownloadProgress(progress)
          if (text) setDownloadText(text)
        });

        // @ts-ignore
        const result = await window.api.installCurseforgeModpack(newId, selectedModpack.id, versionFilter);
        
        if (result && result.isClientPack) {
          // @ts-ignore
          window.api.onDownloadProgress(newId, (progress: number, text?: string) => {
            setDownloadProgress(progress)
            if (text) setDownloadText(text)
          });
          // @ts-ignore
          await window.api.downloadServerJar(newId, result.modloader, result.version);
        }
      } else {
        // @ts-ignore
        const newId = await window.api.createServer(newServerName, newServerType, newServerVersion);
        
        // @ts-ignore
        window.api.onDownloadProgress(newId, (progress: number, text?: string) => {
          setDownloadProgress(progress)
          if (text) setDownloadText(text)
        });

        // @ts-ignore
        await window.api.downloadServerJar(newId, newServerType, newServerVersion);
      }

      showToast('Server Created Successfully!');
      setShowCreateModal(false);
      // @ts-ignore
      const data = await window.api.getServers();
      setServers(data);

      setNewServerName('');
      setNewServerType('Vanilla');
      setNewServerVersion('');
      setSelectedModpack(null);
    } catch (e: any) {
      alert("Error creating server: " + e.message);
    } finally {
      setIsCreatingServer(false);
    }
  }

  const handleDelete = (id: number) => {
    setServerToDelete(id);
  }

  const confirmDeleteServer = async () => {
    if (serverToDelete === null) return;
    try {
      // @ts-ignore
      await window.api.deleteServer(serverToDelete);
      if (activeServerId === serverToDelete) {
        setActiveServerId(null);
      }
      // @ts-ignore
      const data = await window.api.getServers();
      setServers(data);
    } catch (e: any) {
      alert("Failed to delete server: " + e.message);
    } finally {
      setServerToDelete(null);
    }
  }

  const handleStart = async (id: number) => {
    try {
      // @ts-ignore
      await window.api.startServer(id);
      setServers(servers.map(s => s.id === id ? { ...s, status: 'Online' } : s));
      showToast("Server is starting...");
    } catch (error) {
      alert("Backend Error: " + error);
    }
  }

  const handleClearLogs = () => {
    setLogs([])
  }

  const handleStop = async (id: number) => {
    // @ts-ignore
    await window.api.stopServer(id);
    setServers(servers.map(s => s.id === id ? { ...s, status: 'Offline' } : s));
    showToast("Server has been stopped.");
  }

  const handleRestart = async (id: number) => {
    try {
      // @ts-ignore
      await window.api.stopServer(id);
      setServers(servers.map(s => s.id === id ? { ...s, status: 'Offline' } : s));
      showToast("Server is restarting...");
      
      // Give the server a moment to fully shut down before starting again
      setTimeout(async () => {
        // @ts-ignore
        await window.api.startServer(id);
        setServers(servers.map(s => s.id === id ? { ...s, status: 'Online' } : s));
      }, 3000);
    } catch (error) {
      alert("Backend Error: " + error);
    }
  }


  const handleSendCommand = React.useCallback(async (cmd: string) => {
    if (!cmd.trim() || activeServerId === null) return;
    // @ts-ignore
    await window.api.sendCommand(activeServerId, cmd);
  }, [activeServerId]);

  const sendPlayerCommand = async (cmd: string, successMsg: string) => {
    if (activeServerId !== null && selectedPlayer) {
      // @ts-ignore
      await window.api.sendCommand(activeServerId, cmd.replace('{player}', selectedPlayer));
      showToast(successMsg.replace('{player}', selectedPlayer));
    }
  }

  const loadConfig = async (id: number) => {
    // @ts-ignore
    const data = await window.api.readConfig(id);
    setRawConfigText(data);
    const parsed: Record<string, string> = {};
    data.split('\n').forEach((line: string) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...val] = line.split('=');
        if (key && val) parsed[key.trim()] = val.join('=').trim();
      }
    });
    setProps(parsed);
  }

  const handleSaveConfig = async () => {
    if (activeServerId !== null) {
      let finalData = rawConfigText;
      Object.keys(props).forEach(key => {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(finalData)) {
          finalData = finalData.replace(regex, `${key}=${props[key]}`);
        } else {
          finalData += `\n${key}=${props[key]}`;
        }
      });
      // @ts-ignore
      await window.api.writeConfig(activeServerId, advancedMode ? rawConfigText : finalData);
      showToast("Settings saved! Restart server to apply.");
    }
  }

  const loadPlayers = async (id: number, type: string) => {
    // @ts-ignore
    const data = await window.api.readJson(id, type);
    setPlayerData(data);
  }

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName || activeServerId === null || playerListType === 'live') return;
    setIsProcessing(true);

    let uuid = "00000000-0000-0000-0000-000000000000";
    let name = newPlayerName.trim();

    if (playerListType !== 'banned-ips') {
      try {
        const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`);
        if (res.ok) {
          const profile = await res.json();
          uuid = profile.uuid;
          name = profile.username;
        }
      } catch (err) { }
    }

    let newEntry: any = { uuid, name };
    if (playerListType === 'ops') newEntry = { uuid, name, level: 4, bypassesPlayerLimit: false };
    else if (playerListType === 'banned-players') newEntry = { uuid, name, created: new Date().toISOString(), source: "Server", expires: "forever", reason: "Banned by operator." };
    else if (playerListType === 'banned-ips') newEntry = { ip: name, created: new Date().toISOString(), source: "Server", expires: "forever", reason: "Banned by operator." };

    const exists = playerData.some(p => p.name === name || p.ip === name);
    if (!exists) {
      const updatedList = [...playerData, newEntry];
      setPlayerData(updatedList);
      // @ts-ignore
      await window.api.writeJson(activeServerId, playerListType, updatedList);
      showToast(`Added ${name} to ${playerListType}`);
    }

    setNewPlayerName('');
    setIsProcessing(false);
  }

  const handleRemovePlayer = async (targetName: string) => {
    if (activeServerId === null) return;
    const updatedList = playerData.filter(p => p.name !== targetName && p.ip !== targetName);
    setPlayerData(updatedList);
    // @ts-ignore
    await window.api.writeJson(activeServerId, playerListType, updatedList);
    showToast(`Removed ${targetName}`);
  }

  // --- UI COMPONENTS ---




  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      // @ts-ignore
      await window.api.clearCache();
      setCacheSize(0);
      setToasts(prev => [...prev, { id: Date.now(), message: 'Cache successfully cleared!' }]);
    } catch (e: any) {
      setToasts(prev => [...prev, { id: Date.now(), message: `Failed to clear cache: ${e.message || e}` }]);
    } finally {
      setIsClearingCache(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  const activeServer = servers.find(s => s.id === activeServerId);

  return (
    <div className="bg-background font-body-md text-on-background w-full h-screen flex flex-col overflow-hidden">
      
      {/* TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-[8px] h-20 bg-surface/90 backdrop-blur-xl z-40 border-b border-outline-variant/20 shadow-lg">
        <div className="h-full px-gutter max-w-container-max mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-8">
            {/* LOGO */}
            <div className="flex items-center gap-3 cursor-default group">
              <h1 className="text-3xl font-sans text-white flex items-center whitespace-nowrap">
                <span className="text-brand mr-2 flex">
                  {"Omni".split("").map((char, i) => (
                    <span key={`omni-${i}`} className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110" style={{ transitionDelay: `${i * 30}ms` }}>{char}</span>
                  ))}
                </span>
                <span className="flex">
                  {"Host".split("").map((char, i) => (
                    <span key={`host-${i}`} className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110" style={{ transitionDelay: `${(i + 4) * 30}ms` }}>{char}</span>
                  ))}
                </span>
              </h1>
            </div>

            {/* NAVIGATION */}
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => { setActiveServerId(null); setActiveGameHub(null); }} className={`flex items-center gap-2 font-bold transition-all ${activeServerId === null && activeGameHub === null ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                <span className="font-label-md text-label-md">Dashboard</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            {/* Right side navbar items can go here in the future */}
            {activeServerId === null && activeGameHub === null && (
              <button
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="relative overflow-hidden group px-2.5 py-2 rounded-lg border bg-surface/40 border-outline-variant/30 text-on-surface-variant hover:text-red-400 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                title="Clear App Cache"
              >
                <span className={`material-symbols-outlined text-[20px] ${isClearingCache ? 'animate-spin' : ''}`}>
                  {isClearingCache ? 'sync' : 'delete'}
                </span>
                <span className="max-w-0 overflow-hidden group-hover:max-w-[200px] transition-all duration-300 ease-out whitespace-nowrap ml-0 group-hover:ml-2 text-sm font-semibold opacity-0 group-hover:opacity-100">
                  Clear {formatBytes(cacheSize)}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative pt-20 bg-background flex-1 overflow-y-auto w-full">
        <div className="flex flex-col w-full relative max-w-container-max mx-auto min-h-full">

          {/* DASHBOARD VIEW */}
          {activeServerId === null && activeGameHub === null && (
            <>
              {/* Background gradient */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none"></div>
              
              {/* Header */}
              <div className="px-gutter pt-stack-lg pb-stack-md relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
                <div>
                  <p className="font-label-md text-label-md text-primary tracking-widest uppercase mb-2">Command Center</p>
                  <h1 className="font-headline-xl text-headline-xl text-on-background mb-2">Welcome back, <span className="text-primary">Admin</span>.</h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">Select a Game Hub below to initiate configuration or view your active instances in the list.</p>
                </div>
              </div>

              {/* Game Hub Cards */}
              <div className="px-gutter py-stack-md relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Minecraft Hub */}
                  <div onClick={() => setActiveGameHub('Minecraft')} className="group relative rounded-xl overflow-hidden bg-surface-container h-[250px] flex flex-col justify-end transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] ring-1 hover:ring-primary cursor-pointer ring-surface-container-high">
                    <div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: `url('${getGameImageUrl('Minecraft')}')`}}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-60"></div>
                    <div className="relative z-20 p-6 flex flex-col gap-2 w-full">
                      <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1 shadow-black drop-shadow-md">Game Hub</p>
                      <h2 className="font-headline-lg text-headline-lg text-on-surface leading-tight group-hover:text-primary transition-colors drop-shadow-lg shadow-black">Minecraft</h2>
                    </div>
                  </div>

                  {/* Palworld Hub (Coming Soon) */}
                  <div className="group relative rounded-xl overflow-hidden bg-surface-container h-[250px] flex flex-col justify-end transition-all duration-300 ring-1 ring-surface-container-high opacity-60 grayscale cursor-not-allowed">
                    <div className="absolute inset-0 bg-cover bg-center z-0" style={{backgroundImage: `url('${getGameImageUrl('Palworld')}')`}}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent z-10"></div>
                    <div className="absolute top-4 right-4 z-20 bg-surface-container-lowest/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-surface-container-high">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Under Development</span>
                    </div>
                    <div className="relative z-20 p-6 flex flex-col gap-2 w-full">
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">Game Hub</p>
                      <h2 className="font-headline-lg text-headline-lg text-on-surface-variant leading-tight">Palworld</h2>
                    </div>
                  </div>

                  {/* DayZ Hub (Coming Soon) */}
                  <div className="group relative rounded-xl overflow-hidden bg-surface-container h-[250px] flex flex-col justify-end transition-all duration-300 ring-1 ring-surface-container-high opacity-60 grayscale cursor-not-allowed">
                    <div className="absolute inset-0 bg-cover bg-center z-0" style={{backgroundImage: `url('${getGameImageUrl('DayZ')}')`}}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/80 to-transparent z-10"></div>
                    <div className="absolute top-4 right-4 z-20 bg-surface-container-lowest/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-surface-container-high">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Under Development</span>
                    </div>
                    <div className="relative z-20 p-6 flex flex-col gap-2 w-full">
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-1">Game Hub</p>
                      <h2 className="font-headline-lg text-headline-lg text-on-surface-variant leading-tight">DayZ</h2>
                    </div>
                  </div>

                </div>
              </div>

              {/* Active Servers List Table */}
              <div className="px-gutter py-stack-lg relative z-10 w-full mb-10">
                <div className="flex flex-col gap-stack-md">
                  <div className="flex items-center justify-between border-b border-surface-container-high pb-4">
                    <h2 className="font-headline-lg text-headline-lg text-on-background">Active Servers List</h2>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-surface-container-high bg-surface-container-low">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-container-high/50 text-primary font-label-md text-label-md uppercase tracking-widest">
                        <tr className="border-b border-surface-container-high">
                          <th className="px-6 py-4">Server Name</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">IP Address</th>
                          <th className="px-6 py-4">Players</th>
                          <th className="px-6 py-4 text-right">Uptime</th>
                        </tr>
                      </thead>
                      <tbody className="font-body-md text-on-surface-variant">
                        {servers.filter(s => s.status === 'Online').length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant italic">No servers are currently running.</td>
                          </tr>
                        ) : (
                          servers.filter(s => s.status === 'Online').map(server => (
                            <tr key={server.id} onClick={() => { setActiveServerId(server.id); setActiveTab('console'); }} className="border-b border-surface-container-high/50 hover:bg-surface-container-high/80 hover:text-on-surface transition-colors cursor-pointer group">
                              <td className="px-6 py-4 font-bold group-hover:text-primary transition-colors">{server.name}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#4CAF50] shadow-[0_0_8px_rgba(76,175,80,0.8)]"></span>Active
                                </div>
                              </td>
                              <td className="px-6 py-4 font-label-sm tracking-wider">127.0.0.1:{server.port}</td>
                              <td className="px-6 py-4">0/20</td>
                              <td className="px-6 py-4 text-right">Running</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* GAME HUB VIEW */}
          {activeServerId === null && activeGameHub !== null && (
            <div className="flex-1 overflow-y-auto relative min-h-0 flex flex-col">
              <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{backgroundImage: `url('${getGameImageUrl(activeGameHub)}')`}}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40 z-0 pointer-events-none"></div>
              
              <div className="relative z-10 px-gutter pt-stack-lg pb-stack-lg flex flex-col gap-6">
                <button onClick={() => setActiveGameHub(null)} className="self-start flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md uppercase tracking-widest mb-2">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Dashboard
                </button>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-surface-container-high pb-6">
                  <div>
                    <h1 className="font-headline-xl text-headline-xl text-on-background">{activeGameHub} Hub</h1>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-2">Manage your available {activeGameHub} servers or create a new one.</p>
                  </div>
                  <button onClick={() => setShowCreateModal(true)} className="bg-primary text-on-primary hover:bg-primary/90 transition-all px-8 py-3 rounded-xl font-label-lg text-label-lg flex items-center gap-2 shadow-[0_0_20px_rgba(233,196,0,0.3)] hover:scale-105 active:scale-95">
                    <span className="material-symbols-outlined">add_box</span>
                    NEW {activeGameHub.toUpperCase()} SERVER
                  </button>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                  <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Available Servers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servers.filter(s => s.game.toLowerCase().includes(activeGameHub.toLowerCase())).length === 0 ? (
                      <div className="col-span-full py-16 text-center border border-dashed border-surface-container-high rounded-xl bg-surface-container-lowest">
                        <p className="text-on-surface-variant italic font-body-lg text-body-lg">No servers found for {activeGameHub}.</p>
                      </div>
                    ) : (
                      servers.filter(s => s.game.toLowerCase().includes(activeGameHub.toLowerCase())).map(server => (
                        <div key={server.id} onClick={() => { setActiveServerId(server.id); setActiveTab('console'); }} className="group relative rounded-xl overflow-hidden bg-surface-container-low p-6 flex flex-col gap-4 border border-surface-container-high hover:border-primary transition-all cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                          <div className="flex justify-between items-start">
                            <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">{server.name}</h3>
                            <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border border-surface-container-highest">
                              {server.status === 'Online' ? (
                                <><span className="w-2 h-2 rounded-full bg-[#4CAF50] shadow-[0_0_8px_rgba(76,175,80,0.8)]"></span><span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Online</span></>
                              ) : (
                                <><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span><span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Offline</span></>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 mt-4">
                            <p className="font-label-md text-label-md text-on-surface-variant flex items-center gap-3">
                              <span className="material-symbols-outlined text-lg opacity-70">memory</span> {server.type} {server.version}
                            </p>
                            <p className="font-label-md text-label-md text-on-surface-variant flex items-center gap-3">
                              <span className="material-symbols-outlined text-lg opacity-70">public</span> 127.0.0.1:{server.port}
                            </p>
                          </div>
                          
                          <div className="mt-6 pt-4 border-t border-surface-container-high flex justify-end">
                            <button className="text-primary font-label-md text-label-md uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
                              Manage <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ACTIVE SERVER VIEW */}
        {activeServer !== undefined && activeServerId !== null && (
          <>
            <div className="bg-[#0a0a0a] border-b border-white/5 p-6 flex flex-col gap-6 shadow-sm z-10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveServerId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10 flex items-center justify-center group" title="Back to Dashboard">
                    <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                  </button>
                  <h2 className="text-2xl font-bold text-white drop-shadow-md">{activeServer.name}</h2>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex bg-[#050505]/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-lg overflow-hidden transition-all hover:border-white/30">
                    <button onClick={handleTunnel} title={tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel'} className={`relative overflow-hidden group px-4 py-2.5 transition-all flex items-center justify-center ${tunnelStatus === 'Online' ? 'bg-brand/10 text-brand hover:bg-brand/20' : tunnelStatus === 'Starting...' ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
                      <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' ? 'sync' : 'cell_tower'}</span>
                    </button>
                    <button onClick={() => { setTempTunnelIp(tunnelIp); setShowTunnelModal(true); }} className="px-3 border-l border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center" title="Tunnel IP Settings">
                      <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
                    </button>
                  </div>
                  <button onClick={() => handleDelete(activeServer.id)} className="relative overflow-hidden group bg-[#050505]/60 backdrop-blur-xl border border-white/10 border-t-white/30 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] px-6 py-2.5 rounded-lg font-bold transition-all hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
                    <span className="relative z-10">DELETE</span>
                  </button>
                  <button onClick={() => activeServer.status === 'Online' ? handleStop(activeServer.id) : handleStart(activeServer.id)} className={`relative overflow-hidden group bg-[#050505]/60 backdrop-blur-xl border border-white/10 border-t-white/30 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] px-8 py-2.5 rounded-lg font-bold transition-all ${activeServer.status === 'Online' ? 'hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300' : 'hover:border-green-500/60 hover:shadow-[0_8px_32px_rgba(74,222,128,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-green-400 hover:text-green-300'}`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
                    <span className="relative z-10">{activeServer.status === 'Online' ? 'STOP' : 'START'}</span>
                  </button>
                  <button onClick={() => handleRestart(activeServer.id)} className="relative overflow-hidden group bg-[#050505]/60 backdrop-blur-xl border border-white/10 border-t-white/30 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] px-8 py-2.5 rounded-lg font-bold transition-all hover:border-brand/60 hover:shadow-[0_8px_32px_rgba(255,215,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-brand hover:text-yellow-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
                    <span className="relative z-10">RESTART</span>
                  </button>
                </div>
              </div>

              {/* Sub Top Nav Bar for Server Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'overview', label: 'Overview', icon: 'dashboard' },
                  { id: 'console', label: 'Console', icon: 'terminal' },
                  { id: 'options', label: 'Options', icon: 'settings' },
                  { id: 'players', label: 'Players', icon: 'group' },
                  { id: 'mods', label: 'Mods', icon: 'extension' },
                  { id: 'software', label: 'Software', icon: 'memory' },
                  { id: 'files', label: 'Files', icon: 'folder' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-md text-label-md transition-all whitespace-nowrap ${
                      activeTab === tab.id 
                      ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(233,196,0,0.1)]' 
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col bg-surface-container-lowest">
              
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <OverviewTab 
                  statsHistory={statsHistory}
                  serverStatus={activeServer.status as 'Online' | 'Offline'}
                  serverVersion={serverMeta ? `${serverMeta.type} ${serverMeta.version}` : 'Loading...'}
                  onlinePlayers={onlinePlayers}
                  maxPlayers={activeServer.maxPlayers || 20}
                  logs={logs}
                  maxRam={serverMeta?.ram ? Number(serverMeta.ram) : 2}
                  maxCpu={serverMeta?.cpu ? Number(serverMeta.cpu) : 2}
                />
              )}

              {/* TAB: CONSOLE */}
              {activeTab === 'console' && (
                <ConsoleTab 
                  logs={logs}
                  endOfLogsRef={endOfLogsRef}
                  handleSendCommand={handleSendCommand}
                  handleClearLogs={handleClearLogs}
                  onlinePlayers={onlinePlayers}
                />
              )}

              {activeTab === 'options' && (
                <OptionsTab 
                  serverId={activeServerId as number}
                  advancedMode={advancedMode}
                  setAdvancedMode={setAdvancedMode}
                  handleSaveConfig={handleSaveConfig}
                  rawConfigText={rawConfigText}
                  setRawConfigText={setRawConfigText}
                  props={props}
                  setProps={setProps}
                  onConfigSaved={fetchServerMeta}
                />
              )}

              {activeTab === 'players' && (
                <PlayersTab
                  selectedPlayer={selectedPlayer}
                  setSelectedPlayer={setSelectedPlayer}
                  playerListType={playerListType}
                  setPlayerListType={setPlayerListType}
                  newPlayerName={newPlayerName}
                  setNewPlayerName={setNewPlayerName}
                  isProcessing={isProcessing}
                  onlinePlayers={onlinePlayers}
                  playerData={playerData}
                  handleAddPlayer={handleAddPlayer}
                  handleRemovePlayer={handleRemovePlayer}
                  playerInventory={playerInventory}
                  sendPlayerCommand={sendPlayerCommand}
                />
              )}
              {activeTab === 'files' && (
                <FilesTab serverId={activeServerId} />
              )}

              {/* TAB: MODS */}
              {activeTab === 'mods' && (
                <div className="absolute inset-0 p-8 overflow-y-auto">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">Mod Manager</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {serverMeta ? `Server Type: ${serverMeta.type} ${serverMeta.version}` : 'Loading server info...'}
                      </p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="bg-gray-900/50 p-1 rounded-lg border border-gray-800 flex">
                         <button onClick={() => setModViewType('browse')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${modViewType === 'browse' ? 'bg-brand text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Browse</button>
                         <button onClick={() => setModViewType('installed')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${modViewType === 'installed' ? 'bg-brand text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Installed ({installedMods.length})</button>
                      </div>
                    </div>
                  </div>

                  {serverMeta && (
                    <>
                      {modViewType === 'browse' && (
                        <div className="animate-in fade-in duration-300">
                          {/* TOP CONTROLS */}
                          <div className="flex flex-col md:flex-row justify-between items-center bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a] mb-4 text-[#bfbfbf] text-sm">
                            <div className="relative">
                              <button onClick={() => setIsClassMenuOpen(!isClassMenuOpen)} className="flex items-center gap-2 hover:text-white px-3 py-1 font-bold">
                                {classOptions.find(c => c.id === activeClassId)?.name || 'Mods'}
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                              </button>
                              {isClassMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-[#2a2a2a] border border-[#3a3a3a] rounded-md shadow-2xl z-50 py-2">
                                  {classOptions.map(cls => (
                                    <div key={cls.id} onClick={() => { setActiveClassId(cls.id); setIsClassMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-[#3a3a3a] ${activeClassId === cls.id ? 'text-white font-bold' : 'text-[#bfbfbf]'}`}>
                                      {cls.name} {activeClassId === cls.id && <span className="float-right">✓</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="hidden md:block">
                              {totalModCount > 0 ? '10,000+ Projects found' : '0 Projects found'}
                            </div>

                            <div className="flex items-center gap-4">
                              <select value={activeSortField} onChange={(e) => setActiveSortField(Number(e.target.value))} className="bg-transparent text-[#bfbfbf] outline-none cursor-pointer hover:text-white font-bold">
                                <option value={1} className="bg-[#1a1a1a]">Sort: Featured</option>
                                <option value={2} className="bg-[#1a1a1a]">Sort: Popularity</option>
                                <option value={3} className="bg-[#1a1a1a]">Sort: Last Updated</option>
                                <option value={4} className="bg-[#1a1a1a]">Sort: Name</option>
                              </select>
                              
                              <div className="flex items-center gap-2 border-l border-[#3a3a3a] pl-4 cursor-pointer hover:text-white font-bold">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                                Filters
                              </div>
                            </div>
                          </div>

                          <form onSubmit={(e) => handleSearchMods(e)} className="mb-6 flex gap-3">
                            <input type="text" placeholder={`Search ${serverMeta?.type} ${classOptions.find(c => c.id === activeClassId)?.name.toLowerCase()}...`} value={modSearchQuery} onChange={(e) => setModSearchQuery(e.target.value)} className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-6 py-3 text-white outline-none focus:border-[#4a4a4a] shadow-inner text-base" disabled={isSearchingMods} />
                            <button type="submit" disabled={isSearchingMods} className="px-8 bg-[#3a3a3a] hover:bg-[#4a4a4a] rounded-lg font-bold transition-all disabled:opacity-50 text-white shadow-lg">{isSearchingMods ? 'Searching...' : 'Search'}</button>
                          </form>

                          {modResults.length === 0 && !isSearchingMods && modSearchQuery && (
                            <div className="text-center text-gray-500 mt-20">No projects found. Try a different search.</div>
                          )}

                          <div className="flex flex-col gap-[1px] bg-[#2a2a2a] border border-[#2a2a2a] rounded overflow-hidden shadow-lg">
                            {modResults.map((mod: any) => {
                               const isInstalled = installedMods.some(m => m.name.toLowerCase().includes(mod.slug?.replace(/-/g, '') || mod.name.toLowerCase().replace(/ /g, '')));
                               return (
                                <React.Fragment key={mod.id}>
                                  <div className="bg-[#1e1e1e] p-4 flex gap-4 group transition-colors hover:bg-[#252525]">
                                    <img src={mod.logo?.thumbnailUrl || 'https://via.placeholder.com/128'} alt={mod.name} className="w-[84px] h-[84px] rounded shadow-md bg-[#111111] object-cover flex-shrink-0" />
                                  
                                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-[#e0e0e0] text-lg truncate group-hover:text-white transition-colors">{mod.name}</h4>
                                        <span className="text-sm text-[#888888]">by <span className="text-[#cccccc]">{mod.authors?.[0]?.name}</span></span>
                                      </div>
                                      <p className="text-sm text-[#aaaaaa] line-clamp-1 mb-3">{mod.summary}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-auto w-full">
                                       <div className="flex flex-wrap items-center gap-1.5">
                                         <span className="text-[11px] bg-[#333333] text-[#cccccc] px-2 py-0.5 rounded border border-[#444444] font-semibold">{classOptions.find(c => c.id === activeClassId)?.name || 'Mods'}</span>
                                         {mod.categories?.slice(0, 3).map((cat: any) => (
                                           <span key={cat.id} className="text-[11px] text-[#aaaaaa] px-1 font-semibold">{cat.name}</span>
                                         ))}
                                         {mod.categories?.length > 3 && <span className="text-[11px] text-[#888888]">+{mod.categories.length - 3}</span>}
                                       </div>

                                       <div className="flex items-center gap-4 text-xs text-[#888888] shrink-0 font-semibold">
                                         <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9.5 14h1v1h-1v-1zm1-8h-1v6h1V6z"/></svg> {(mod.downloadCount / 1000000).toFixed(1)}M</span>
                                         <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> {new Date(mod.dateModified).toLocaleDateString()}</span>
                                         {mod.latestFiles?.[0]?.fileLength && <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg> {(mod.latestFiles[0].fileLength / 1024).toFixed(2)} KB</span>}
                                         {serverMeta && <span className="flex items-center gap-1.5 text-[#aaaaaa]"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 01-1-1V4a1 1 0 011-1h3a1 1 0 001-1v-1z"></path></svg> {serverMeta.version} • {serverMeta.type}</span>}
                                       </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-center ml-4 shrink-0">
                                    <button onClick={() => handleInstallMod(mod)} disabled={installingModId !== null || isInstalled} className={`px-5 py-2 rounded-md font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${isInstalled ? 'bg-[#333333] text-[#aaaaaa]' : 'bg-[#e25822] hover:bg-[#ff6922] text-white'}`}>
                                      {isInstalled ? 'Installed' : installingModId === mod.id ? 'Installing...' : 'Install'}
                                    </button>
                                  </div>
                                </div>
                                {installingModId === mod.id && (
                                  <div className="bg-[#1a1a1a] px-4 py-2 text-xs text-[#00ff88] border-b border-[#2a2a2a] animate-pulse">
                                    {installProgressText}
                                  </div>
                                )}
                              </React.Fragment>
                            )})}
                          </div>
                        </div>
                      )}

                      {modViewType === 'installed' && (
                        <div className="animate-in fade-in duration-300">
                          {installedMods.length === 0 ? (
                            <div className="text-center text-gray-500 mt-20">No mods installed yet.</div>
                          ) : (
                            <div className="bg-darkCard border border-gray-800 rounded-xl overflow-hidden shadow-md">
                              <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-gray-900/50 border-b border-gray-800 text-gray-400 uppercase font-bold text-xs">
                                  <tr>
                                    <th className="px-6 py-4">File Name</th>
                                    <th className="px-6 py-4 w-32">Size</th>
                                    <th className="px-6 py-4 w-24 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {installedMods.map((mod: any, idx) => (
                                    <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                      <td className="px-6 py-4 font-mono font-bold text-gray-200">{mod.name}</td>
                                      <td className="px-6 py-4 text-gray-500">{(mod.size / 1024 / 1024).toFixed(2)} MB</td>
                                      <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDeleteMod(mod.name)} className="text-red-400 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded text-xs font-bold transition-colors">Delete</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB: SOFTWARE */}
              {activeTab === 'software' && (
                <div className="h-full flex flex-col p-8">
                  <h3 className="text-2xl font-bold text-[#FFD700] mb-6">Change Software</h3>
                  
                  {isChangingSoftware ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h4 className="text-xl font-bold text-white mb-2">Changing Software</h4>
                      <p className="text-gray-400">{downloadText}</p>
                      {downloadProgress > 0 && (
                        <div className="w-full max-w-md bg-gray-800 rounded-full h-2 mt-4 overflow-hidden">
                          <div className="bg-[#FFD700] h-2 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 max-w-xl">
                      <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Software Type</label>
                        <select 
                          value={editingSoftwareType}
                          onChange={e => setEditingSoftwareType(e.target.value)}
                          className="w-full bg-[#050505] border border-gray-800 rounded p-3 text-white outline-none focus:border-[#FFD700] shadow-inner"
                        >
                          <option>Vanilla</option>
                          <option>Paper</option>
                          <option>Fabric</option>
                          <option>Forge</option>
                          <option>NeoForge</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Minecraft Version</label>
                        <select 
                          value={editingSoftwareVersion}
                          onChange={e => setEditingSoftwareVersion(e.target.value)}
                          className="w-full bg-[#050505] border border-gray-800 rounded p-3 text-white outline-none focus:border-[#FFD700] shadow-inner"
                        >
                          {editingAvailableVersions.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>

                      <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 mt-4">
                        <p className="text-sm text-yellow-500 font-bold mb-1">Warning: Mod Compatibility</p>
                        <p className="text-xs text-yellow-600">Changing software versions or types may cause compatibility issues with installed mods. Old mods will be moved to a backup folder.</p>
                      </div>

                      <button 
                        onClick={async () => {
                          if (!activeServerId) return;
                          setIsChangingSoftware(true);
                          setDownloadProgress(0);
                          setDownloadText('Preparing...');
                          
                          try {
                            // @ts-ignore
                            window.api.onDownloadProgress(activeServerId, (progress: number, text?: string) => {
                               setDownloadProgress(progress);
                               if (text) setDownloadText(text);
                            });

                            // @ts-ignore
                            await window.api.changeServerSoftware(activeServerId, editingSoftwareType, editingSoftwareVersion);
                            
                            // Re-download the jar
                            // @ts-ignore
                            await window.api.downloadServerJar(activeServerId, editingSoftwareType, editingSoftwareVersion);
                            
                            // Show success
                            setDownloadText('Software updated successfully!');
                            setDownloadProgress(100);
                            
                            // Let the UI catch up
                            setTimeout(() => {
                              setIsChangingSoftware(false);
                              // Refetch meta to update view
                              fetchServerMeta();
                              // Update the servers list globally
                              // @ts-ignore
                              window.api.getServers().then(setServers);
                            }, 1500);

                          } catch (err: any) {
                            console.error(err);
                            setDownloadText('Error: ' + err.message);
                            setTimeout(() => setIsChangingSoftware(false), 3000);
                          }
                        }}
                        disabled={!editingSoftwareVersion}
                        className="mt-4 bg-gradient-to-br from-[#FFD700] to-[#D4AF37] text-black font-black py-3 px-6 rounded hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                      >
                        Apply Changes
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
      </main>

      {/* TOAST SYSTEM */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="bg-gray-800/95 backdrop-blur-sm border border-gray-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 fade-in duration-300">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* CREATE SERVER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className={`bg-[#0a0a0a] p-8 rounded-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.1)] w-full relative overflow-hidden ${newServerType === 'CurseForge Modpack' ? 'max-w-4xl' : 'max-w-md'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-md">Create New Server</h2>
              
              <div className={`flex gap-8 ${newServerType === 'CurseForge Modpack' ? 'flex-row' : 'flex-col'}`}>
                
                {/* Left Column (Always visible) */}
                <div className={`space-y-4 ${newServerType === 'CurseForge Modpack' ? 'w-1/3' : 'w-full'}`}>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Server Name</label>
                    <input 
                      type="text" 
                      value={newServerName}
                      onChange={e => setNewServerName(e.target.value)}
                      className="w-full bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand shadow-inner"
                      placeholder="My Awesome Server"
                      disabled={isCreatingServer}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Software Type</label>
                    <select 
                      value={newServerType}
                      onChange={e => setNewServerType(e.target.value)}
                      className="w-full bg-[#050505] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand shadow-inner"
                      disabled={isCreatingServer}
                    >
                    <option value="Vanilla">Vanilla (Official)</option>
                    <option value="Paper">Paper (Optimized)</option>
                    <option value="Fabric">Fabric (Mods)</option>
                    <option value="Forge">Forge (Mods)</option>
                    <option value="NeoForge">NeoForge (Mods)</option>
                    <option value="CurseForge Modpack">CurseForge Modpack</option>
                  </select>
                </div>

                {newServerType !== 'CurseForge Modpack' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">Minecraft Version</label>
                    <select 
                      value={newServerVersion}
                      onChange={e => setNewServerVersion(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand"
                      disabled={isCreatingServer || availableVersions.length === 0}
                    >
                      {availableVersions.length === 0 ? (
                        <option>Loading versions...</option>
                      ) : (
                        availableVersions.map(v => <option key={v} value={v}>{v}</option>)
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Right Column (Modpack Browser) */}
              {newServerType === 'CurseForge Modpack' && (
                <div className="w-2/3 flex flex-col border-l border-gray-800/50 pl-8">
                  <div className="flex gap-4 mb-4">
                    <input 
                      type="text" 
                      placeholder="Search Modpacks..." 
                      className="flex-1 bg-[#0a0a0f] border border-gray-800 rounded p-2 text-white outline-none focus:border-brand"
                      value={modpackSearch}
                      onChange={e => setModpackSearch(e.target.value)}
                    />
                    <select 
                      className="bg-[#0a0a0f] border border-gray-800 rounded p-2 text-white outline-none"
                      value={modpackVersionFilter}
                      onChange={e => setModpackVersionFilter(e.target.value)}
                    >
                      <option value="">All Versions</option>
                      <option value="1.20.1">1.20.1</option>
                      <option value="1.19.2">1.19.2</option>
                      <option value="1.18.2">1.18.2</option>
                      <option value="1.16.5">1.16.5</option>
                    </select>
                    <select 
                      className="bg-[#0a0a0f] border border-gray-800 rounded p-2 text-white outline-none"
                      value={modpackLoaderFilter}
                      onChange={e => setModpackLoaderFilter(e.target.value)}
                    >
                      <option value="">Any Loader</option>
                      <option value="Forge">Forge</option>
                      <option value="Fabric">Fabric</option>
                      <option value="NeoForge">NeoForge</option>
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[400px] bg-[#0a0a0f] rounded-lg border border-gray-800 p-2 space-y-2 relative">
                    {isSearchingPacks && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold">Searching...</span>
                      </div>
                    )}
                    {modpacks.length === 0 && !isSearchingPacks && (
                      <div className="text-gray-500 text-center py-8">No modpacks found.</div>
                    )}
                    {modpacks.map(pack => (
                      <div 
                        key={pack.id} 
                        onClick={() => setSelectedModpack(pack)}
                        className={`flex gap-4 p-3 rounded-lg cursor-pointer transition-colors border ${selectedModpack?.id === pack.id ? 'bg-brand/20 border-brand' : 'hover:bg-gray-800/50 border-transparent'}`}
                      >
                        <img src={pack.logo?.thumbnailUrl || undefined} alt={pack.name} className="w-16 h-16 rounded-md object-cover" />
                        <div className="flex-1 overflow-hidden">
                          <h3 className="text-white font-bold truncate">{pack.name}</h3>
                          <p className="text-xs text-gray-400 truncate">{pack.summary}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-300">{pack.downloadCount.toLocaleString()} DLs</span>
                            {pack.latestFiles[0]?.gameVersions[0] && (
                               <span className="text-xs bg-brand/20 text-brand px-2 py-0.5 rounded">{pack.latestFiles[0].gameVersions[0]}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isCreatingServer && (
              <div className="mt-6">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{downloadText}</span>
                  <span>{downloadProgress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div className="bg-brand h-2 rounded-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                disabled={isCreatingServer}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateServer}
                disabled={isCreatingServer || !newServerName || (newServerType === 'CurseForge Modpack' ? !selectedModpack : !newServerVersion)}
                className="bg-brand hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-bold shadow-lg transition-colors"
              >
                {isCreatingServer ? 'Creating...' : 'Create Server'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {serverToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface/80 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative">
            
            {/* Glow effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-red-500/20 rounded-full blur-[60px] pointer-events-none"></div>

            <div className="p-8 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.2)]">
                  <span className="material-symbols-outlined text-3xl">warning</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-on-surface">Delete Server</h2>
                  <p className="text-on-surface-variant text-sm">This action cannot be undone.</p>
                </div>
              </div>
              
              <p className="text-on-surface-variant mb-8 leading-relaxed">
                Are you sure you want to permanently delete <span className="text-white font-bold">{servers.find(s => s.id === serverToDelete)?.name}</span>? All files, worlds, and configurations will be lost.
              </p>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setServerToDelete(null)}
                  className="px-5 py-2.5 rounded-lg font-bold text-on-surface-variant hover:text-white hover:bg-surface-bright/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteServer}
                  className="px-5 py-2.5 rounded-lg font-bold bg-[#050505]/60 backdrop-blur-xl border border-white/10 border-t-white/30 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] text-red-400 hover:text-red-300 hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* TUNNEL SETTINGS MODAL */}
      {showTunnelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface/80 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden relative">
            <div className="p-6 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand/10 w-14 h-14 flex items-center justify-center rounded-xl border border-brand/30 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                  <span className="material-symbols-outlined text-brand text-3xl leading-none">cell_tower</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 drop-shadow-md">Tunnel Configuration</h2>
                  <p className="text-sm text-on-surface-variant">Set the remote IP address for FRP</p>
                </div>
              </div>
              
              <div className="mb-8">
                <label className="block text-sm font-bold text-on-surface-variant mb-2">Remote Server IP</label>
                <input 
                  type="text" 
                  value={tempTunnelIp}
                  onChange={(e) => setTempTunnelIp(e.target.value)}
                  placeholder="e.g. 34.131.235.17"
                  className="w-full bg-surface-container-lowest/50 border border-outline-variant/50 focus:border-brand/70 rounded-lg px-4 py-3 text-white outline-none transition-colors"
                />
                <p className="text-xs text-on-surface-variant/60 mt-2">
                  This IP will be used to generate the frpc.toml configuration. Changes take effect on the next tunnel start.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowTunnelModal(false)}
                  className="px-5 py-2.5 rounded-lg font-bold text-on-surface-variant hover:text-white hover:bg-surface-bright/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setTunnelIp(tempTunnelIp);
                    localStorage.setItem('tunnelIp', tempTunnelIp);
                    setShowTunnelModal(false);
                    showToast("Tunnel IP updated!");
                  }}
                  className="bg-brand/10 border border-brand/50 text-brand shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:bg-brand/20 px-6 py-2.5 rounded-lg font-bold transition-all uppercase tracking-wider text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
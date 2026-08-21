import React, { useState, useEffect, useRef } from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';
import { ConsoleTab } from '../../tabs/ConsoleTab';
import { OptionsTab } from '../../tabs/OptionsTab';
import { PlayersTab } from '../../tabs/PlayersTab';
import { FilesTab } from '../../tabs/FilesTab';
import { BackupsTab } from '../../tabs/BackupsTab';
import { OverviewTab } from '../../tabs/OverviewTab';
import { AnimatedBackground } from '../../AnimatedBackground';
import minecraftBg from './assets/minecraft-bg.png';
import palworldBg from './assets/palworld-bg.jpg';
import dayzBg from './assets/dayz-bg.jpg';
import satisfactoryBg from './assets/satisfactory-bg.jpg';

const supportedGameHubs = ['Minecraft', 'DayZ'];
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

export function MinecraftHub({ activeServerId, activeServer, setActiveServerId, handleStart, handleStop, handleRestart, handleDelete, handleTunnel, tunnelStatus, radminIp, tunnelIp, setTempTunnelIp, setShowTunnelModal, servers, showToast, logs, setLogs, onlinePlayers, statsHistory }: any) {
  
        const [activeTab, setActiveTab] = useState<'overview' | 'console' | 'options' | 'players' | 'software' | 'mods' | 'files' | 'backups'>('overview');

  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadText, setDownloadText] = useState('');
  const [showModpackPrompt, setShowModpackPrompt] = useState(false);

        

  const [rawConfigText, setRawConfigText] = useState('')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [props, setProps] = useState<Record<string, string>>({})

  const [playerListType, setPlayerListType] = useState<'live' | 'history' | 'whitelist' | 'ops' | 'banned-players' | 'banned-ips'>('live')
  const [playerData, setPlayerData] = useState<any[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Performance Stats


  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [playerInventory, setPlayerInventory] = useState<any[] | null>(null)
  
                          
  // SteamCMD States
  // Modpack States
                
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
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const [totalModCount, setTotalModCount] = useState<number>(0)

  // Software Switching States
  const [editingSoftwareType, setEditingSoftwareType] = useState('Vanilla')
  const [editingSoftwareVersion, setEditingSoftwareVersion] = useState('')
  const [editingAvailableVersions, setEditingAvailableVersions] = useState<string[]>([])
  const [editingLoaderVersion, setEditingLoaderVersion] = useState('')
  const [editingAvailableLoaderVersions, setEditingAvailableLoaderVersions] = useState<string[]>([])
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false)
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false)
  const [isLoaderMenuOpen, setIsLoaderMenuOpen] = useState(false)
  const [isChangingSoftware, setIsChangingSoftware] = useState(false)
  const endOfLogsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when logs change
    if (activeTab === 'console') {
      endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);



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
    if (activeTab === 'software' && ['Forge', 'Fabric', 'NeoForge'].includes(editingSoftwareType) && editingSoftwareVersion) {
      const fetchLoaderVersions = async () => {
        // @ts-ignore
        const loaders = await window.api.getLoaderVersions(editingSoftwareType, editingSoftwareVersion);
        setEditingAvailableLoaderVersions(loaders);
        // If current server has a loaderVersion, try to select it, else top
        if (serverMeta && serverMeta.loaderVersion && loaders.includes(serverMeta.loaderVersion)) {
           setEditingLoaderVersion(serverMeta.loaderVersion);
        } else {
           setEditingLoaderVersion(loaders.length > 0 ? loaders[0] : '');
        }
      }
      fetchLoaderVersions();
    } else {
      setEditingAvailableLoaderVersions([]);
      setEditingLoaderVersion('');
    }
  }, [activeTab, editingSoftwareType, editingSoftwareVersion, serverMeta]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (selectedPlayer && activeServerId !== null) {
      const fetchInv = async () => {
        // @ts-ignore
        const inv = await window.api.getInventory(activeServerId, selectedPlayer);
        setPlayerInventory(inv);
      };
      fetchInv();
      if (playerListType === 'live') {
        interval = setInterval(fetchInv, 3000);
      }
    }
    return () => { if (interval) clearInterval(interval); };
  }, [selectedPlayer, activeServerId, playerListType]);

  const fetchServerMeta = async () => {
    if (activeServerId === null) return;
    // @ts-ignore
    const meta = await window.api.getServerMeta(activeServerId);
    setServerMeta(meta);
  };

  useEffect(() => {
    if (activeServerId !== null) {
      fetchServerMeta();
      // State is preserved in dictionary, no longer cleared
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
  const handleClearLogs = () => {
    if (activeServerId !== null) {
      setLogs(prev => prev.filter(l => l.id !== activeServerId.toString() && l.id !== 'global'));
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
    if (type === 'live') {
      setPlayerData([]);
      return;
    }
    if (type === 'history') {
      // @ts-ignore
      const stats = await window.api.getPlayerStats(id);
      setPlayerData(stats ? Object.values(stats) : []);
    } else {
      // @ts-ignore
      const data = await window.api.readJson(id, type);
      setPlayerData(data || []);
    }
  }

  useEffect(() => {
    if (activeServerId !== null && activeTab === 'players' && playerListType !== 'live') {
      loadPlayers(activeServerId, playerListType);
    }
  }, [activeServerId, activeTab, playerListType]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName || activeServerId === null || playerListType === 'live' || playerListType === 'history') return;
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
    const activeLogs = activeServerId ? logs.filter(l => l.id === activeServerId.toString() || l.id === 'global').map(l => l.msg) : [];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
            <AnimatedBackground />
            
            <div className="glass-panel p-6 flex flex-col gap-6 z-10 border-b-0 rounded-b-none">
              <div className="flex justify-between items-center relative z-20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setActiveServerId(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10 flex items-center justify-center group" title="Back to Dashboard">
                    <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                  </button>
                  <h2 className="text-2xl font-bold text-white drop-shadow-md">{activeServer.name}</h2>
                </div>
                <div className="flex gap-3 items-center">
                  <div className="flex glass-panel rounded-lg overflow-hidden transition-all hover:border-white/30">
                    {activeServer?.game === 'DayZ' && radminIp && (
                      <div className="px-4 py-2.5 flex items-center justify-center text-brand font-bold text-sm bg-brand/5 border-r border-white/10" title="Radmin VPN IP (Share with friends)">
                        IP: {radminIp}
                      </div>
                    )}
                    <button onClick={handleTunnel} title={activeServer?.game === 'DayZ' ? 'Open Radmin VPN' : (tunnelStatus === 'Online' ? 'Stop Tunnel' : tunnelStatus === 'Starting...' ? 'Starting...' : 'Start Tunnel')} className={`relative overflow-hidden group px-4 py-2.5 transition-all flex items-center justify-center ${activeServer?.game === 'DayZ' ? 'text-brand hover:bg-brand/10' : tunnelStatus === 'Online' ? 'bg-brand/10 text-brand hover:bg-brand/20' : tunnelStatus === 'Starting...' ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}>
                      <span className={`material-symbols-outlined text-[20px] leading-none ${tunnelStatus === 'Starting...' && activeServer?.game !== 'DayZ' ? 'animate-spin' : ''}`}>{tunnelStatus === 'Starting...' && activeServer?.game !== 'DayZ' ? 'sync' : (activeServer?.game === 'DayZ' ? 'lan' : 'cell_tower')}</span>
                    </button>
                    <button onClick={() => { if (activeServer?.game !== 'DayZ') { setTempTunnelIp(tunnelIp); setShowTunnelModal(true); } }} className={`px-3 border-l border-white/10 ${activeServer?.game === 'DayZ' ? 'opacity-50 cursor-not-allowed text-gray-600' : 'hover:bg-white/10 text-gray-400 hover:text-white'} transition-colors flex items-center justify-center`} title={activeServer?.game === 'DayZ' ? "No settings for Radmin VPN" : "Tunnel IP Settings"}>
                      <span className="material-symbols-outlined text-[18px] leading-none">settings</span>
                    </button>
                  </div>
                  <button onClick={() => handleDelete(activeServer.id)} className="relative overflow-hidden group glass-panel px-6 py-2.5 rounded-lg font-bold transition-all hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
                    <span className="relative z-10">DELETE</span>
                  </button>
                  <button onClick={() => activeServer.status === 'Online' ? handleStop(activeServer.id) : handleStart(activeServer.id)} className={`relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all ${activeServer.status === 'Online' ? 'hover:border-red-500/60 hover:shadow-[0_8px_32px_rgba(248,113,113,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-red-400 hover:text-red-300' : 'hover:border-green-500/60 hover:shadow-[0_8px_32px_rgba(74,222,128,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-green-400 hover:text-green-300'}`}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
                    <span className="relative z-10">{activeServer.status === 'Online' ? 'STOP' : 'START'}</span>
                  </button>
                  <button onClick={() => handleRestart(activeServer.id)} className="relative overflow-hidden group glass-panel px-8 py-2.5 rounded-lg font-bold transition-all hover:border-brand/60 hover:shadow-[0_8px_32px_rgba(76,175,80,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-brand hover:text-green-300">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
                    <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
                    <span className="relative z-10">RESTART</span>
                  </button>
                </div>
              </div>

              {/* Sub Top Nav Bar for Server Tabs */}
              <div className="w-full pb-1">
                <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer>
                  <div className="flex items-center gap-2 min-w-max pb-2 px-1">
                    {[
                      { id: 'overview', label: 'Overview', icon: 'dashboard', hideForDayz: true },
                      { id: 'console', label: 'Console', icon: 'terminal', hideForDayz: false },
                      { id: 'options', label: 'Options', icon: 'settings', hideForDayz: true },
                      { id: 'players', label: 'Players', icon: 'group', hideForDayz: true },
                      { id: 'mods', label: 'Mods', icon: 'extension', hideForDayz: true },
                      { id: 'software', label: 'Software', icon: 'memory', hideForDayz: true },
                      { id: 'files', label: 'Files', icon: 'folder', hideForDayz: true },
                      { id: 'backups', label: 'Backups', icon: 'save', hideForDayz: true }
                    ].filter(tab => activeServer?.game === 'DayZ' ? !tab.hideForDayz : true).map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-label-md text-label-md transition-all whitespace-nowrap ${
                          activeTab === tab.id 
                          ? 'bg-primary/10 text-primary border border-primary/30 shadow-[0_0_15px_rgba(76,175,80,0.1)]' 
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </OverlayScrollbarsComponent>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative min-h-0 flex flex-col border border-t-0 border-white/5 shadow-inner z-10">
              
              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <OverviewTab 
                  statsHistory={activeServerId ? (statsHistory[activeServerId.toString()] || []) : []}
                  serverStatus={activeServer.status as 'Online' | 'Offline'}
                  serverVersion={serverMeta ? `${serverMeta.type} ${serverMeta.version}` : 'Loading...'}
                  onlinePlayers={activeServerId ? (onlinePlayers[activeServerId.toString()] || []) : []}
                  maxPlayers={activeServer.maxPlayers || 20}
                  logs={activeLogs}
                  maxRam={serverMeta?.ram ? Number(serverMeta.ram) : 4}
                  maxCpu={serverMeta?.cpu ? Number(serverMeta.cpu) : 4}
                />
              )}

              {/* TAB: CONSOLE */}
              {activeTab === 'console' && (
                <ConsoleTab 
                  logs={activeLogs}
                  endOfLogsRef={endOfLogsRef}
                  handleSendCommand={handleSendCommand}
                  handleClearLogs={handleClearLogs}
                  onlinePlayers={activeServerId ? (onlinePlayers[activeServerId.toString()] || []) : []}
                  onPlayerClick={(playerName) => {
                    setPlayerListType('live');
                    setSelectedPlayer(playerName);
                    setActiveTab('players');
                  }}
                  game={activeServer?.game || 'Minecraft'}
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
                  onlinePlayers={activeServerId ? (onlinePlayers[activeServerId.toString()] || []) : []}
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
              {activeTab === 'backups' && (
                <BackupsTab activeServerId={activeServerId} />
              )}

              {/* TAB: MODS */}
              {activeTab === 'mods' && (
                <div className="absolute inset-0 flex flex-col p-8 min-h-0">
                  <div className="flex justify-between items-end mb-6 shrink-0">
                    <div>
                      <h3 className="text-xl font-bold text-white">Mod Manager</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {serverMeta ? `Server Type: ${serverMeta.type} ${serverMeta.version}` : 'Loading server info...'}
                      </p>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="bg-black/40 backdrop-blur-md p-1 rounded-lg border border-white/5 flex shadow-inner">
                         <button onClick={() => setModViewType('browse')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${modViewType === 'browse' ? 'bg-brand text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>Browse</button>
                         <button onClick={() => setModViewType('installed')} className={`px-4 py-2 rounded-md font-bold text-sm transition-all ${modViewType === 'installed' ? 'bg-brand text-black shadow-md' : 'text-gray-400 hover:text-white'}`}>Installed ({installedMods.length})</button>
                      </div>
                    </div>
                  </div>

                  {serverMeta && (
                    <>
                      {modViewType === 'browse' && (
                        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
                          {/* TOP CONTROLS */}
                          <div className="flex flex-col md:flex-row justify-between items-center bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/5 mb-4 text-[#bfbfbf] text-sm shrink-0 shadow-inner relative z-50">
                            <div className="relative">
                              <button onClick={() => setIsClassMenuOpen(!isClassMenuOpen)} className="flex items-center gap-2 hover:text-white px-3 py-1 font-bold">
                                {classOptions.find(c => c.id === activeClassId)?.name || 'Mods'}
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                              </button>
                              {isClassMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                                  {classOptions.map(cls => (
                                    <div key={cls.id} onClick={() => { setActiveClassId(cls.id); setIsClassMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${activeClassId === cls.id ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                                      {cls.name} {activeClassId === cls.id && <span className="float-right text-brand">✓</span>}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="hidden md:block">
                              {totalModCount > 0 ? '10,000+ Projects found' : '0 Projects found'}
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <button onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} className="flex items-center gap-2 hover:text-white px-3 py-1 font-bold bg-transparent text-[#bfbfbf]">
                                  {[{id:1, name:'Sort: Featured'},{id:2, name:'Sort: Popularity'},{id:3, name:'Sort: Last Updated'},{id:4, name:'Sort: Name'}].find(o => o.id === activeSortField)?.name || 'Sort: Popularity'}
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                                </button>
                                {isSortMenuOpen && (
                                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                                    {[{id:1, name:'Sort: Featured'},{id:2, name:'Sort: Popularity'},{id:3, name:'Sort: Last Updated'},{id:4, name:'Sort: Name'}].map(opt => (
                                      <div key={opt.id} onClick={() => { setActiveSortField(opt.id); setIsSortMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${activeSortField === opt.id ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                                        {opt.name} {activeSortField === opt.id && <span className="float-right text-brand">✓</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 border-l border-white/10 pl-4 cursor-default font-bold text-[#bfbfbf]">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                                Filters
                              </div>
                            </div>
                          </div>

                          <form onSubmit={(e) => handleSearchMods(e)} className="mb-6 flex gap-3 shrink-0 relative z-40">
                            <input type="text" placeholder={`Search ${serverMeta?.type} ${classOptions.find(c => c.id === activeClassId)?.name.toLowerCase()}...`} value={modSearchQuery} onChange={(e) => setModSearchQuery(e.target.value)} className="flex-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg px-6 py-3 text-white outline-none focus:border-brand/50 shadow-inner text-base" disabled={isSearchingMods} />
                            <button type="submit" disabled={isSearchingMods} className="px-8 bg-black/40 backdrop-blur-md border border-white/5 hover:bg-white/10 rounded-lg font-bold transition-all disabled:opacity-50 text-white shadow-lg">{isSearchingMods ? 'Searching...' : 'Search'}</button>
                          </form>

                          <OverlayScrollbarsComponent 
                            className="flex-1 min-h-0" 
                            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                            defer
                          >
                          {modResults.length === 0 && !isSearchingMods && modSearchQuery && (
                            <div className="text-center text-gray-500 mt-20">No projects found. Try a different search.</div>
                          )}

                          <div className="flex flex-col gap-[1px] bg-white/5 border border-white/5 rounded overflow-hidden shadow-lg pb-4">
                            {modResults.map((mod: any) => {
                               const isInstalled = installedMods.some(m => m.name.toLowerCase().includes(mod.slug?.replace(/-/g, '') || mod.name.toLowerCase().replace(/ /g, '')));
                               return (
                                <React.Fragment key={mod.id}>
                                  <div className="bg-black/30 backdrop-blur-sm p-4 flex gap-4 group transition-colors hover:bg-black/50">
                                    <img src={mod.logo?.thumbnailUrl || 'https://via.placeholder.com/128'} alt={mod.name} className="w-[84px] h-[84px] rounded shadow-md bg-black/50 object-cover flex-shrink-0" />
                                  
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
                                    <button onClick={() => handleInstallMod(mod)} disabled={installingModId !== null || isInstalled} className={`px-5 py-2 rounded-md font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(0,0,0,0.5)] ${isInstalled ? 'bg-black/40 text-gray-400 border border-white/5' : 'bg-brand hover:brightness-110 text-black shadow-[0_0_15px_rgba(76,175,80,0.3)]'}`}>
                                      {isInstalled ? 'Installed' : installingModId === mod.id ? 'Installing...' : 'Install'}
                                    </button>
                                  </div>
                                </div>
                                {installingModId === mod.id && (
                                  <div className="bg-black/40 px-4 py-2 text-xs text-brand border-b border-white/5 animate-pulse">
                                    {installProgressText}
                                  </div>
                                )}
                              </React.Fragment>
                            )})}
                          </div>
                          </OverlayScrollbarsComponent>
                        </div>
                      )}

                      {modViewType === 'installed' && (
                        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in duration-300">
                          <OverlayScrollbarsComponent 
                            className="flex-1 min-h-0" 
                            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                            defer
                          >
                          {installedMods.length === 0 ? (
                            <div className="text-center text-gray-500 mt-20">No mods installed yet.</div>
                          ) : (
                            <div className="bg-black/30 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden shadow-lg">
                              <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-black/40 border-b border-white/5 text-gray-400 uppercase font-bold text-xs">
                                  <tr>
                                    <th className="px-6 py-4">File Name</th>
                                    <th className="px-6 py-4 w-32">Size</th>
                                    <th className="px-6 py-4 w-24 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {installedMods.map((mod: any, idx) => (
                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
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
                          </OverlayScrollbarsComponent>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB: SOFTWARE */}
              {activeTab === 'software' && (
                <div className="absolute inset-0 flex flex-col p-8 min-h-0 animate-in fade-in duration-300">
                  <h3 className="text-2xl font-bold text-[#4CAF50] mb-6 shrink-0">Change Software</h3>
                  <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/5 shadow-xl min-h-0">
                    <OverlayScrollbarsComponent 
                      className="flex-1 min-h-0"
                      options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                      defer
                    >
                      <div className="p-8 pb-16">
                        {isChangingSoftware ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h4 className="text-xl font-bold text-white mb-2">Changing Software</h4>
                      <p className="text-gray-400">{downloadText}</p>
                      {downloadProgress > 0 && (
                        <div className="w-full max-w-md bg-gray-800 rounded-full h-2 mt-4 overflow-hidden">
                          <div className="bg-[#4CAF50] h-2 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 max-w-xl">
                      <div className="relative z-50">
                        <label className="block text-sm font-bold text-gray-400 mb-2">Software Type</label>
                        <button 
                          onClick={() => setIsTypeMenuOpen(!isTypeMenuOpen)}
                          className="w-full flex justify-between items-center bg-black/40 backdrop-blur-md border border-white/5 rounded p-3 text-white shadow-inner font-bold"
                        >
                          {editingSoftwareType}
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                        </button>
                        {isTypeMenuOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                            <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                            {['Vanilla', 'Paper', 'Fabric', 'Forge', 'NeoForge', 'CurseForge Modpack'].map(opt => (
                              <div key={opt} onClick={() => { 
                                if (opt === 'CurseForge Modpack') {
                                  setShowModpackPrompt(true);
                                  setIsTypeMenuOpen(false);
                                } else {
                                  setEditingSoftwareType(opt); 
                                  setIsTypeMenuOpen(false); 
                                }
                              }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${editingSoftwareType === opt ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                                {opt} {editingSoftwareType === opt && <span className="float-right text-brand">✓</span>}
                              </div>
                            ))}
                            </OverlayScrollbarsComponent>
                          </div>
                        )}
                      </div>

                      <div className="relative z-40">
                        <label className="block text-sm font-bold text-gray-400 mb-2">Minecraft Version</label>
                        <button 
                          onClick={() => setIsVersionMenuOpen(!isVersionMenuOpen)}
                          className="w-full flex justify-between items-center bg-black/40 backdrop-blur-md border border-white/5 rounded p-3 text-white shadow-inner font-bold"
                        >
                          {editingSoftwareVersion || 'Loading...'}
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                        </button>
                        {isVersionMenuOpen && editingAvailableVersions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                            <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                            {editingAvailableVersions.map(opt => (
                              <div key={opt} onClick={() => { setEditingSoftwareVersion(opt); setIsVersionMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${editingSoftwareVersion === opt ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                                {opt} {editingSoftwareVersion === opt && <span className="float-right text-brand">✓</span>}
                              </div>
                            ))}
                            </OverlayScrollbarsComponent>
                          </div>
                        )}
                      </div>

                      {['Forge', 'Fabric', 'NeoForge'].includes(editingSoftwareType) && (
                        <div className="relative z-30">
                          <label className="block text-sm font-bold text-gray-400 mb-2">Loader Version</label>
                          <button 
                            onClick={() => { if (!isChangingSoftware && editingAvailableLoaderVersions.length > 0) setIsLoaderMenuOpen(!isLoaderMenuOpen) }}
                            className={`w-full flex justify-between items-center bg-black/40 backdrop-blur-md border border-white/5 rounded p-3 text-white shadow-inner font-bold ${isChangingSoftware || editingAvailableLoaderVersions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {editingAvailableLoaderVersions.length === 0 ? 'Loading...' : (editingLoaderVersion || 'Select version')}
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                          </button>
                          {isLoaderMenuOpen && editingAvailableLoaderVersions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2">
                              <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} defer className="max-h-60 w-full block">
                              {editingAvailableLoaderVersions.map(opt => (
                                <div key={opt} onClick={() => { setEditingLoaderVersion(opt); setIsLoaderMenuOpen(false); }} className={`px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors ${editingLoaderVersion === opt ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}>
                                  {opt} {editingLoaderVersion === opt && <span className="float-right text-brand">✓</span>}
                                </div>
                              ))}
                              </OverlayScrollbarsComponent>
                            </div>
                          )}
                        </div>
                      )}

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
                            await window.api.changeServerSoftware(activeServerId, editingSoftwareType, editingSoftwareVersion, editingLoaderVersion);
                            
                            // Re-download the jar
                            // @ts-ignore
                            await window.api.downloadServerJar(activeServerId, editingSoftwareType, editingSoftwareVersion, editingLoaderVersion);
                            
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
                        className="mt-4 bg-gradient-to-br from-[#4CAF50] to-[#388E3C] text-black font-black py-3 px-6 rounded hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                      >
                        Apply Changes
                      </button>
                    </div>
                  )}
                  </div>
                  </OverlayScrollbarsComponent>
                  </div>
                </div>
              )}

            </div>
          </div>
  );
}
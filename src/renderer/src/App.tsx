import React, { useState, useEffect, useRef } from 'react'
import 'overlayscrollbars/overlayscrollbars.css';
import { motion, AnimatePresence } from 'motion/react';
import { DayzHub } from './components/hubs/DayzHub/DayzHub'
import { MinecraftHub } from './components/hubs/MinecraftHub/MinecraftHub';
import { DashboardHub } from './components/hubs/DashboardHub/DashboardHub';
import { CreateServerModal } from './components/modals/CreateServerModal';
import { SteamLoginModal } from './components/modals/SteamLoginModal';
import { DeleteConfirmationModal } from './components/modals/DeleteConfirmationModal';
import { TunnelModal } from './components/modals/TunnelModal';
import minecraftBg from './assets/minecraft-bg.png';
import palworldBg from './assets/palworld-bg.jpg';
import dayzBg from './assets/dayz-bg.jpg';
import satisfactoryBg from './assets/satisfactory-bg.jpg';

const supportedGameHubs = ['Minecraft', 'DayZ'];
const isGameSupported = (game: string | null) => (game ? supportedGameHubs.includes(game) : false);

const getGameImageUrl = (game: string) => {
  if (game.toLowerCase().includes('minecraft')) return minecraftBg;
  if (game.toLowerCase().includes('palworld')) return palworldBg;
  if (game.toLowerCase().includes('dayz')) return dayzBg;
  if (game.toLowerCase().includes('satisfactory')) return satisfactoryBg;
  return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000';
};

const getGameThemeColor = (game: string | null) => {
  if (!game) return { omni: '#ffffff', host: '#cccccc' };
  const g = game.toLowerCase();
  if (g.includes('minecraft')) return { omni: '#4ade80', host: '#bbf7d0' };
  if (g.includes('palworld')) return { omni: '#3b82f6', host: '#bfdbfe' };
  if (g.includes('dayz')) return { omni: '#ef4444', host: '#fecaca' };
  if (g.includes('satisfactory')) return { omni: '#eab308', host: '#fef08a' };
  return { omni: '#ffffff', host: '#cccccc' };
};

export default function App() {
  const [servers, setServers] = useState<any[]>([])
  const [logs, setLogs] = useState<{id: string, msg: string}[]>([])
  const [onlinePlayers, setOnlinePlayers] = useState<Record<string, string[]>>({})
  const [statsHistory, setStatsHistory] = useState<Record<string, {cpu: number, ram: number}[]>>({})
  const [tunnelStatus, setTunnelStatus] = useState('Offline')

  const [activeServerId, setActiveServerId] = useState<number | null>(null)
  const [activeGameHub, setActiveGameHub] = useState<string | null>(null)
  const [lastGameHub, setLastGameHub] = useState<string | null>(null)

  useEffect(() => {
    if (activeGameHub) {
      setLastGameHub(activeGameHub)
    }
  }, [activeGameHub])
  const [hoveredGame, setHoveredGame] = useState<string | null>(null)

  const [tunnelIp, setTunnelIp] = useState(() => localStorage.getItem('tunnelIp') || '34.131.235.17')
  const [showTunnelModal, setShowTunnelModal] = useState(false)
  const [tempTunnelIp, setTempTunnelIp] = useState('')
  const [radminIp, setRadminIp] = useState('')

  const [toasts, setToasts] = useState<{ id: number, message: string }[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [initialCreateServerType, setInitialCreateServerType] = useState('Vanilla')
  const [showSteamLoginModal, setShowSteamLoginModal] = useState(false)
  const [steamLoginAction, setSteamLoginAction] = useState<'create' | 'cache'>('create')
  const [steamUsername, setSteamUsername] = useState('')
  const [steamPassword, setSteamPassword] = useState('')
  const [steamGuardCode, setSteamGuardCode] = useState('')
  const [isSteamGuardRequired, setIsSteamGuardRequired] = useState(false)
  const [isDayzCached, setIsDayzCached] = useState<boolean | null>(null)

  const [serverToDelete, setServerToDelete] = useState<number | null>(null)

  const [isClearingCache, setIsClearingCache] = useState(false)
  const [cacheSize, setCacheSize] = useState<number>(0)

  useEffect(() => {
    const fetchServers = async () => {
      // @ts-ignore
      const data = await window.api.getServers();
      setServers(data);
    };
    fetchServers();

    const checkCache = async () => {
      // @ts-ignore
      const cached = await window.api.checkSteamCache(223350);
      setIsDayzCached(cached);
    };
    checkCache();

    // Listen to servers update
    // @ts-ignore
    window.api.onServersUpdate((data: any[]) => {
      setServers(data)
    });

    // @ts-ignore
    window.api.onConsoleLog((data: any) => {
      const msgs = data.msg ? data.msg.split('\n').filter((l: string) => l.trim() !== '') : [];
      setLogs(prev => {
        const newLogs = [...prev, ...msgs.map((m: string) => ({ 
          id: data.id.toString(), 
          msg: m 
        }))];
        if (newLogs.length > 500) return newLogs.slice(newLogs.length - 500);
        return newLogs;
      });
    });

    // @ts-ignore
    window.api.onOnlinePlayers((data: any) => {
      setOnlinePlayers(prev => ({...prev, [data.id.toString()]: data.players}));
    });

    // @ts-ignore
    window.api.onServerStats((data: any) => {
      setStatsHistory(prev => {
        const history = prev[data.id.toString()] || [];
        const newHistory = [...history, {cpu: data.cpu, ram: data.ram}];
        if (newHistory.length > 20) newHistory.shift();
        return {...prev, [data.id.toString()]: newHistory};
      });
    });
  }, []);

  const showToast = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }

  const handleTunnel = async () => {
    if (activeServer?.game === 'DayZ') {
      // @ts-ignore
      const installed = await window.api.radminCheck();
      if (!installed) {
        showToast("Radmin VPN not found! Opening download page...");
        // @ts-ignore
        window.api.radminInstall();
        return;
      }
      
      showToast("Opening Radmin VPN...");
      // @ts-ignore
      await window.api.radminOpen();
      
      setTimeout(async () => {
        // @ts-ignore
        const ip = await window.api.radminGetIp();
        if (ip) {
          setRadminIp(ip);
          showToast("Radmin VPN IP: " + ip);
        }
      }, 3000);
    } else {
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
      
      setTimeout(async () => {
        // @ts-ignore
        await window.api.startServer(id);
        setServers(servers.map(s => s.id === id ? { ...s, status: 'Online' } : s));
      }, 3000);
    } catch (error) {
      alert("Backend Error: " + error);
    }
  }

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      // @ts-ignore
      await window.api.clearCache();
      setCacheSize(0);
      showToast('Cache successfully cleared!');
    } catch (e: any) {
      showToast(`Failed to clear cache: ${e.message || e}`);
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
    <div className="bg-gradient-to-b from-[#121212] to-[#050505] font-body-md text-on-background w-full h-screen flex flex-col overflow-hidden relative">
      
      {/* Dynamic Backgrounds */}
      <div className={`absolute inset-0 bg-gradient-to-br from-[#0a1f0a] via-[#1b5e20] to-[#051105] pointer-events-none transition-opacity duration-700 ease-in-out ${hoveredGame === 'Minecraft' || activeGameHub === 'Minecraft' ? 'opacity-100' : 'opacity-0'}`}></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-[#42c0ff]/40 via-[#fcb746]/20 to-[#050505] pointer-events-none transition-opacity duration-700 ease-in-out ${hoveredGame === 'Palworld' || activeGameHub === 'Palworld' ? 'opacity-100' : 'opacity-0'}`}></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-[#8b0000]/30 via-[#3a0000]/20 to-[#050505] pointer-events-none transition-opacity duration-700 ease-in-out ${hoveredGame === 'DayZ' || activeGameHub === 'DayZ' ? 'opacity-100' : 'opacity-0'}`}></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-[#fa9549]/35 via-[#7c2d12]/25 to-[#050505] pointer-events-none transition-opacity duration-700 ease-in-out ${hoveredGame === 'Satisfactory' || activeGameHub === 'Satisfactory' ? 'opacity-100' : 'opacity-0'}`}></div>
      
      {/* TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#121212] to-[#050505] z-40 border-b border-white/5 shadow-lg">
        <div className="h-full px-gutter w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 cursor-default group">
              <h1 className="text-[34px] leading-none tracking-tight font-bold flex items-center whitespace-nowrap transition-transform duration-300 group-hover:scale-105" style={{ fontFamily: '"Oswald", sans-serif' }}>
                <span 
                  className={`mr-2 logo-sweep ${activeGameHub ? 'active' : ''}`}
                  style={{ '--logo-default-color': '#ffffff', '--logo-game-color': getGameThemeColor(activeGameHub || lastGameHub).omni } as React.CSSProperties}
                >
                  Omni
                </span>
                <span 
                  className={`logo-sweep ${activeGameHub ? 'active' : ''}`}
                  style={{ '--logo-default-color': '#cccccc', '--logo-game-color': getGameThemeColor(activeGameHub || lastGameHub).host } as React.CSSProperties}
                >
                  Host
                </span>
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => { setActiveServerId(null); setActiveGameHub(null); }} className={`flex items-center gap-2 font-bold transition-all ${activeServerId === null && activeGameHub === null ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
                <span className="font-label-md text-label-md">Dashboard</span>
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            {activeServerId === null && activeGameHub === null && (
              <button onClick={handleClearCache} disabled={isClearingCache} className="relative overflow-hidden group px-2.5 py-2 rounded-lg border bg-surface/40 border-outline-variant/30 text-on-surface-variant hover:text-red-400 hover:border-red-500/50 transition-all flex items-center justify-center">
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
      <main className="relative pt-20 bg-transparent flex-1 w-full flex flex-col min-h-0 overflow-hidden outline-none">
        <div className="flex flex-col w-full relative h-full">

          <AnimatePresence>
          {/* DASHBOARD VIEW */}
          {activeServerId === null && (
            <motion.div 
              key="dashboard-hub" 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 1, transition: { duration: 0.4 } }} 
              className="absolute inset-0 w-full h-full flex flex-col min-h-0"
            >
              <DashboardHub 
              servers={servers}
              activeGameHub={activeGameHub}
              hoveredGame={hoveredGame}
              setHoveredGame={setHoveredGame}
              setActiveGameHub={setActiveGameHub}
              setActiveServerId={setActiveServerId}
              handleStart={handleStart}
              handleStop={handleStop}
              handleRestart={handleRestart}
              handleDelete={handleDelete}
              handleTunnel={handleTunnel}
              tunnelStatus={tunnelStatus}
              tunnelIp={tunnelIp}
              getGameImageUrl={getGameImageUrl}
              setShowCreateModal={setShowCreateModal}
              setShowSteamLoginModal={setShowSteamLoginModal}
              isGameSupported={isGameSupported} isDayzCached={isDayzCached} setIsDayzCached={setIsDayzCached} setSteamLoginAction={setSteamLoginAction} showToast={showToast}
              />
            </motion.div>
          )}

          {/* ACTIVE SERVER VIEW */}
          {activeServer !== undefined && activeServerId !== null && (
            <motion.div 
              key="active-server"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0 w-full h-full flex flex-col overflow-hidden z-10 bg-[#050505]"
            >
              {activeServer.game === 'DayZ' ? (
              <DayzHub 
                activeServerId={activeServerId}
                activeServer={activeServer}
                setActiveServerId={setActiveServerId}
                handleStart={handleStart}
                handleStop={handleStop}
                handleRestart={handleRestart}
                handleDelete={handleDelete}
                handleTunnel={handleTunnel}
                radminIp={radminIp}
                logs={logs}
                setLogs={setLogs}
                onlinePlayers={onlinePlayers}
                statsHistory={statsHistory}
              />
            ) : (
              <MinecraftHub 
                activeServerId={activeServerId} 
                activeServer={activeServer} 
                servers={servers} 
                setActiveServerId={setActiveServerId} 
                handleStart={handleStart} 
                handleStop={handleStop} 
                handleRestart={handleRestart} 
                handleDelete={handleDelete} 
                handleTunnel={handleTunnel} 
                tunnelStatus={tunnelStatus} 
                radminIp={radminIp} 
                tunnelIp={tunnelIp} 
                setTempTunnelIp={setTempTunnelIp} 
                setShowTunnelModal={setShowTunnelModal} 
                showToast={showToast}
                logs={logs}
                setLogs={setLogs}
                onlinePlayers={onlinePlayers}
                statsHistory={statsHistory}
                onRedirectToCreateModpack={() => {
                  setInitialCreateServerType('CurseForge Modpack');
                  setActiveServerId(null);
                  setShowCreateModal(true);
                }}
                />
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </main>

      {/* TOAST SYSTEM */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="relative overflow-hidden group bg-[#050505]/80 backdrop-blur-xl border border-white/10 border-t-white/30 border-l-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.2)] px-5 py-3 rounded-xl flex items-center gap-3 pointer-events-auto">
            <span className="relative z-10 font-bold text-sm text-white">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* MODALS */}
        {showCreateModal && (
          <CreateServerModal 
            initialServerType={initialCreateServerType}
            setShowCreateModal={setShowCreateModal}
            servers={servers} 
            setServers={setServers} 
            activeGameHub={activeGameHub} 
            showToast={showToast} 
            setSteamLoginAction={setSteamLoginAction} 
            setShowSteamLoginModal={setShowSteamLoginModal}
            steamUsername={steamUsername}
            steamPassword={steamPassword}
            setSteamPassword={setSteamPassword}
            steamGuardCode={steamGuardCode}
            setSteamGuardCode={setSteamGuardCode}
            isSteamGuardRequired={isSteamGuardRequired}
            setIsSteamGuardRequired={setIsSteamGuardRequired}
            setActiveServerId={setActiveServerId}
          />
        )}

      {showSteamLoginModal && (
        <SteamLoginModal setShowSteamLoginModal={setShowSteamLoginModal} showToast={showToast} activeGameHub={activeGameHub} steamLoginAction={steamLoginAction} steamUsername={steamUsername} setSteamUsername={setSteamUsername} steamPassword={steamPassword} setSteamPassword={setSteamPassword} isSteamGuardRequired={isSteamGuardRequired} setIsSteamGuardRequired={setIsSteamGuardRequired} steamGuardCode={steamGuardCode} setSteamGuardCode={setSteamGuardCode} setIsDayzCached={setIsDayzCached} isDayzCached={isDayzCached} />
      )}

      {serverToDelete !== null && (
        <DeleteConfirmationModal serverToDelete={serverToDelete} setServerToDelete={setServerToDelete} confirmDeleteServer={confirmDeleteServer} servers={servers} />
      )}

      {showTunnelModal && activeServer?.game !== 'DayZ' && (
        <TunnelModal tempTunnelIp={tempTunnelIp} setTempTunnelIp={setTempTunnelIp} setTunnelIp={setTunnelIp} setShowTunnelModal={setShowTunnelModal} showToast={showToast} />
      )}
    </div>
  )
}
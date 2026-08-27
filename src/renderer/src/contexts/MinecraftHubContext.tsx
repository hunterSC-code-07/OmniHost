import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useServerStore } from '../store/useServerStore';

type TabType = 'overview' | 'console' | 'options' | 'players' | 'software' | 'mods' | 'files' | 'backups';

interface MinecraftHubContextType {
  activeTab: TabType;
  tabDirection: number;
  handleTabChange: (newTab: TabType) => void;
  activeServer: any;
  activeServerId: number | null;
  showModpackPrompt: boolean;
  setShowModpackPrompt: (show: boolean) => void;
  serverMeta: any;
  fetchServerMeta: () => Promise<void>;
  onRedirectToCreateModpack: () => void;
}

const MinecraftHubContext = createContext<MinecraftHubContextType | undefined>(undefined);

export const MinecraftHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeServerId, servers } = useServerStore();
  const currentServer = servers.find(s => s.id === activeServerId);
  const prevServerRef = useRef(currentServer);
  
  if (currentServer) {
    prevServerRef.current = currentServer;
  }
  const activeServer = currentServer || prevServerRef.current;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [tabDirection, setTabDirection] = useState(0);

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    const TABS = ['overview', 'console', 'options', 'players', 'mods', 'software', 'files', 'backups'];
    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    setTabDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const [showModpackPrompt, setShowModpackPrompt] = useState(false);
  const [serverMeta, setServerMeta] = useState<any>(null);

  const fetchServerMeta = async () => {
    if (activeServerId === null) return;
    // @ts-ignore
    const meta = await window.api.server.getServerMeta(activeServerId);
    setServerMeta(meta);
  };

  useEffect(() => {
    if (activeServerId !== null) {
      fetchServerMeta();
    } else {
      setServerMeta(null);
    }
  }, [activeServerId]);

  const onRedirectToCreateModpack = () => {
    // This function was originally empty in MinecraftHub.tsx, keeping it as is
  };

  return (
    <MinecraftHubContext.Provider value={{ 
      activeTab, 
      tabDirection, 
      handleTabChange, 
      activeServer, 
      activeServerId,
      showModpackPrompt,
      setShowModpackPrompt,
      serverMeta,
      fetchServerMeta,
      onRedirectToCreateModpack
    }}>
      {children}
    </MinecraftHubContext.Provider>
  );
};

export const useMinecraftHubContext = () => {
  const context = useContext(MinecraftHubContext);
  if (context === undefined) {
    throw new Error('useMinecraftHubContext must be used within a MinecraftHubProvider');
  }
  return context;
};

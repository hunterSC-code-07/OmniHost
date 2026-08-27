import React, { createContext, useContext, useState, useRef } from 'react';
import { useServerStore } from '../store/useServerStore';

type TabType = 'console' | 'options' | 'economy' | 'mods' | 'installed' | 'files' | 'vppadmin';

interface DayzHubContextType {
  activeTab: TabType;
  tabDirection: number;
  handleTabChange: (newTab: TabType) => void;
  activeServer: any;
  activeServerId: number | null;
}

const DayzHubContext = createContext<DayzHubContextType | undefined>(undefined);

export const DayzHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeServerId, servers } = useServerStore();
  const currentServer = servers.find(s => s.id === activeServerId);
  const prevServerRef = useRef(currentServer);
  
  if (currentServer) {
    prevServerRef.current = currentServer;
  }
  const activeServer = currentServer || prevServerRef.current;

  const [activeTab, setActiveTab] = useState<TabType>('console');
  const [tabDirection, setTabDirection] = useState(0);

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    const TABS = ['console', 'options', 'economy', 'mods', 'installed', 'files', 'vppadmin'];
    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    setTabDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  return (
    <DayzHubContext.Provider value={{ activeTab, tabDirection, handleTabChange, activeServer, activeServerId }}>
      {children}
    </DayzHubContext.Provider>
  );
};

export const useDayzHubContext = () => {
  const context = useContext(DayzHubContext);
  if (context === undefined) {
    throw new Error('useDayzHubContext must be used within a DayzHubProvider');
  }
  return context;
};

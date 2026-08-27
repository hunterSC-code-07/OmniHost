import { create } from 'zustand';

export type DayzTabType = 'console' | 'options' | 'economy' | 'mods' | 'installed' | 'files' | 'vppadmin';

interface DayzHubState {
  activeTab: DayzTabType;
  tabDirection: number;
  handleTabChange: (newTab: DayzTabType) => void;
}

export const useDayzHubStore = create<DayzHubState>((set, get) => ({
  activeTab: 'console',
  tabDirection: 0,
  handleTabChange: (newTab: DayzTabType) => {
    const { activeTab } = get();
    if (newTab === activeTab) return;
    const TABS: DayzTabType[] = ['console', 'options', 'economy', 'mods', 'installed', 'files', 'vppadmin'];
    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    set({
      tabDirection: newIndex > currentIndex ? 1 : -1,
      activeTab: newTab
    });
  }
}));

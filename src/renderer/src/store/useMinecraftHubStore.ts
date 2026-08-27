import { create } from 'zustand';

export type MinecraftTabType = 'overview' | 'console' | 'options' | 'players' | 'software' | 'mods' | 'files' | 'backups';

interface MinecraftHubState {
  activeTab: MinecraftTabType;
  tabDirection: number;
  handleTabChange: (newTab: MinecraftTabType) => void;
  showModpackPrompt: boolean;
  setShowModpackPrompt: (show: boolean) => void;
  serverMeta: any;
  fetchServerMeta: (serverId: number) => Promise<void>;
  onRedirectToCreateModpack: () => void;
}

export const useMinecraftHubStore = create<MinecraftHubState>((set, get) => ({
  activeTab: 'overview',
  tabDirection: 0,
  handleTabChange: (newTab: MinecraftTabType) => {
    const { activeTab } = get();
    if (newTab === activeTab) return;
    const TABS: MinecraftTabType[] = ['overview', 'console', 'options', 'players', 'mods', 'software', 'files', 'backups'];
    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    set({
      tabDirection: newIndex > currentIndex ? 1 : -1,
      activeTab: newTab
    });
  },
  showModpackPrompt: false,
  setShowModpackPrompt: (show: boolean) => set({ showModpackPrompt: show }),
  serverMeta: null,
  fetchServerMeta: async (serverId: number) => {
    if (serverId === null || serverId === undefined) return;
    try {
      // @ts-ignore
      const meta = await window.api.server.getServerMeta(serverId);
      set({ serverMeta: meta });
    } catch (error) {
      console.error('Failed to fetch server meta:', error);
      set({ serverMeta: null });
    }
  },
  onRedirectToCreateModpack: () => {
    // Keeps the empty placeholder from the old context
  }
}));

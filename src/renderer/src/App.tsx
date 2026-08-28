import { useEffect } from 'react'
import 'overlayscrollbars/overlayscrollbars.css';

import { GlobalModalManager } from './components/modals/GlobalModalManager';
import { useIpcListeners } from './hooks/useIpcListeners';
import { useUiStore } from './store/useUiStore';

import { MainLayout } from './components/layout/MainLayout';
import { HubRouter } from './components/layout/HubRouter';
import { HUB_REGISTRY } from './components/layout/HubRegistry';

export default function App() {
  useIpcListeners();
  
  const { setGameCacheStatus } = useUiStore();

  useEffect(() => {
    const checkCache = async () => {
      for (const [gameName, hubConfig] of Object.entries(HUB_REGISTRY)) {
        if (hubConfig.steamAppId) {
          // @ts-ignore
          const isCached = await window.api.steam.checkCache(hubConfig.steamAppId);
          setGameCacheStatus(gameName, isCached);
        }
      }
    };
    checkCache();
  }, [setGameCacheStatus]);

  return (
    <MainLayout>
      <HubRouter />
      <GlobalModalManager />
    </MainLayout>
  )
}
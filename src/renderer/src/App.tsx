import { useEffect } from 'react'
import 'overlayscrollbars/overlayscrollbars.css';

import { GlobalModalManager } from './components/modals/GlobalModalManager';
import { useIpcListeners } from './hooks/useIpcListeners';
import { useUiStore } from './store/useUiStore';

import { MainLayout } from './components/layout/MainLayout';
import { HubRouter } from './components/layout/HubRouter';
import { STEAM_GAMES } from '@shared/SteamGames';

export default function App() {
  useIpcListeners();
  
  const { setGameCacheStatus } = useUiStore();

  useEffect(() => {
    const checkCache = async () => {
      for (const [gameName, gameConfig] of Object.entries(STEAM_GAMES)) {
        // @ts-ignore
        const isCached = await window.api.steam.checkCache(gameConfig.appId);
        setGameCacheStatus(gameName, isCached);
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
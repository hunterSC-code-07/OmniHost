import { useEffect } from 'react'
import 'overlayscrollbars/overlayscrollbars.css';

import { GlobalModalManager } from './components/modals/GlobalModalManager';
import { useIpcListeners } from './hooks/useIpcListeners';
import { useUiStore } from './store/useUiStore';

import { MainLayout } from './components/layout/MainLayout';
import { HubRouter } from './components/layout/HubRouter';

export default function App() {
  useIpcListeners();
  
  const { setIsDayzCached, setIsSevenDaysCached } = useUiStore();

  useEffect(() => {
    const checkCache = async () => {
      // @ts-ignore
      const dayzCached = await window.api.steam.checkCache(223350);
      setIsDayzCached(dayzCached);

      // @ts-ignore
      const sevenDaysCached = await window.api.steam.checkCache(294420);
      setIsSevenDaysCached(sevenDaysCached);
    };
    checkCache();
  }, [setIsDayzCached, setIsSevenDaysCached]);

  return (
    <MainLayout>
      <HubRouter />
      <GlobalModalManager />
    </MainLayout>
  )
}
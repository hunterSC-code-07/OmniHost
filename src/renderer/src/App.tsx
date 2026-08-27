import { useEffect } from 'react'
import 'overlayscrollbars/overlayscrollbars.css';

import { useIpcListeners } from './hooks/useIpcListeners';
import { useUiStore } from './store/useUiStore';

import { MainLayout } from './components/layout/MainLayout';
import { HubRouter } from './components/layout/HubRouter';

export default function App() {
  useIpcListeners();
  
  const { setIsDayzCached } = useUiStore();

  useEffect(() => {
    const checkCache = async () => {
      // @ts-ignore
      const cached = await window.api.steam.checkCache(223350);
      setIsDayzCached(cached);
    };
    checkCache();
  }, [setIsDayzCached]);

  return (
    <MainLayout>
      <HubRouter />
    </MainLayout>
  )
}
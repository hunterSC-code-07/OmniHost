import { useEffect } from 'react'
import 'overlayscrollbars/overlayscrollbars.css';

import { useIpcListeners } from './hooks/useIpcListeners';
import { useUiStore } from './store/useUiStore';

import { MainLayout } from './components/layout/MainLayout';
import { HubRouter } from './components/layout/HubRouter';

export default function App() {
  useIpcListeners();
  
  const { setIsDayzCached, setIsSatisfactoryCached } = useUiStore();

  useEffect(() => {
    const checkCache = async () => {
      // @ts-ignore
      const dayzCached = await window.api.steam.checkCache(223350);
      setIsDayzCached(dayzCached);
      // @ts-ignore
      const satisfactoryCached = await window.api.steam.checkCache(1690800);
      setIsSatisfactoryCached(satisfactoryCached);
    };
    checkCache();
  }, [setIsDayzCached, setIsSatisfactoryCached]);

  return (
    <MainLayout>
      <HubRouter />
    </MainLayout>
  )
}
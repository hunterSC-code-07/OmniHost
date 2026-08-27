import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardHub } from '../hubs/DashboardHub/DashboardHub';
import { ErrorBoundary } from './ErrorBoundary';
import { useServerStore } from '../../store/useServerStore';
import minecraftBg from '../../assets/minecraft-bg.png';
import palworldBg from '../../assets/palworld-bg.jpg';
import dayzBg from '../../assets/dayz-bg.jpg';
import satisfactoryBg from '../../assets/satisfactory-bg.jpg';

// Lazy load the heavy game hubs so they aren't bundled into the initial payload
const DayzHub = React.lazy(() => import('../hubs/DayzHub/DayzHub').then(m => ({ default: m.DayzHub })));
const MinecraftHub = React.lazy(() => import('../hubs/MinecraftHub/MinecraftHub').then(m => ({ default: m.MinecraftHub })));
const SevenDaysToDieHub = React.lazy(() => import('../hubs/SevenDaysToDieHub/SevenDaysToDieHub').then(m => ({ default: m.SevenDaysToDieHub })));

const supportedGameHubs = ['Minecraft', 'DayZ', '7 Days to Die'];
const isGameSupported = (game: string | null) => (game ? supportedGameHubs.includes(game) : false);

const getGameImageUrl = (game: string) => {
  if (game.toLowerCase().includes('minecraft')) return minecraftBg;
  if (game.toLowerCase().includes('palworld')) return palworldBg;
  if (game.toLowerCase().includes('dayz')) return dayzBg;
  if (game.toLowerCase().includes('satisfactory')) return satisfactoryBg;
  if (game.toLowerCase().includes('7 days to die')) return 'https://images.unsplash.com/photo-1509315754593-9c869109eeeb?q=80&w=1000';
  return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000';
};

// Fallback loader to show while the chunk is fetching from disk
const HubLoader = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505]">
    <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin mb-4"></div>
    <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse">Loading Module...</span>
  </div>
);

export const HubRouter: React.FC = () => {
  const { activeServerId, servers } = useServerStore();
  
  const currentServer = servers.find(s => s.id === activeServerId);
  const prevServerRef = React.useRef(currentServer);
  if (currentServer) {
    prevServerRef.current = currentServer;
  }
  const activeServer = currentServer || prevServerRef.current;

  return (
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
            <DashboardHub getGameImageUrl={getGameImageUrl} isGameSupported={isGameSupported} />
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
            <ErrorBoundary>
              <Suspense fallback={<HubLoader />}>
                {activeServer.game === 'DayZ' ? (
                  <DayzHub />
                ) : activeServer.game === '7 Days to Die' ? (
                  <SevenDaysToDieHub serverId={activeServer.id} />
                ) : (
                  <MinecraftHub />
                )}
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

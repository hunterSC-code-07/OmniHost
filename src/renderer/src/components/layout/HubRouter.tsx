import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardHub } from '../hubs/DashboardHub/DashboardHub';
import { DayzHub } from '../hubs/DayzHub/DayzHub';
import { MinecraftHub } from '../hubs/MinecraftHub/MinecraftHub';
import { ErrorBoundary } from './ErrorBoundary';
import { useServerStore } from '../../store/useServerStore';
import minecraftBg from '../../assets/minecraft-bg.png';
import palworldBg from '../../assets/palworld-bg.jpg';
import dayzBg from '../../assets/dayz-bg.jpg';
import satisfactoryBg from '../../assets/satisfactory-bg.jpg';

const supportedGameHubs = ['Minecraft', 'DayZ'];
const isGameSupported = (game: string | null) => (game ? supportedGameHubs.includes(game) : false);

const getGameImageUrl = (game: string) => {
  if (game.toLowerCase().includes('minecraft')) return minecraftBg;
  if (game.toLowerCase().includes('palworld')) return palworldBg;
  if (game.toLowerCase().includes('dayz')) return dayzBg;
  if (game.toLowerCase().includes('satisfactory')) return satisfactoryBg;
  return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000';
};

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
              {activeServer.game === 'DayZ' ? (
                <DayzHub />
              ) : (
                <MinecraftHub />
              )}
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardHub } from '../hubs/DashboardHub/DashboardHub';
import { ErrorBoundary } from './ErrorBoundary';
import { useServerStore } from '../../store/useServerStore';
import { HUB_REGISTRY, isGameSupported, getGameImageUrl } from './HubRegistry';


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
                {(() => {
                  const config = HUB_REGISTRY[activeServer.game];
                  if (config && config.component) {
                    const HubComponent = config.component;
                    return <HubComponent />;
                  }
                  // Fallback to MinecraftHub if something goes wrong
                  const FallbackHub = HUB_REGISTRY['Minecraft']?.component;
                  return FallbackHub ? <FallbackHub /> : null;
                })()}
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

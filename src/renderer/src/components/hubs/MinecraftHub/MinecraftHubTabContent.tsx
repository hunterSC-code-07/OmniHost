import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMinecraftHubContext } from '../../../contexts/MinecraftHubContext';
import { OverviewTab } from '../../tabs/OverviewTab';
import { ConsoleTab } from '../../tabs/ConsoleTab';
import { OptionsTab } from '../../tabs/OptionsTab';
import { PlayersTab } from '../../tabs/PlayersTab';
import { FilesTab } from '../../tabs/FilesTab';
import { BackupsTab } from '../../tabs/BackupsTab';
import { ModsTab } from '../../tabs/ModsTab';
import { SoftwareTab } from '../../tabs/SoftwareTab';

export const MinecraftHubTabContent: React.FC = () => {
  const { activeTab, tabDirection, handleTabChange, activeServer, serverMeta, fetchServerMeta } = useMinecraftHubContext();

  return (
    <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
      <AnimatePresence custom={tabDirection} mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          custom={tabDirection}
          variants={{
            enter: (direction: number) => ({
              x: direction > 0 ? 50 : -50,
              opacity: 0,
              position: 'absolute' as const,
              width: '100%',
              height: '100%'
            }),
            center: {
              x: 0,
              opacity: 1,
              position: 'relative' as const,
              width: '100%',
              height: '100%'
            },
            exit: (direction: number) => ({
              x: direction < 0 ? 50 : -50,
              opacity: 0,
              position: 'absolute' as const,
              width: '100%',
              height: '100%'
            })
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex flex-col min-h-0 w-full h-full"
        >
          {activeTab === 'overview' && (
            <OverviewTab 
              serverVersion={serverMeta ? `${serverMeta.type} ${serverMeta.version}` : 'Loading...'}
              maxPlayers={activeServer.maxPlayers || 20}
              maxRam={serverMeta?.ram ? Number(serverMeta.ram) : 4}
              maxCpu={serverMeta?.cpu ? Number(serverMeta.cpu) : 4}
            />
          )}

          {activeTab === 'console' && (
            <ConsoleTab 
              isActive={activeTab === 'console'}
              onPlayerClick={() => {
                handleTabChange('players');
              }}
            />
          )}

          {activeTab === 'options' && (
            <OptionsTab 
              serverId={activeServer.id}
              onConfigSaved={fetchServerMeta}
            />
          )}

          {activeTab === 'players' && (
            <PlayersTab />
          )}
          
          {activeTab === 'files' && (
            <FilesTab />
          )}
          
          {activeTab === 'backups' && (
            <BackupsTab />
          )}

          {activeTab === 'mods' && (
            <ModsTab serverMeta={serverMeta} />
          )}

          {activeTab === 'software' && (
            <SoftwareTab />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDayzHubContext } from '../../../contexts/DayzHubContext';
import { DayzConsoleTab } from './tabs/DayzConsoleTab';
import { DayzOptionsTab } from './tabs/DayzOptionsTab';
import { DayzEconomyTab } from './tabs/DayzEconomyTab';
import { DayzModsTab } from './tabs/DayzModsTab';
import { DayzInstalledModsTab } from './tabs/DayzInstalledModsTab';
import { DayzFilesTab } from './tabs/DayzFilesTab';
import { DayzVppAdminTab } from './tabs/DayzVppAdminTab';

export const DayzHubTabContent: React.FC = () => {
  const { activeTab, tabDirection, handleTabChange } = useDayzHubContext();

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
          {activeTab === 'console' && (
            <DayzConsoleTab />
          )}
          {activeTab === 'options' && (
            <DayzOptionsTab />
          )}
          {activeTab === 'economy' && (
            <DayzEconomyTab />
          )}
          {activeTab === 'mods' && (
            <DayzModsTab onNavigateToInstalled={() => handleTabChange('installed')} />
          )}
          {activeTab === 'installed' && (
            <DayzInstalledModsTab />
          )}
          {activeTab === 'files' && (
            <DayzFilesTab />
          )}
          {activeTab === 'vppadmin' && (
            <DayzVppAdminTab />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

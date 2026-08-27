import React, { useState } from 'react';
import { ServerSettingsTab } from './tabs/ServerSettingsTab';
import { ModListTab } from './tabs/ModListTab';
import { useSevenDaysStatus } from '../../../hooks/useSevenDaysStatus';

import { TunnelModal } from '../../modals/TunnelModal';
import { useUiStore } from '../../../store/useUiStore';

type Tab = 'settings' | 'mods';

export const SevenDaysToDieHub: React.FC<{ serverId: number }> = ({ serverId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [isTunnelModalOpen, setIsTunnelModalOpen] = useState(false);
  const { status, startServer, stopServer } = useSevenDaysStatus(serverId);
  
  const tunnelStatus = useUiStore(state => state.tunnelStatus);
  const tunnelIp = useUiStore(state => state.tunnelIp);
  const setTempTunnelIp = useUiStore(state => state.setTempTunnelIp);
  const setTunnelStatus = useUiStore(state => state.setTunnelStatus);

  const handleTunnel = async () => {
    if (tunnelStatus === 'Online') {
      setTunnelStatus('Stopping...');
      // @ts-ignore
      await window.api.system.stopTunnel();
      setTunnelStatus('Offline');
    } else {
      setTunnelStatus('Starting...');
      // @ts-ignore
      await window.api.system.startTunnel(tunnelIp);
      setTunnelStatus('Online');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-gray-800 border-b border-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-red-500">7 Days to Die</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-400">Status:</span>
            <span className={`font-semibold ${status === 'running' ? 'text-green-500' : 'text-red-500'}`}>
              {status.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          {/* FRP Tunnel Buttons */}
          <div className="flex rounded-lg overflow-hidden border border-gray-600 bg-gray-700">
            <button 
              onClick={handleTunnel} 
              disabled={tunnelStatus === 'Starting...' || tunnelStatus === 'Stopping...'}
              title={tunnelStatus === 'Online' ? 'Stop FRP Tunnel' : 'Start FRP Tunnel'} 
              className={`px-4 py-2 font-bold flex items-center gap-2 transition-colors ${
                tunnelStatus === 'Online' ? 'bg-blue-600 text-white hover:bg-blue-700' : 
                tunnelStatus === 'Starting...' || tunnelStatus === 'Stopping...' ? 'bg-gray-600 text-gray-400' : 
                'hover:bg-gray-600 text-gray-200'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${tunnelStatus === 'Starting...' || tunnelStatus === 'Stopping...' ? 'animate-spin' : ''}`}>
                {tunnelStatus === 'Starting...' || tunnelStatus === 'Stopping...' ? 'sync' : 'cell_tower'}
              </span>
              <span>{tunnelStatus === 'Online' ? 'FRP Online' : 'Start FRP'}</span>
            </button>
            <button 
              onClick={() => { setTempTunnelIp(tunnelIp); setIsTunnelModalOpen(true); }} 
              className="px-3 border-l border-gray-600 hover:bg-gray-600 transition-colors flex items-center justify-center text-gray-300" 
              title="Tunnel IP Settings"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          </div>

          {status === 'stopped' ? (
            <button 
              onClick={startServer}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition-colors"
            >
              Start Server
            </button>
          ) : (
            <button 
              onClick={stopServer}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors"
              disabled={status === 'stopping' || status === 'starting'}
            >
              {status === 'stopping' ? 'Stopping...' : 'Stop Server'}
            </button>
          )}
        </div>
      </div>
      {isTunnelModalOpen && <TunnelModal onClose={() => setIsTunnelModalOpen(false)} />}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left px-4 py-3 rounded transition-colors ${activeTab === 'settings' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              Server Settings
            </button>
            <button 
              onClick={() => setActiveTab('mods')}
              className={`w-full text-left px-4 py-3 rounded transition-colors ${activeTab === 'mods' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              Mods
            </button>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'settings' && <ServerSettingsTab serverId={serverId} />}
          {activeTab === 'mods' && <ModListTab serverId={serverId} />}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { ServerSettingsPanel } from './components/ServerSettingsPanel';
import { useModalStore } from '../../../../store/useModalStore';

export const ServerSettingsTab: React.FC<{ serverId: number }> = ({ serverId }) => {
  const { openSevenDaysConfigModal } = useModalStore();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-900 p-4 rounded-lg border border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-white">Server Settings</h2>
          <p className="text-gray-400 text-sm">Configure your 7 Days to Die server options.</p>
        </div>
        <button 
          onClick={() => openSevenDaysConfigModal(serverId)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
        >
          Advanced Config
        </button>
      </div>
      
      <ServerSettingsPanel serverId={serverId} />
    </div>
  );
};

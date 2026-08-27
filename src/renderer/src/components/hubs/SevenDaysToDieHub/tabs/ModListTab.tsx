import React from 'react';
import { ModListPanel } from './components/ModListPanel';

export const ModListTab: React.FC<{ serverId: number }> = ({ serverId }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-white">Mod Management</h2>
        <p className="text-gray-400 text-sm">Install and manage mods for your 7 Days to Die server.</p>
      </div>
      
      <ModListPanel serverId={serverId} />
    </div>
  );
};

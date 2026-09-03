import React from 'react';
import { useServerStore } from '../../../../store/useServerStore';

interface OverviewTabProps {
  serverId: number;
}

export const EnshroudedOverviewTab: React.FC<OverviewTabProps> = ({ serverId }) => {
  const { servers } = useServerStore();
  const server = servers.find(s => s.id === serverId);

  if (!server) return null;

  return (
    <div className="h-full flex flex-col p-8 gap-8 dayz-scrollbars overflow-y-auto">
      
      <div className="grid grid-cols-2 gap-8">
        
        <div className="bg-black/40 border border-blue-900/30 p-6 rounded-lg shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-blue-900/50 pb-4">
            <span className="material-symbols-outlined text-blue-400 text-3xl">info</span>
            <h3 className="text-xl font-bold text-blue-100">Server Info</h3>
          </div>
          
          <div className="flex flex-col gap-3 text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Status</span>
              <span className={`font-bold ${server.status === 'Online' ? 'text-green-400' : 'text-red-400'}`}>
                {server.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Game</span>
              <span>Enshrouded</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Type</span>
              <span>Dedicated Server</span>
            </div>
          </div>
        </div>

        <div className="bg-black/40 border border-blue-900/30 p-6 rounded-lg shadow-lg flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-blue-900/50 pb-4">
            <span className="material-symbols-outlined text-purple-400 text-3xl">tips_and_updates</span>
            <h3 className="text-xl font-bold text-purple-100">Quick Tips</h3>
          </div>
          
          <ul className="list-disc pl-5 text-gray-300 flex flex-col gap-2 text-sm">
            <li>Ensure you have port forwarded <b>15636</b> and <b>15637</b> (TCP/UDP) if hosting publicly without tunnels.</li>
            <li>Enshrouded requires the server to be completely stopped before editing the JSON config.</li>
            <li>Start your server once to generate the config file if it doesn't appear in options.</li>
          </ul>
        </div>
        
      </div>
    </div>
  );
};

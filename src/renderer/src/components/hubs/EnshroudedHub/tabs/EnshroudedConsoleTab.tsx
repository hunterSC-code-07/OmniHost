import React from 'react';
import { useServerStore } from '../../../../store/useServerStore';
import { useLogStore } from '../../../../store/useLogStore';

export const EnshroudedConsoleTab: React.FC = () => {
  const { activeServerId } = useServerStore();
  const { logs: allLogs } = useLogStore();

  const logs = activeServerId ? allLogs.filter(l => l.id === activeServerId.toString() || l.id === 'global').map(l => l.msg) : [];

  return (
    <div className="h-full flex flex-col bg-black/60 font-mono text-sm p-4 overflow-y-auto">
      {logs.length === 0 ? (
        <div className="text-gray-500 italic">Waiting for server output...</div>
      ) : (
        logs.map((log, i) => (
          <div key={i} className="text-gray-300 break-words mb-1">
            {log}
          </div>
        ))
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useSevenDaysServerConfig } from '../../../../../hooks/useSevenDaysServerConfig';

export const ServerSettingsPanel: React.FC<{ serverId: number }> = ({ serverId }) => {
  const { config, loading, error, fetchConfig, updateConfig } = useSevenDaysServerConfig(serverId);
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    updateConfig(localConfig).catch(console.error);
  };

  if (loading && Object.keys(config).length === 0) return <div className="text-gray-400">Loading settings...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
      <h3 className="text-xl font-bold mb-4 text-white">Server Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Server Name</label>
          <input 
            type="text" 
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            value={localConfig.ServerName || ''}
            onChange={(e) => setLocalConfig({ ...localConfig, ServerName: e.target.value })}
            placeholder="My 7 Days Server"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Server Port</label>
          <input 
            type="number" 
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            value={localConfig.ServerPort || 26900}
            onChange={(e) => setLocalConfig({ ...localConfig, ServerPort: parseInt(e.target.value) })}
          />
        </div>
        
        <button 
          onClick={handleSave}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};

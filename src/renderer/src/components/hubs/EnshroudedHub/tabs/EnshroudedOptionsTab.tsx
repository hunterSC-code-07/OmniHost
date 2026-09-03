import React, { useState, useEffect } from 'react';
import { useEnshroudedOptions, EnshroudedConfig } from '../../../../hooks/useEnshroudedOptions';

export const EnshroudedOptionsTab: React.FC = () => {
  const { config, loading, handleSave } = useEnshroudedOptions();
  const [localConfig, setLocalConfig] = useState<EnshroudedConfig | null>(null);

  useEffect(() => {
    if (config) setLocalConfig(config);
  }, [config]);

  if (loading || !localConfig) {
    return <div className="p-8 text-center text-gray-400">Loading Configuration...</div>;
  }

  const handleChange = (field: keyof EnshroudedConfig, value: string | number) => {
    setLocalConfig({ ...localConfig, [field]: value });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSave(localConfig);
  };

  return (
    <div className="h-full overflow-y-auto p-6 text-gray-200 dayz-scrollbars">
      <h3 className="text-2xl font-bold mb-6 text-blue-100">Server Configuration</h3>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 max-w-2xl">
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Server Name</label>
          <input
            type="text"
            className="bg-black/40 border border-blue-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            value={localConfig.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Password</label>
          <input
            type="text"
            placeholder="Leave empty for no password"
            className="bg-black/40 border border-blue-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            value={localConfig.password || ''}
            onChange={(e) => handleChange('password', e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <label className="font-semibold">Game Port</label>
            <input
              type="number"
              className="bg-black/40 border border-blue-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              value={localConfig.gamePort}
              onChange={(e) => handleChange('gamePort', parseInt(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <label className="font-semibold">Query Port</label>
            <input
              type="number"
              className="bg-black/40 border border-blue-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              value={localConfig.queryPort}
              onChange={(e) => handleChange('queryPort', parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-semibold">Max Players (Slots)</label>
          <input
            type="number"
            className="bg-black/40 border border-blue-900/50 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            value={localConfig.slotCount}
            onChange={(e) => handleChange('slotCount', parseInt(e.target.value))}
          />
        </div>

        <div className="mt-4">
          <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            SAVE SETTINGS
          </button>
        </div>
      </form>
    </div>
  );
};

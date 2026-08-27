import React, { useEffect } from 'react';
import { useSevenDaysModInstall } from '../../../../../hooks/useSevenDaysModInstall';

export const ModListPanel: React.FC<{ serverId: number }> = ({ serverId }) => {
  const { mods, installing, error, fetchMods, installMod, uninstallMod } = useSevenDaysModInstall(serverId);

  useEffect(() => {
    fetchMods();
  }, [fetchMods]);

  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Installed Mods</h3>
        <button 
          onClick={() => installMod('example-mod-id')}
          disabled={installing}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded transition-colors disabled:opacity-50"
        >
          {installing ? 'Installing...' : 'Install Mod'}
        </button>
      </div>
      
      {mods.length === 0 ? (
        <p className="text-gray-400">No mods installed.</p>
      ) : (
        <ul className="space-y-2">
          {mods.map((mod) => (
            <li key={mod.id} className="bg-gray-900 p-3 rounded flex justify-between items-center border border-gray-700">
              <span className="text-white">{mod.name}</span>
              <button 
                onClick={() => uninstallMod(mod.id)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                Uninstall
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

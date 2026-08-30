import React, { useState, useEffect } from 'react';
import { useServerStore } from '../../../../store/useServerStore';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

export const SatisfactoryInstalledModsTab: React.FC = () => {
  const { activeServerId } = useServerStore();
  const [installedMods, setInstalledMods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInstalledMods = async () => {
    if (!activeServerId) return;
    setLoading(true);
    try {
      const mods = await window.api.server.getInstalledSatisfactoryMods(activeServerId);
      setInstalledMods(mods);
    } catch (error) {
      console.error('Failed to fetch installed mods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstalledMods();
  }, [activeServerId]);

  const handleUninstall = async (modFilename: string) => {
    if (!activeServerId) return;
    try {
      await window.api.server.uninstallSatisfactoryMod(activeServerId, modFilename);
      await fetchInstalledMods();
    } catch (error) {
      console.error('Failed to uninstall mod:', error);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 text-on-surface">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-display">Installed Mods</h2>
        <button 
          onClick={fetchInstalledMods}
          disabled={loading}
          className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-lg transition-colors"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-surface-variant/30 rounded-xl border border-white/5">
        <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark' } }} defer className="h-full">
          <div className="p-4 space-y-2">
            {installedMods.length === 0 && !loading && (
              <div className="text-on-surface-variant/50 italic text-center mt-8">No mods installed.</div>
            )}
            {installedMods.map((modFile) => (
              <div key={modFile} className="bg-surface-variant p-4 rounded-lg flex justify-between items-center border border-white/5">
                <span className="font-medium truncate mr-4 text-lg">{modFile}</span>
                <button 
                  onClick={() => handleUninstall(modFile)}
                  className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded transition-colors"
                >
                  Uninstall
                </button>
              </div>
            ))}
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};

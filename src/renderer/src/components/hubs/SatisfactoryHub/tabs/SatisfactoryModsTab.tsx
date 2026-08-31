import React, { useState, useEffect } from 'react';
import { useServerStore } from '../../../../store/useServerStore';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

export const SatisfactoryModsTab: React.FC = () => {
  const { activeServerId } = useServerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [installedMods, setInstalledMods] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);

  const fetchInstalledMods = async () => {
    if (!activeServerId) return;
    try {
      const mods = await window.api.server.getInstalledSatisfactoryMods(activeServerId);
      setInstalledMods(mods);
    } catch (error) {
      console.error('Failed to fetch installed mods:', error);
    }
  };

  const loadPopularMods = async () => {
    setLoading(true);
    try {
      const results = await window.api.server.searchSatisfactoryMods('', 40, 0);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to load popular mods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstalledMods();
    loadPopularMods();
  }, [activeServerId]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await window.api.server.searchSatisfactoryMods(searchQuery, 40, 0);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search mods:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (modReference: string, versions: any[]) => {
    if (!activeServerId || versions.length === 0) return;
    const latestVersion = versions[0];
    setInstalling(modReference);
    try {
      await window.api.server.installSatisfactoryMod(activeServerId, modReference, latestVersion.link);
      await fetchInstalledMods();
    } catch (error) {
      console.error('Failed to install mod:', error);
    } finally {
      setInstalling(null);
    }
  };

  const isModInstalled = (modRef: string) => installedMods.some(m => m.startsWith(modRef));

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 text-on-surface">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-display">Mod Browser (SMR)</h2>
      </div>

      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search Ficsit.app for mods..."
          className="flex-1 bg-surface-variant text-on-surface-variant p-3 rounded-lg border border-white/10 focus:outline-none focus:border-[#fa9549] transition-colors"
        />
        <button 
          onClick={handleSearch}
          disabled={loading}
          className="bg-[#fa9549] hover:bg-[#fa9549]/80 text-black px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-surface-variant/30 rounded-xl border border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-[#fa9549]">
            {searchQuery.trim() ? 'Search Results' : 'Popular Mods'}
          </h3>
        </div>
        
        <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark' } }} defer className="flex-1">
          <div className="p-4 space-y-4">
            {searchResults.length === 0 && !loading && (
              <div className="text-on-surface-variant/50 italic text-center mt-8">Search for mods to install.</div>
            )}
            {searchResults.map((mod) => (
              <div key={mod.mod_reference} className="bg-surface-variant p-4 rounded-lg border border-white/5 flex gap-4 transition-colors hover:border-white/10">
                {mod.logo && (
                  <img src={mod.logo} alt={mod.name} className="w-16 h-16 rounded-md object-cover bg-black/50" />
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold truncate text-lg" title={mod.name}>{mod.name}</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant/70 line-clamp-2 mb-2" title={mod.short_description}>
                    {mod.short_description}
                  </p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-xs text-[#fa9549] font-medium">{mod.downloads.toLocaleString()} DLs</span>
                    
                    {isModInstalled(mod.mod_reference) ? (
                      <button disabled className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded font-medium cursor-default">
                        Installed
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleInstall(mod.mod_reference, mod.versions)}
                        disabled={installing === mod.mod_reference || mod.versions.length === 0}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded transition-colors font-medium disabled:opacity-50"
                      >
                        {installing === mod.mod_reference ? 'Installing...' : 'Install'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};

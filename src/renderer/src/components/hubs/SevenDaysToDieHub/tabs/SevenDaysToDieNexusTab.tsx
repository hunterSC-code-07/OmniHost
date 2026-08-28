import React, { useState, useEffect } from 'react';

interface Props {
  serverId: number;
}

export const SevenDaysToDieNexusTab: React.FC<Props> = ({ serverId }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Register active server for downloads
    // @ts-ignore
    window.api.sevenDaysToDie.setActiveDownloadServer(serverId);

    const fetchKey = async () => {
      // @ts-ignore
      const key = await window.api.sevenDaysToDie.getNexusApiKey();
      setApiKey(key);
      setLoading(false);
    };
    fetchKey();

    return () => {
      // Unregister on unmount
      // @ts-ignore
      window.api.sevenDaysToDie.setActiveDownloadServer(null);
    };
  }, [serverId]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.trim()) return;
    
    // @ts-ignore
    const success = await window.api.sevenDaysToDie.setNexusApiKey(inputKey.trim());
    if (success) {
      setApiKey(inputKey.trim());
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black/60">
        <div className="text-white text-lg animate-pulse">Checking API Key...</div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black/60 overflow-hidden">
        <div className="glass-panel p-8 max-w-md w-full flex flex-col gap-4 text-center">
          <div className="w-16 h-16 bg-[#da8e35]/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[32px] text-[#da8e35]">key</span>
          </div>
          <h2 className="text-2xl font-bold text-white">NexusMods API Key</h2>
          <p className="text-gray-400 text-sm">
            To automatically resolve dependencies for Nexus mods, please provide your personal API key. 
            You can generate one for free on your NexusMods account settings page.
          </p>
          <a 
            href="https://next.nexusmods.com/settings/api-keys" 
            target="_blank" 
            rel="noreferrer"
            className="text-[#da8e35] hover:text-[#f3a64b] text-sm underline mb-4"
          >
            Get your API key here
          </a>
          
          <form onSubmit={handleSaveKey} className="flex flex-col gap-4">
            <input 
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Paste your API key here..."
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#da8e35]/50 transition-colors"
            />
            <button 
              type="submit"
              disabled={!inputKey.trim()}
              className="w-full py-3 bg-[#da8e35] hover:bg-[#c47f2f] text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save API Key
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <webview 
        src="https://www.nexusmods.com/7daystodie" 
        className="w-full h-full"
        allowpopups="true"
      />
    </div>
  );
};

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
      <div className="flex-1 flex flex-col items-center justify-center p-8 sevendays-ui min-h-0">
        <div className="sevendays-panel p-8 max-w-lg w-full flex flex-col gap-6 text-center border border-[var(--7dtd-border)]">
          <div className="w-16 h-16 bg-[#da8e35]/20 border border-[#da8e35]/50 flex items-center justify-center mx-auto mb-2">
            <span className="material-symbols-outlined text-[32px] text-[#da8e35]">key</span>
          </div>
          <h2 className="sevendays-title text-3xl">NEXUSMODS API KEY</h2>
          <p className="text-[var(--7dtd-text-dim)] uppercase">
            To automatically resolve dependencies for Nexus mods, please provide your personal API key. 
            You can generate one for free on your NexusMods account settings page.
          </p>
          <a 
            href="https://next.nexusmods.com/settings/api-keys" 
            target="_blank" 
            rel="noreferrer"
            className="text-[#da8e35] hover:text-[#f3a64b] underline uppercase font-bold"
          >
            GET YOUR API KEY HERE
          </a>
          
          <form onSubmit={handleSaveKey} className="flex flex-col gap-6 mt-4">
            <div className="sevendays-input-container">
              <input 
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="PASTE YOUR API KEY HERE..."
                className="sevendays-input w-full px-4 py-2 uppercase"
              />
            </div>
            <button 
              type="submit"
              disabled={!inputKey.trim()}
              className="sevendays-btn px-8 py-3 text-lg"
            >
              SAVE API KEY
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
        allowpopups={true}
      />
    </div>
  );
};

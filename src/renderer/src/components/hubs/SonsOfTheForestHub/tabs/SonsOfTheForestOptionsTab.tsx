import React, { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useServerStore } from '../../../../store/useServerStore';
import { useToastStore } from '../../../../store/useToastStore';

export const SonsOfTheForestOptionsTab: React.FC = () => {
  const { activeServerId } = useServerStore();
  const { showToast } = useToastStore();
  const [configContent, setConfigContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      setIsLoading(true);
      try {
        if (activeServerId) {
          // @ts-ignore
          const content = await window.api.server.readConfig(activeServerId);
          if (content !== null) {
            setConfigContent(content);
          } else {
            setConfigContent('// dedicatedserver.cfg not found.\n// Start the server once to generate this file automatically!\n');
          }
        }
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };
    loadConfig();
  }, [activeServerId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeServerId) {
        // @ts-ignore
        const success = await window.api.server.writeConfig(activeServerId, configContent);
        if (success) {
          showToast('Configuration saved successfully!', 'success');
        } else {
          showToast('Failed to save configuration.', 'error');
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Error saving configuration.', 'error');
    }
    setIsSaving(false);
  };

  const serverNameMatch = configContent.match(/^"ServerName"\s*:\s*"(.*)"/m);
  const serverName = serverNameMatch ? serverNameMatch[1] : '';

  const steamTokenMatch = configContent.match(/^"GameServerToken"\s*:\s*"(.*)"/m);
  const steamToken = steamTokenMatch ? steamTokenMatch[1] : '';

  const serverIPMatch = configContent.match(/^"IpAddress"\s*:\s*"(.*)"/m);
  const serverIP = serverIPMatch ? serverIPMatch[1] : '';

  const updateServerName = (newName: string) => {
    if (configContent.match(/^"ServerName"/m)) {
      setConfigContent(configContent.replace(/^"ServerName"\s*:\s*".*"/m, `"ServerName": "${newName}"`));
    } else {
      setConfigContent(configContent + `\n"ServerName": "${newName}"`);
    }
  };

  const updateSteamToken = (newToken: string) => {
    if (configContent.match(/^"GameServerToken"/m)) {
      setConfigContent(configContent.replace(/^"GameServerToken"\s*:\s*".*"/m, `"GameServerToken": "${newToken}"`));
    } else {
      setConfigContent(configContent + `\n"GameServerToken": "${newToken}"`);
    }
  };

  const updateServerIP = (newIP: string) => {
    if (configContent.match(/^"IpAddress"/m)) {
      setConfigContent(configContent.replace(/^"IpAddress"\s*:\s*".*"/m, `"IpAddress": "${newIP}"`));
    } else {
      setConfigContent(configContent + `\n"IpAddress": "${newIP}"`);
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-on-surface-variant font-body-md text-body-md">Loading configuration...</div>;
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-transparent flex flex-col p-8 gap-6">
      <div className="flex justify-between items-end border-b border-outline-variant/20 pb-6">
        <div>
          <h3 className="font-headline-lg text-headline-lg text-on-surface mb-1">Server Configuration</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">Edit your dedicatedserver.cfg settings.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#16a34a]/20 border border-[#16a34a]/50 hover:bg-[#16a34a]/30 hover:border-[#4ade80] text-[#4ade80] px-6 py-2.5 rounded-lg font-bold shadow-[0_0_15px_rgba(22,163,74,0.1)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <><span className="material-symbols-outlined animate-spin text-[20px]">sync</span> Saving...</>
          ) : (
            <><span className="material-symbols-outlined text-[20px]">save</span> Save Changes</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 rounded-xl p-6 shadow-inner flex flex-col gap-2">
            <label className="text-on-surface font-title-md text-title-md">Server Name</label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => updateServerName(e.target.value)}
              className="bg-surface-container border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary/50 font-body-md text-body-md"
              placeholder="Enter server name..."
            />
          </div>

          <div className="bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 rounded-xl p-6 shadow-inner flex flex-col gap-2">
            <label className="text-on-surface font-title-md text-title-md">Server IP Binding</label>
            <input
              type="text"
              value={serverIP}
              onChange={(e) => updateServerIP(e.target.value)}
              className="bg-surface-container border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary/50 font-body-md text-body-md"
              placeholder="e.g., 0.0.0.0"
            />
            <p className="text-on-surface-variant font-body-sm text-body-sm">
              Use <b>0.0.0.0</b> to listen on all network interfaces (Required for Tunnels/FRP).
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 rounded-xl p-6 shadow-inner flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-on-surface font-title-md text-title-md">Steam Server Token</label>
              <a 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Open externally if there's a shell handler, but standard browser works if running in Electron
                  window.open('https://steamcommunity.com/dev/managegameservers', '_blank');
                }}
                className="text-primary hover:text-primary/80 font-body-sm text-body-sm flex items-center gap-1"
                title="App ID: 1326470"
              >
                Get Token <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </a>
            </div>
            <input
              type="password"
              value={steamToken}
              onChange={(e) => updateSteamToken(e.target.value)}
              className="bg-surface-container border border-outline-variant/50 rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary/50 font-body-md text-body-md"
              placeholder="Paste Steam Login Token..."
            />
            <p className="text-on-surface-variant font-body-sm text-body-sm">
              Required for your server to be visible on the internet. Use App ID <b>1326470</b> (base game App ID).
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[400px] bg-surface-container-lowest/80 backdrop-blur-md border border-outline-variant/30 rounded-xl overflow-hidden flex flex-col shadow-inner">
        <div className="bg-surface-container/50 px-4 py-3 border-b border-outline-variant/30 text-on-surface-variant font-label-md text-label-md flex justify-between">
          <span>Raw Editor</span>
        </div>
        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0 w-full h-full" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <textarea 
            value={configContent}
            onChange={(e) => setConfigContent(e.target.value)}
            className="w-full min-h-full p-6 bg-transparent text-on-surface font-console-text text-console-text resize-none outline-none leading-relaxed"
            spellCheck={false}
          />
        </OverlayScrollbarsComponent>
      </div>
    </div>
  );
};

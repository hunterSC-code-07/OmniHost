import React, { useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useServerStore } from '../../../../store/useServerStore';
import { useToastStore } from '../../../../store/useToastStore';

export const TheForestOptionsTab: React.FC = () => {
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
            setConfigContent('// Server.cfg not found.\n// Start the server once to generate this file automatically!\n');
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

  const serverNameMatch = configContent.match(/^serverName (.*)$/m);
  const serverName = serverNameMatch ? serverNameMatch[1] : '';

  const vacMatch = configContent.match(/^enableVAC (on|off)$/m);
  const enableVAC = vacMatch ? vacMatch[1] === 'on' : false;

  const steamTokenMatch = configContent.match(/^serverSteamAccount (.*)$/m);
  const steamToken = steamTokenMatch ? steamTokenMatch[1] : '';

  const serverIPMatch = configContent.match(/^serverIP (.*)$/m);
  const serverIP = serverIPMatch ? serverIPMatch[1] : '';

  const updateServerName = (newName: string) => {
    if (configContent.match(/^serverName /m)) {
      setConfigContent(configContent.replace(/^serverName .*$/m, `serverName ${newName}`));
    } else {
      setConfigContent(configContent + `\nserverName ${newName}`);
    }
  };

  const updateVAC = (enabled: boolean) => {
    const val = enabled ? 'on' : 'off';
    if (configContent.match(/^enableVAC /m)) {
      setConfigContent(configContent.replace(/^enableVAC (on|off)$/m, `enableVAC ${val}`));
    } else {
      setConfigContent(configContent + `\nenableVAC ${val}`);
    }
  };

  const updateSteamToken = (newToken: string) => {
    if (configContent.match(/^serverSteamAccount /m)) {
      setConfigContent(configContent.replace(/^serverSteamAccount .*$/m, `serverSteamAccount ${newToken}`));
    } else {
      setConfigContent(configContent + `\nserverSteamAccount ${newToken}`);
    }
  };

  const updateServerIP = (newIP: string) => {
    if (configContent.match(/^serverIP /m)) {
      setConfigContent(configContent.replace(/^serverIP .*$/m, `serverIP ${newIP}`));
    } else {
      setConfigContent(configContent + `\nserverIP ${newIP}`);
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-white font-bold text-lg uppercase tracking-widest">Loading configuration...</div>;
  }

  return (
    <OverlayScrollbarsComponent 
      className="flex-1 min-h-0" 
      options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
      defer
    >
      <div className="bg-transparent flex flex-col px-12 py-8 gap-12 text-white font-bold min-h-full">
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <h3 className="forest-title !text-3xl text-[var(--forest-yellow)]">SERVER CONFIGURATION</h3>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="forest-btn text-lg hover:text-[var(--forest-green)]"
          >
            {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-12 max-w-6xl flex-none">
          
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col">
              <h4 className="forest-title mb-6 text-xl">GENERAL SETTINGS</h4>
              
              <div className="forest-input-row">
                <span className="forest-input-label">SERVER NAME</span>
                <div className="forest-input-container">
                  <span className="forest-input-arrow opacity-0 cursor-default">&lt;</span>
                  <input
                    type="text"
                    value={serverName}
                    onChange={(e) => updateServerName(e.target.value)}
                    className="forest-input"
                    placeholder="Enter name"
                  />
                  <span className="forest-input-arrow opacity-0 cursor-default">&gt;</span>
                </div>
              </div>

              <div className="forest-input-row">
                <span className="forest-input-label">SERVER IP BINDING</span>
                <div className="forest-input-container">
                  <span className="forest-input-arrow opacity-0 cursor-default">&lt;</span>
                  <input
                    type="text"
                    value={serverIP}
                    onChange={(e) => updateServerIP(e.target.value)}
                    className="forest-input"
                    placeholder="0.0.0.0"
                  />
                  <span className="forest-input-arrow opacity-0 cursor-default">&gt;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col">
              <h4 className="forest-title mb-6 text-xl">SECURITY & AUTH</h4>

              <div className="forest-input-row">
                <span className="forest-input-label">VALVE ANTI-CHEAT</span>
                <div className="forest-input-container">
                  <span className="forest-input-arrow" onClick={() => updateVAC(!enableVAC)}>&lt;</span>
                  <div className="flex-1 text-center font-bold text-sm tracking-wider cursor-pointer" onClick={() => updateVAC(!enableVAC)}>
                    {enableVAC ? 'ON' : 'OFF'}
                  </div>
                  <span className="forest-input-arrow" onClick={() => updateVAC(!enableVAC)}>&gt;</span>
                </div>
              </div>

              <div className="forest-input-row">
                <span className="forest-input-label flex flex-col gap-1">
                  <span>STEAM TOKEN</span>
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('https://steamcommunity.com/dev/managegameservers', '_blank');
                    }}
                    className="text-white/50 hover:text-white underline text-[10px]"
                  >
                    GET TOKEN (APP ID 242760)
                  </a>
                </span>
                <div className="forest-input-container">
                  <span className="forest-input-arrow opacity-0 cursor-default">&lt;</span>
                  <input
                    type="password"
                    value={steamToken}
                    onChange={(e) => updateSteamToken(e.target.value)}
                    className="forest-input"
                    placeholder="Paste Token..."
                  />
                  <span className="forest-input-arrow opacity-0 cursor-default">&gt;</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col flex-1 min-h-[400px]">
          <h4 className="forest-title mb-4 text-xl flex-none">RAW EDITOR</h4>
          <div className="flex-1 border border-[var(--forest-gray)] bg-[var(--forest-gray-dark)] overflow-hidden flex flex-col relative min-h-0">
            <div className="absolute inset-0">
              <OverlayScrollbarsComponent 
                className="w-full h-full" 
                options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
                defer
              >
                <textarea 
                  value={configContent}
                  onChange={(e) => setConfigContent(e.target.value)}
                  className="w-full min-h-full p-6 bg-transparent text-white font-mono text-[14px] resize-none outline-none leading-relaxed font-normal"
                  spellCheck={false}
                />
              </OverlayScrollbarsComponent>
            </div>
          </div>
        </div>
      </div>
    </OverlayScrollbarsComponent>
  );
};

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

  // Hover state for the description banner
  const [hoveredOption, setHoveredOption] = useState<{ label: string, desc: string } | null>(null);

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

  const updateConfig = (key: string, newValue: string) => {
    const regex = new RegExp(`^"${key}"\\s*:\\s*".*"`, 'm');
    if (configContent.match(regex)) {
      setConfigContent(configContent.replace(regex, `"${key}": "${newValue}"`));
    } else {
      setConfigContent(configContent + `\n"${key}": "${newValue}"`);
    }
  };

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center sotf-glitch-text text-xl">LOADING...</div>;
  }

  return (
    <div className="flex-1 min-h-0 bg-transparent flex flex-col items-center">
      <div className="w-full max-w-4xl flex-1 flex flex-col mt-4 mb-4">
        
        {/* Hover Description Banner */}
        <div className="h-[40px] w-full bg-[var(--sotf-panel)] mb-6 flex items-center px-4 overflow-hidden border-l-4 border-l-[var(--sotf-highlight)]">
          {hoveredOption ? (
            <p className="text-sm font-bold truncate">
              <span className="text-[var(--sotf-highlight)] uppercase">{hoveredOption.label}</span>
              <span className="text-[var(--sotf-text-dim)] uppercase mx-2">-</span>
              <span className="text-white uppercase">{hoveredOption.desc}</span>
            </p>
          ) : (
            <p className="text-sm font-bold text-[var(--sotf-text-dim)] uppercase">HOVER OVER AN OPTION FOR DETAILS</p>
          )}
        </div>

        <OverlayScrollbarsComponent 
          className="flex-1 min-h-0 w-full sotf-scrollbars" 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
          defer
        >
          <div className="flex flex-col mb-12">
            
            {/* SERVER SECTION */}
            <div className="sotf-section-header mb-2 mt-4">SERVER DETAILS</div>
            
            <div 
              className="sotf-row"
              onMouseEnter={() => setHoveredOption({ label: 'SERVER NAME', desc: 'THE NAME DISPLAYED IN THE SERVER BROWSER' })}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div className="sotf-label w-[40%]">SERVER NAME</div>
              <div className="w-[60%] flex justify-end">
                <input 
                  type="text" 
                  value={serverName}
                  onChange={(e) => updateConfig('ServerName', e.target.value)}
                  className="bg-transparent text-right font-bold uppercase w-full focus:outline-none focus:text-[var(--sotf-highlight)] placeholder:text-[var(--sotf-text-dim)]"
                  placeholder="SOTF SERVER"
                />
              </div>
            </div>

            <div 
              className="sotf-row"
              onMouseEnter={() => setHoveredOption({ label: 'IP ADDRESS', desc: 'BIND IP ADDRESS. 0.0.0.0 IS REQUIRED FOR TUNNELS' })}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div className="sotf-label w-[40%]">IP ADDRESS</div>
              <div className="w-[60%] flex justify-end">
                <input 
                  type="text" 
                  value={serverIP}
                  onChange={(e) => updateConfig('IpAddress', e.target.value)}
                  className="bg-transparent text-right font-bold uppercase w-full focus:outline-none focus:text-[var(--sotf-highlight)] placeholder:text-[var(--sotf-text-dim)]"
                  placeholder="0.0.0.0"
                />
              </div>
            </div>

            <div 
              className="sotf-row"
              onMouseEnter={() => setHoveredOption({ label: 'STEAM TOKEN', desc: 'REQUIRED FOR PUBLIC SERVERS. APP ID 1326470' })}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <div className="sotf-label w-[40%]">STEAM TOKEN</div>
              <div className="w-[60%] flex justify-end">
                <input 
                  type="password" 
                  value={steamToken}
                  onChange={(e) => updateConfig('GameServerToken', e.target.value)}
                  className="bg-transparent text-right font-bold w-full focus:outline-none focus:text-[var(--sotf-highlight)] placeholder:text-[var(--sotf-text-dim)]"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
            </div>

            {/* RAW CONFIG SECTION */}
            <div className="sotf-section-header mb-2 mt-12">RAW CONFIGURATION</div>
            <div 
              className="w-full bg-[var(--sotf-panel)] border border-[var(--sotf-border)] mt-4 p-4 h-[400px]"
              onMouseEnter={() => setHoveredOption({ label: 'RAW CONFIG', desc: 'DIRECTLY EDIT THE DEDICATEDSERVER.CFG FILE' })}
              onMouseLeave={() => setHoveredOption(null)}
            >
              <textarea 
                value={configContent}
                onChange={(e) => setConfigContent(e.target.value)}
                className="w-full h-full bg-transparent text-white font-mono text-sm resize-none outline-none whitespace-pre"
                spellCheck={false}
              />
            </div>
            
          </div>
        </OverlayScrollbarsComponent>
        
        {/* BOTTOM ACTION BAR */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-[var(--sotf-border)]">
          <button 
            className="sotf-btn hover:-translate-x-1" 
            onClick={() => {
              if (activeServerId) {
                // @ts-ignore
                window.api.server.readConfig(activeServerId).then(content => {
                  if (content) setConfigContent(content);
                });
              }
            }}
          >
            DISCARD
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`text-2xl font-bold uppercase tracking-widest flex items-center gap-2 ${isSaving ? 'text-gray-500 cursor-not-allowed' : 'text-white hover:text-[var(--sotf-highlight)] text-shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all'}`}
          >
            {isSaving ? 'SAVING...' : 'APPLY'}
          </button>
        </div>
        
      </div>
    </div>
  );
};

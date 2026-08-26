import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

import { useMinecraftConfig } from '../../hooks/useMinecraftConfig';

interface OptionsTabProps {
  serverId: number;
  onConfigSaved?: () => void;
}

export const OptionsTab: React.FC<OptionsTabProps> = React.memo(({
  serverId,
  onConfigSaved
}) => {
  const {
    rawConfigText, setRawConfigText,
    advancedMode, setAdvancedMode,
    props, setProps,
    loadConfig, handleSaveConfig
  } = useMinecraftConfig(serverId);

  useEffect(() => {
    if (serverId) {
      loadConfig(serverId);
    }
  }, [serverId]);
  const [ramLimit, setRamLimit] = useState(4);
  const [cpuLimit, setCpuLimit] = useState(4);
  const [autoStart, setAutoStart] = useState(false);
  const [autoStop, setAutoStop] = useState(false);
  const [sysInfo, setSysInfo] = useState({ totalMem: 8, cpus: 4 });
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  useEffect(() => {
    // Fetch System OS Info
    window.api.system.getSystemInfo().then((info: any) => {
      setSysInfo({
        totalMem: Math.max(2, Math.floor(info.totalMem / (1024 * 1024 * 1024))),
        cpus: info.cpus || 4
      });
    });

    // Fetch Meta
    window.api.server.getServerMeta(serverId).then((meta: any) => {
      if (meta) {
        if (meta.ram) setRamLimit(meta.ram);
        if (meta.cpu) setCpuLimit(meta.cpu);
        if (meta.autoStart) setAutoStart(meta.autoStart);
        if (meta.autoStop) setAutoStop(meta.autoStop);
      }
    });
  }, [serverId]);

  const saveMetaAndConfig = async () => {
    setIsSavingMeta(true);
    await window.api.server.updateServerMeta(serverId, {
      ram: ramLimit,
      cpu: cpuLimit,
      autoStart,
      autoStop
    });
    // Also toggle the proxy listening state
    await window.api.server.toggleAutoStart(serverId, autoStart);
    
    handleSaveConfig();
    if (onConfigSaved) onConfigSaved();
    setIsSavingMeta(false);
  };

  const ConfigToggle = ({ label, propKey, invert = false }: any) => {
    const rawVal = props[propKey] === 'true';
    const isToggled = invert ? !rawVal : rawVal;
    
    return (
      <div className="bg-surface-container-low border border-surface-container-highest hover:border-brand/40 transition-colors flex justify-between items-center px-5 py-3 w-full h-14 shadow-sm rounded-xl">
        <span className="font-label-md text-label-md text-on-surface">{label}</span>
        <button 
          onClick={() => setProps(prev => ({ ...prev, [propKey]: invert ? (isToggled ? 'true' : 'false') : (!isToggled ? 'true' : 'false') }))} 
          className={`w-12 h-6 rounded-full relative transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${isToggled ? 'bg-brand shadow-[0_0_12px_rgba(255,215,0,0.4)]' : 'bg-surface-container-highest'}`}
        >
          <div className={`absolute top-1 w-4 h-4 rounded-full transition-transform duration-300 shadow-md ${isToggled ? 'translate-x-7 bg-background' : 'translate-x-1 bg-on-surface-variant'}`}></div>
        </button>
      </div>
    );
  };

  const ConfigSelect = ({ label, propKey, options }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="bg-surface-container-low border border-surface-container-highest hover:border-brand/40 transition-colors flex justify-between items-center px-5 py-3 w-full h-14 shadow-sm rounded-xl relative" style={{ zIndex: isOpen ? 50 : 10 }}>
        <span className="font-label-md text-label-md text-on-surface">{label}</span>
        <div className="relative">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-[#050505] border border-gray-800 rounded-lg px-4 py-1.5 text-white outline-none focus:border-brand shadow-inner font-bold w-40 justify-between capitalize"
          >
            <span className="truncate">{props[propKey] || 'Select...'}</span>
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
          </button>
          
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
              <div className="absolute top-full right-0 mt-2 bg-[#0a0a0a]/95 backdrop-blur-3xl border border-white/20 rounded-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-50 py-2 w-48 max-h-60 overflow-y-auto">
                {options.map((opt: string) => (
                  <div 
                    key={opt} 
                    onClick={() => { setProps(prev => ({ ...prev, [propKey]: opt })); setIsOpen(false); }} 
                    className={`px-4 py-2 cursor-pointer hover:bg-white/10 transition-colors capitalize ${props[propKey] === opt ? 'text-brand font-bold' : 'text-[#bfbfbf]'}`}
                  >
                    {opt} {props[propKey] === opt && <span className="float-right text-brand">✓</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const ConfigNumber = ({ label, propKey }: any) => {
    const val = parseInt(props[propKey] || '0', 10);
    const inc = () => setProps(prev => ({ ...prev, [propKey]: (val + 1).toString() }));
    const dec = () => setProps(prev => ({ ...prev, [propKey]: (val - 1).toString() }));
    
    return (
      <div className="bg-surface-container-low border border-surface-container-highest hover:border-brand/40 transition-colors flex justify-between items-center px-5 py-3 w-full h-14 shadow-sm rounded-xl">
        <span className="font-label-md text-label-md text-on-surface">{label}</span>
        <div className="flex items-center gap-1 bg-background border border-surface-container-highest rounded-lg overflow-hidden focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/50 transition-all">
          <button type="button" onClick={dec} className="px-3 py-1.5 hover:bg-surface-container-highest hover:text-brand transition-colors text-on-surface-variant font-bold border-r border-surface-container-highest">-</button>
          <input 
            type="number" 
            value={props[propKey] || 0} 
            onChange={(e) => setProps(prev => ({ ...prev, [propKey]: e.target.value }))} 
            className="bg-transparent text-on-surface w-12 text-center outline-none font-label-md text-label-md [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
          />
          <button type="button" onClick={inc} className="px-3 py-1.5 hover:bg-surface-container-highest hover:text-brand transition-colors text-on-surface-variant font-bold border-l border-surface-container-highest">+</button>
        </div>
      </div>
    );
  };

  const ConfigString = ({ label, propKey, placeholder, isFullWidth = false }: any) => (
    <div className={`bg-surface-container-low border border-surface-container-highest hover:border-brand/40 transition-colors flex justify-between items-center px-5 py-3 w-full h-14 shadow-sm rounded-xl ${isFullWidth ? 'col-span-1 md:col-span-2 xl:col-span-3' : ''} gap-4`}>
      <span className="font-label-md text-label-md text-on-surface whitespace-nowrap">{label}</span>
      <input 
        type="text" 
        value={props[propKey] || ''} 
        placeholder={placeholder} 
        onChange={(e) => setProps(prev => ({ ...prev, [propKey]: e.target.value }))} 
        className="bg-background text-on-surface border border-surface-container-highest rounded-lg px-4 py-1.5 flex-1 outline-none font-label-md text-label-md focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all truncate placeholder-on-surface-variant/50" 
      />
    </div>
  );

  return (
    <div className="absolute inset-0 flex min-h-0">
      <OverlayScrollbarsComponent 
        className="flex-1 min-h-0 min-w-0 w-full" 
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
        defer
      >
        <div className="p-6 bg-transparent font-body flex flex-col gap-6 min-h-full">
      
      {/* Header Controls */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-brand drop-shadow-[0_0_8px_rgba(255,215,0,0.3)]">Options</h2>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setAdvancedMode(!advancedMode)} 
            className="font-label-md text-label-md text-brand hover:text-brand/80 transition-colors uppercase tracking-widest underline underline-offset-4"
          >
            {advancedMode ? 'Switch to Visual UI' : 'Raw server.properties'}
          </button>
          <button 
            onClick={saveMetaAndConfig} 
            disabled={isSavingMeta}
            className="relative overflow-hidden group bg-brand/10 backdrop-blur-xl border border-brand/30 shadow-[0_8px_32px_rgba(255,215,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] px-8 py-2.5 rounded-xl font-bold transition-all hover:border-brand/60 hover:shadow-[0_8px_32px_rgba(255,215,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.4)] text-brand flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none"></div>
            <div className="absolute -inset-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -rotate-45 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[4000ms] ease-in-out pointer-events-none"></div>
            <Save className="w-4 h-4 relative z-10" />
            <span className="relative z-10 uppercase tracking-widest">{isSavingMeta ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {advancedMode ? (
        <div className="h-[65vh] bg-transparent border border-surface-container-highest rounded-xl overflow-hidden flex flex-col shadow-inner">
          <textarea 
            className="flex-1 w-full bg-transparent text-brand p-6 font-mono text-sm focus:outline-none resize-none selection:bg-brand/30" 
            value={rawConfigText} 
            onChange={(e) => setRawConfigText(e.target.value)} 
            spellCheck="false" 
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          
          {/* Resource Slider Section */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-2xl p-8 shadow-glass flex flex-col items-center">
            <div className="text-center mb-6">
              <h3 className="font-headline-lg text-headline-lg text-on-surface">{ramLimit} GB RAM</h3>
              <p className="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-widest">{cpuLimit} shared CPU cores</p>
            </div>
            
            <div className="w-full max-w-4xl relative mb-10 group">
              <input 
                type="range" 
                min="1" 
                max={sysInfo.totalMem} 
                step="1"
                value={ramLimit} 
                onChange={(e) => setRamLimit(parseInt(e.target.value, 10))}
                className="w-full h-3 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-brand shadow-inner group-hover:bg-surface-container-highest/80 transition-colors"
              />
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-4 px-1">
                <span>1 GB</span>
                <span>{sysInfo.totalMem} GB (System Max)</span>
              </div>
            </div>

            <div className="w-full max-w-4xl relative group">
              <div className="text-center mb-4">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">CPU Allocation Limit</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max={sysInfo.cpus} 
                step="1"
                value={cpuLimit} 
                onChange={(e) => setCpuLimit(parseInt(e.target.value, 10))}
                className="w-full h-3 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-brand shadow-inner group-hover:bg-surface-container-highest/80 transition-colors"
              />
              <div className="flex justify-between font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-4 px-1">
                <span>1 Core</span>
                <span>{sysInfo.cpus} Cores (System Max)</span>
              </div>
            </div>
          </div>

          {/* Auto-Start / Auto-Stop Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-low border border-surface-container-highest hover:border-brand/40 transition-colors flex justify-between items-center px-6 py-4 shadow-sm rounded-xl h-16">
              <span className="font-label-md text-label-md text-on-surface uppercase tracking-widest">Start when any player joins</span>
              <button 
                onClick={() => setAutoStart(!autoStart)} 
                className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${autoStart ? 'bg-brand shadow-[0_0_12px_rgba(255,215,0,0.4)]' : 'bg-surface-container-highest'}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${autoStart ? 'translate-x-8 bg-background' : 'translate-x-1 bg-on-surface-variant'}`}></div>
              </button>
            </div>
            
            <div className="bg-surface-container-low border border-surface-container-highest hover:border-brand/40 transition-colors flex justify-between items-center px-6 py-4 shadow-sm rounded-xl h-16">
              <span className="font-label-md text-label-md text-on-surface uppercase tracking-widest">Stop after 10m without players</span>
              <button 
                onClick={() => setAutoStop(!autoStop)} 
                className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] ${autoStop ? 'bg-brand shadow-[0_0_12px_rgba(255,215,0,0.4)]' : 'bg-surface-container-highest'}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full transition-transform duration-300 shadow-md ${autoStop ? 'translate-x-8 bg-background' : 'translate-x-1 bg-on-surface-variant'}`}></div>
              </button>
            </div>
          </div>

          {/* Server Properties Label */}
          <div className="flex items-center gap-3 mt-4 px-2">
            <Settings className="w-5 h-5 text-on-surface-variant" />
            <h3 className="font-headline-md text-headline-md text-on-surface">server.properties</h3>
          </div>

          {/* Properties Grid */}
          <div className="bg-transparent p-6 border border-surface-container-highest rounded-2xl shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <ConfigNumber label="Slots" propKey="max-players" />
              <ConfigSelect label="Gamemode" propKey="gamemode" options={['survival', 'creative', 'adventure', 'spectator']} />
              <ConfigToggle label="Whitelist" propKey="white-list" />
              <ConfigSelect label="Difficulty" propKey="difficulty" options={['peaceful', 'easy', 'normal', 'hard']} />
              <ConfigToggle label="Commandblocks" propKey="enable-command-block" />
              <ConfigToggle label="Cracked" propKey="online-mode" invert={true} />
              <ConfigToggle label="Monster" propKey="spawn-monsters" />
              <ConfigToggle label="PVP" propKey="pvp" />
              <ConfigToggle label="Force Gamemode" propKey="force-gamemode" />
              <ConfigToggle label="Fly" propKey="allow-flight" />
              <ConfigNumber label="View distance" propKey="view-distance" />
              <ConfigToggle label="Animals" propKey="spawn-animals" />
              <ConfigToggle label="Resource pack req." propKey="require-resource-pack" />
              <ConfigToggle label="Villagers" propKey="spawn-npcs" />
              <ConfigNumber label="Spawn Protection" propKey="spawn-protection" />
              <ConfigToggle label="Nether" propKey="allow-nether" />
              <ConfigNumber label="Idle timeout" propKey="player-idle-timeout" />
              <ConfigString label="Resource pack URL" propKey="resource-pack" placeholder="https://example.com/pack.zip" isFullWidth={true} />
              <ConfigString label="Resource pack prompt" propKey="resource-pack-prompt" placeholder="Please accept this resource pack" isFullWidth={true} />
            </div>
          </div>
          
        </div>
      )}
        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
});

OptionsTab.displayName = 'OptionsTab';

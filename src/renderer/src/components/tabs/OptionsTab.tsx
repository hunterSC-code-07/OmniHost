import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';

interface OptionsTabProps {
  advancedMode: boolean;
  setAdvancedMode: React.Dispatch<React.SetStateAction<boolean>>;
  handleSaveConfig: () => void;
  rawConfigText: string;
  setRawConfigText: React.Dispatch<React.SetStateAction<string>>;
  props: Record<string, string>;
  setProps: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  serverId: number;
  onConfigSaved?: () => void;
}

export const OptionsTab: React.FC<OptionsTabProps> = React.memo(({
  advancedMode,
  setAdvancedMode,
  handleSaveConfig,
  rawConfigText,
  setRawConfigText,
  props,
  setProps,
  serverId,
  onConfigSaved
}) => {
  const [ramLimit, setRamLimit] = useState(2);
  const [cpuLimit, setCpuLimit] = useState(2);
  const [autoStart, setAutoStart] = useState(false);
  const [autoStop, setAutoStop] = useState(false);
  const [sysInfo, setSysInfo] = useState({ totalMem: 8, cpus: 4 });
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  useEffect(() => {
    // Fetch System OS Info
    window.api.getSystemInfo().then((info: any) => {
      setSysInfo({
        totalMem: Math.max(2, Math.floor(info.totalMem / (1024 * 1024 * 1024))),
        cpus: info.cpus || 4
      });
    });

    // Fetch Meta
    window.api.getServerMeta(serverId).then((meta: any) => {
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
    await window.api.updateServerMeta(serverId, {
      ram: ramLimit,
      cpu: cpuLimit,
      autoStart,
      autoStop
    });
    // Also toggle the proxy listening state
    await window.api.toggleAutoStart(serverId, autoStart);
    
    handleSaveConfig();
    if (onConfigSaved) onConfigSaved();
    setIsSavingMeta(false);
  };

  const ConfigToggle = ({ label, propKey, invert = false }: any) => {
    const rawVal = props[propKey] === 'true';
    const isToggled = invert ? !rawVal : rawVal;
    
    return (
      <div className="bg-[#1e1e2e] border border-gray-800 flex justify-between items-center px-4 py-2 w-full h-12 shadow-sm rounded-md">
        <span className="font-bold text-sm text-gray-200">{label}</span>
        <button 
          onClick={() => setProps(prev => ({ ...prev, [propKey]: invert ? (isToggled ? 'true' : 'false') : (!isToggled ? 'true' : 'false') }))} 
          className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${isToggled ? 'bg-[#00ff40]' : 'bg-red-500'}`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform duration-200 ${isToggled ? 'translate-x-7' : 'translate-x-1'}`}></div>
        </button>
      </div>
    );
  };

  const ConfigSelect = ({ label, propKey, options }: any) => (
    <div className="bg-[#1e1e2e] border border-gray-800 flex justify-between items-center px-4 py-2 w-full h-12 shadow-sm rounded-md">
      <span className="font-bold text-sm text-gray-200">{label}</span>
      <select 
        value={props[propKey] || ''} 
        onChange={(e) => setProps(prev => ({ ...prev, [propKey]: e.target.value }))} 
        className="bg-[#111] text-white border border-gray-600 rounded px-2 py-1 outline-none text-sm font-semibold capitalize focus:border-[#00ff40]"
      >
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  const ConfigNumber = ({ label, propKey }: any) => (
    <div className="bg-[#1e1e2e] border border-gray-800 flex justify-between items-center px-4 py-2 w-full h-12 shadow-sm rounded-md">
      <span className="font-bold text-sm text-gray-200">{label}</span>
      <input 
        type="number" 
        value={props[propKey] || 0} 
        onChange={(e) => setProps(prev => ({ ...prev, [propKey]: e.target.value }))} 
        className="bg-[#111] text-white border border-gray-600 rounded px-2 py-1 w-20 text-right outline-none text-sm font-semibold focus:border-[#00ff40]" 
      />
    </div>
  );

  const ConfigString = ({ label, propKey, placeholder, isFullWidth = false }: any) => (
    <div className={`bg-[#1e1e2e] border border-gray-800 flex justify-between items-center px-4 py-2 w-full h-12 shadow-sm rounded-md ${isFullWidth ? 'col-span-1 md:col-span-2' : ''} gap-4`}>
      <span className="font-bold text-sm text-gray-200 whitespace-nowrap">{label}</span>
      <input 
        type="text" 
        value={props[propKey] || ''} 
        placeholder={placeholder} 
        onChange={(e) => setProps(prev => ({ ...prev, [propKey]: e.target.value }))} 
        className="bg-[#111] text-white border border-gray-600 rounded px-3 py-1 flex-1 outline-none text-sm font-semibold focus:border-[#00ff40] truncate" 
      />
    </div>
  );

  return (
    <div className="absolute inset-0 bg-[#151515] p-6 overflow-y-auto font-sans flex flex-col gap-6">
      
      {/* Header Controls */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#00ff40]">Options</h2>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setAdvancedMode(!advancedMode)} 
            className="text-sm font-semibold text-[#00ff40] hover:text-white underline transition-colors"
          >
            {advancedMode ? 'Switch to Visual UI' : 'Raw server.properties'}
          </button>
          <button 
            onClick={saveMetaAndConfig} 
            disabled={isSavingMeta}
            className="px-6 py-2 bg-[#00ff40] hover:bg-[#00cc33] text-black rounded-lg font-bold shadow-[0_0_15px_rgba(0,255,64,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSavingMeta ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {advancedMode ? (
        <div className="h-[65vh] bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden flex flex-col">
          <textarea 
            className="flex-1 w-full bg-[#111] text-[#00ff40] p-6 font-mono text-sm focus:outline-none resize-none" 
            value={rawConfigText} 
            onChange={(e) => setRawConfigText(e.target.value)} 
            spellCheck="false" 
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          
          {/* Resource Slider Section */}
          <div className="bg-[#1e1e2e] border border-gray-800 rounded-lg p-6 shadow-md flex flex-col items-center">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white">{ramLimit} GB RAM</h3>
              <p className="text-sm text-gray-400 font-semibold">{cpuLimit} shared CPU cores</p>
            </div>
            
            <div className="w-full max-w-4xl relative mb-8">
              <input 
                type="range" 
                min="1" 
                max={sysInfo.totalMem} 
                step="1"
                value={ramLimit} 
                onChange={(e) => setRamLimit(parseInt(e.target.value, 10))}
                className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00ff40]"
              />
              <div className="flex justify-between text-xs text-gray-500 font-bold mt-2 px-1">
                <span>1 GB</span>
                <span>{sysInfo.totalMem} GB (System Max)</span>
              </div>
            </div>

            <div className="w-full max-w-4xl relative">
              <div className="text-center mb-2">
                <span className="text-sm font-semibold text-gray-300">CPU Allocation Limit</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max={sysInfo.cpus} 
                step="1"
                value={cpuLimit} 
                onChange={(e) => setCpuLimit(parseInt(e.target.value, 10))}
                className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#00ff40]"
              />
              <div className="flex justify-between text-xs text-gray-500 font-bold mt-2 px-1">
                <span>1 Core</span>
                <span>{sysInfo.cpus} Cores (System Max)</span>
              </div>
            </div>
          </div>

          {/* Auto-Start / Auto-Stop Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1e1e2e] border border-gray-800 flex justify-between items-center px-4 py-3 shadow-sm rounded-md h-14">
              <span className="font-bold text-sm text-gray-200">Start when any player joins</span>
              <button 
                onClick={() => setAutoStart(!autoStart)} 
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${autoStart ? 'bg-[#00ff40]' : 'bg-red-500'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform duration-200 ${autoStart ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </button>
            </div>
            
            <div className="bg-[#1e1e2e] border border-gray-800 flex justify-between items-center px-4 py-3 shadow-sm rounded-md h-14">
              <span className="font-bold text-sm text-gray-200">Stop after 10 minutes without players</span>
              <button 
                onClick={() => setAutoStop(!autoStop)} 
                className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${autoStop ? 'bg-[#00ff40]' : 'bg-red-500'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-black rounded-full transition-transform duration-200 ${autoStop ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </button>
            </div>
          </div>

          {/* Server Properties Label */}
          <div className="flex items-center gap-2 mt-2 px-2">
            <Settings className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-bold text-gray-300">server.properties</h3>
          </div>

          {/* Properties Grid */}
          <div className="bg-[#151515] p-4 border border-[#333] rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <ConfigToggle label="Resource pack required" propKey="require-resource-pack" />
              <ConfigToggle label="Villagers" propKey="spawn-npcs" />
              <ConfigNumber label="Spawn Protection" propKey="spawn-protection" />
              <ConfigToggle label="Nether" propKey="allow-nether" />
              <ConfigString label="Resource pack" propKey="resource-pack" placeholder="https://example.com/pack.zip" isFullWidth={true} />
              <ConfigString label="Resource pack prompt" propKey="resource-pack-prompt" placeholder="Please accept this resource pack" isFullWidth={true} />
              <ConfigNumber label="Idle timeout" propKey="player-idle-timeout" />
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
});

OptionsTab.displayName = 'OptionsTab';

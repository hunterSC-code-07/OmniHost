import React, { useState, useEffect, useRef } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

// Custom Dropdown Component
const CustomSelect = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: {label: string, value: string}[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className={`w-full bg-[#121212] border ${isOpen ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 text-white outline-none cursor-pointer hover:border-red-500 transition-colors flex justify-between items-center`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{options.find(o => o.value === value)?.label || value}</span>
        <span className="material-symbols-outlined text-[20px] text-gray-400">{isOpen ? 'expand_less' : 'expand_more'}</span>
      </div>
      {isOpen && (
        <OverlayScrollbarsComponent 
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }}
          className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-red-500/30 rounded-lg z-50 shadow-2xl max-h-60"
        >
          {options.map(opt => (
            <div 
              key={opt.value}
              className={`p-3 cursor-pointer transition-colors ${value === opt.value ? 'bg-red-900/40 text-red-400 font-bold' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </OverlayScrollbarsComponent>
      )}
    </div>
  )
}

// Custom Number Input Component
const CustomNumberInput = ({ value, onChange, min, max }: { value: string, onChange: (val: string) => void, min?: number, max?: number }) => {
  return (
    <div className="flex bg-[#121212] border border-white/10 rounded-lg overflow-hidden focus-within:border-red-500 hover:border-white/20 transition-colors h-[48px]">
      <input 
        type="number"
        className="flex-1 bg-transparent px-3 text-white outline-none appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        style={{ MozAppearance: 'textfield' }}
      />
      <div className="flex flex-col border-l border-white/10 w-8 bg-[#1a1a1a]">
        <button 
          type="button"
          className="flex-1 flex items-center justify-center hover:bg-red-900/40 hover:text-red-400 text-gray-400 transition-colors"
          onClick={() => onChange(String(Math.min(max ?? Infinity, Number(value) + 1)))}
        >
          <span className="material-symbols-outlined text-[16px]">expand_less</span>
        </button>
        <button 
          type="button"
          className="flex-1 flex items-center justify-center hover:bg-red-900/40 hover:text-red-400 text-gray-400 transition-colors border-t border-white/10"
          onClick={() => onChange(String(Math.max(min ?? -Infinity, Number(value) - 1)))}
        >
          <span className="material-symbols-outlined text-[16px]">expand_more</span>
        </button>
      </div>
    </div>
  )
}

interface DayzOptionsTabProps {
  activeServerId: number;
}

export const DayzOptionsTab: React.FC<DayzOptionsTabProps> = ({ activeServerId }) => {
  const [configText, setConfigText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [hostname, setHostname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('60');
  const [serverTimeAcceleration, setServerTimeAcceleration] = useState('1');
  const [serverNightTimeAcceleration, setServerNightTimeAcceleration] = useState('1');
  const [template, setTemplate] = useState('dayzOffline.chernarusplus');
  const [availableMissions, setAvailableMissions] = useState<string[]>([
    'dayzOffline.chernarusplus',
    'dayzOffline.enoch'
  ]);

  useEffect(() => {
    loadConfig();
  }, [activeServerId]);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      // @ts-ignore
      const config = await window.api.readDayzConfig(activeServerId);
      if (config) {
        setConfigText(config);
        parseConfig(config);
      }
      
      // Load available missions from mpmissions directory
      try {
        const res = await window.api.listDir(activeServerId, 'mpmissions');
        if (res && res.length > 0) {
          const dirs = res.filter((entry: any) => entry.isDirectory).map((entry: any) => entry.name);
          if (dirs.length > 0) {
            setAvailableMissions(dirs);
          }
        }
      } catch (e) {
        console.warn("Failed to load mpmissions directory", e);
      }
    } catch (e) {
      console.error("Failed to load DayZ config", e);
    } finally {
      setIsLoading(false);
    }
  };

  const parseConfig = (text: string) => {
    const extractString = (key: string, defaultVal: string) => {
      const match = text.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, 'im'));
      return match ? match[1] : defaultVal;
    };
    const extractNumber = (key: string, defaultVal: string) => {
      const match = text.match(new RegExp(`^\\s*${key}\\s*=\\s*(\\d+)`, 'im'));
      return match ? match[1] : defaultVal;
    };

    setHostname(extractString('hostname', 'OmniHost DayZ Server'));
    setPassword(extractString('password', ''));
    setPasswordAdmin(extractString('passwordAdmin', ''));
    setMaxPlayers(extractNumber('maxPlayers', '60'));
    setServerTimeAcceleration(extractNumber('serverTimeAcceleration', '1'));
    setServerNightTimeAcceleration(extractNumber('serverNightTimeAcceleration', '1'));

    const templateMatch = text.match(/template\s*=\s*"([^"]*)"/i);
    if (templateMatch) {
      setTemplate(templateMatch[1]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let newConfig = configText;

      const replaceString = (key: string, val: string) => {
        const regex = new RegExp(`(^\\s*${key}\\s*=\\s*)"[^"]*"`, 'im');
        if (regex.test(newConfig)) {
          newConfig = newConfig.replace(regex, `$1"${val}"`);
        } else {
          newConfig = `${key}="${val}";\n` + newConfig;
        }
      };

      const replaceNumber = (key: string, val: string) => {
        const regex = new RegExp(`(^\\s*${key}\\s*=\\s*)\\d+`, 'im');
        if (regex.test(newConfig)) {
          newConfig = newConfig.replace(regex, `$1${val}`);
        } else {
          newConfig = `${key}=${val};\n` + newConfig;
        }
      };

      replaceString('hostname', hostname);
      replaceString('password', password);
      replaceString('passwordAdmin', passwordAdmin);
      replaceNumber('maxPlayers', maxPlayers);
      replaceNumber('serverTimeAcceleration', serverTimeAcceleration);
      replaceNumber('serverNightTimeAcceleration', serverNightTimeAcceleration);

      // Template replacement
      const templateRegex = /(template\s*=\s*)"[^"]*"/i;
      if (templateRegex.test(newConfig)) {
        newConfig = newConfig.replace(templateRegex, `$1"${template}"`);
      }

      // @ts-ignore
      await window.api.writeDayzConfig(activeServerId, newConfig);
      setConfigText(newConfig);
      alert('Settings saved successfully!');
    } catch (e) {
      console.error("Failed to save DayZ config", e);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading Configuration...</div>
      </div>
    );
  }

  // Ensure current template is always an option even if not found in mpmissions yet
  const templateOptions = availableMissions.includes(template) 
    ? availableMissions.map(m => ({ label: m, value: m }))
    : [{ label: `${template} (Current)`, value: template }, ...availableMissions.map(m => ({ label: m, value: m }))];

  return (
    <div className="flex-1 min-h-0 bg-black/20 backdrop-blur-sm flex flex-col">
      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 p-6">
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
        
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Server Properties</h3>
            <p className="text-sm text-gray-400">Configure your DayZ server settings. These changes apply on the next restart.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-red-900/80 border border-red-500/50 hover:bg-red-800 hover:border-red-400 hover:shadow-[0_0_15px_rgba(220,38,38,0.3)] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">sync</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save Changes
              </>
            )}
          </button>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Hostname */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-gray-300 mb-2">Server Name (Hostname)</label>
              <input 
                type="text" 
                value={hostname}
                onChange={e => setHostname(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-red-500 transition-colors"
                placeholder="OmniHost DayZ Server"
              />
            </div>

            {/* Passwords */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Server Password</label>
              <input 
                type="text" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-red-500 transition-colors"
                placeholder="Leave blank for public"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Admin Password</label>
              <input 
                type="text" 
                value={passwordAdmin}
                onChange={e => setPasswordAdmin(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-red-500 transition-colors"
                placeholder="Admin RCON password"
              />
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Max Players</label>
              <CustomNumberInput 
                value={maxPlayers}
                onChange={setMaxPlayers}
                min={1}
                max={127}
              />
            </div>

            {/* Map Template */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Map (Template)</label>
              <CustomSelect 
                value={template}
                onChange={setTemplate}
                options={templateOptions}
              />
              <p className="text-xs text-gray-500 mt-1">If using a custom map, enter its mission folder name here (e.g. regular.namalsk). Ensure the mission folder is copied into your server's mpmissions folder.</p>
            </div>

            {/* Time Acceleration */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Day Time Acceleration</label>
              <CustomNumberInput 
                value={serverTimeAcceleration}
                onChange={setServerTimeAcceleration}
                min={0}
                max={24}
              />
              <p className="text-xs text-gray-500 mt-1">Multiplier for daylight passing.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Night Time Acceleration</label>
              <CustomNumberInput 
                value={serverNightTimeAcceleration}
                onChange={setServerNightTimeAcceleration}
                min={0}
                max={24}
              />
              <p className="text-xs text-gray-500 mt-1">Multiplier for night time passing.</p>
            </div>

          </div>
        </div>

        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
};

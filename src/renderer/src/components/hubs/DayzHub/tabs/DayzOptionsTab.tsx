import React, { useState, useEffect } from 'react';

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

  return (
    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#050505]">
      <div className="max-w-3xl mx-auto space-y-8 pb-10">
        
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Server Properties</h3>
            <p className="text-sm text-gray-400">Configure your DayZ server settings. These changes apply on the next restart.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand hover:bg-green-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
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
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand transition-colors"
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
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand transition-colors"
                placeholder="Leave blank for public"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Admin Password</label>
              <input 
                type="text" 
                value={passwordAdmin}
                onChange={e => setPasswordAdmin(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand transition-colors"
                placeholder="Admin RCON password"
              />
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Max Players</label>
              <input 
                type="number" 
                value={maxPlayers}
                onChange={e => setMaxPlayers(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand transition-colors"
                min="1"
                max="127"
              />
            </div>

            {/* Map Template */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Map (Template)</label>
              <select
                value={template}
                onChange={e => setTemplate(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand transition-colors"
              >
                {/* Ensure current template is always an option even if not found in mpmissions yet */}
                {!availableMissions.includes(template) && (
                  <option value={template}>{template} (Current)</option>
                )}
                {availableMissions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">If using a custom map, enter its mission folder name here (e.g. regular.namalsk). Ensure the mission folder is copied into your server's mpmissions folder.</p>
            </div>

            {/* Time Acceleration */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Day Time Acceleration</label>
              <input 
                type="number" 
                value={serverTimeAcceleration}
                onChange={e => setServerTimeAcceleration(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand transition-colors"
                min="0"
                max="24"
              />
              <p className="text-xs text-gray-500 mt-1">Multiplier for daylight passing.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Night Time Acceleration</label>
              <input 
                type="number" 
                value={serverNightTimeAcceleration}
                onChange={e => setServerNightTimeAcceleration(e.target.value)}
                className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-brand transition-colors"
                min="0"
                max="24"
              />
              <p className="text-xs text-gray-500 mt-1">Multiplier for night time passing.</p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

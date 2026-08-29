import React, { useEffect, useState } from 'react';
import { useServerStore } from '../../../../store/useServerStore';

interface TerrariaConfig {
  maxplayers: string;
  port: string;
  password: string;
  motd: string;
  autocreate: string;
  difficulty: string;
  secure: string;
  upnp: string;
  language: string;
  // Preserved paths to ensure server boots
  world?: string;
  worldpath?: string;
  worldname?: string;
  banlist?: string;
  [key: string]: string | undefined; // For any other unknown config lines we want to preserve
}

const DEFAULT_CONFIG: TerrariaConfig = {
  maxplayers: '8',
  port: '7777',
  password: '',
  motd: 'Powered by OmniHost',
  autocreate: '2',
  difficulty: '0',
  secure: '1',
  upnp: '1',
  language: 'en-US'
};

export const TerrariaOptionsTab: React.FC = () => {
  const { activeServerId, servers } = useServerStore();
  const currentServer = servers.find(s => s.id === activeServerId);
  const [config, setConfig] = useState<TerrariaConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!currentServer) return;
    
    window.api.fs.readFile(currentServer.id, 'serverconfig.txt')
      .then(res => {
        if (res.success && res.content) {
          const parsed = parseConfig(res.content);
          setConfig(parsed);
        } else {
          setConfig({ ...DEFAULT_CONFIG });
        }
        setHasLoaded(true);
      });
  }, [currentServer?.id]);

  const parseConfig = (content: string): TerrariaConfig => {
    const lines = content.split('\n');
    const parsed: any = { ...DEFAULT_CONFIG };
    
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      
      const idx = line.indexOf('=');
      if (idx !== -1) {
        const key = line.substring(0, idx).trim();
        const value = line.substring(idx + 1).trim();
        parsed[key] = value;
      }
    }
    return parsed;
  };

  const serializeConfig = (conf: TerrariaConfig): string => {
    let result = '';
    for (const [key, val] of Object.entries(conf)) {
      if (val !== undefined && val !== null) {
        result += `${key}=${val}\n`;
      }
    }
    return result;
  };

  const handleSave = async () => {
    if (!currentServer) return;
    setIsSaving(true);
    
    const content = serializeConfig(config);
    await window.api.fs.writeFile(currentServer.id, 'serverconfig.txt', content);
    
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleChange = (key: keyof TerrariaConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (!currentServer || !hasLoaded) return null;

  return (
    <div className="flex flex-col h-full gap-6 max-w-5xl mx-auto w-full pb-20">
      <div className="flex justify-between items-center bg-black/40 p-6 rounded-xl border border-white/5 glass-panel">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400">tune</span>
            Server Configuration
          </h2>
          <p className="text-sm text-gray-400 mt-1">Configure your Terraria server settings. Requires restart to take effect.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-bold uppercase tracking-wider transition-all hover:scale-105 shadow-lg flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isSaving ? 'sync' : 'save'}
          </span>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gameplay & World */}
        <div className="glass-panel rounded-xl border border-white/5 bg-black/60 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">public</span>
            Gameplay & World
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Auto-create Size</label>
              <select 
                value={config.autocreate} 
                onChange={e => handleChange('autocreate', e.target.value)}
                disabled
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-gray-400 focus:border-green-500/50 outline-none transition-colors opacity-70 cursor-not-allowed"
              >
                <option value="1">Small</option>
                <option value="2">Medium</option>
                <option value="3">Large</option>
              </select>
              <p className="text-xs text-brand/80 mt-1">Permanently set during server creation.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
              <select 
                value={config.difficulty} 
                onChange={e => handleChange('difficulty', e.target.value)}
                disabled
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-gray-400 focus:border-green-500/50 outline-none transition-colors opacity-70 cursor-not-allowed"
              >
                <option value="0">Normal</option>
                <option value="1">Expert</option>
                <option value="2">Master</option>
                <option value="3">Journey</option>
              </select>
              <p className="text-xs text-brand/80 mt-1">Permanently set during server creation.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Max Players</label>
              <input 
                type="number"
                min="1"
                max="255"
                value={config.maxplayers} 
                onChange={e => handleChange('maxplayers', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-green-500/50 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Server & Access */}
        <div className="glass-panel rounded-xl border border-white/5 bg-black/60 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400">admin_panel_settings</span>
            Server & Access
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Server Password</label>
              <input 
                type="text"
                placeholder="Leave blank for no password"
                value={config.password} 
                onChange={e => handleChange('password', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-green-500/50 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Message of the Day (MOTD)</label>
              <input 
                type="text"
                value={config.motd} 
                onChange={e => handleChange('motd', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-green-500/50 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Language</label>
              <select 
                value={config.language} 
                onChange={e => handleChange('language', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-green-500/50 outline-none transition-colors"
              >
                <option value="en-US">English (US)</option>
                <option value="de-DE">German</option>
                <option value="it-IT">Italian</option>
                <option value="fr-FR">French</option>
                <option value="es-ES">Spanish</option>
                <option value="ru-RU">Russian</option>
                <option value="zh-Hans">Chinese (Simplified)</option>
                <option value="pt-BR">Portuguese (Brazil)</option>
                <option value="pl-PL">Polish</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Network Settings */}
        <div className="glass-panel rounded-xl border border-white/5 bg-black/60 p-6 space-y-6 md:col-span-2">
          <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-400">dns</span>
            Advanced Network
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Server Port</label>
              <input 
                type="number"
                value={config.port} 
                onChange={e => handleChange('port', e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-green-500/50 outline-none transition-colors"
              />
              <p className="text-xs text-orange-400/80 mt-1">Warning: Changing this may break FRP tunneling.</p>
            </div>

            <div className="flex flex-col gap-4 justify-end">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-12 h-6 rounded-full transition-colors relative ${config.secure === '1' ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${config.secure === '1' ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">Cheat Protection (Secure)</span>
                  <span className="text-xs text-gray-500">Adds additional cheat protection</span>
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={config.secure === '1'} 
                  onChange={(e) => handleChange('secure', e.target.checked ? '1' : '0')} 
                />
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-12 h-6 rounded-full transition-colors relative ${config.upnp === '1' ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${config.upnp === '1' ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">UPNP Port Forwarding</span>
                  <span className="text-xs text-gray-500">Automatically open ports on supported routers</span>
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={config.upnp === '1'} 
                  onChange={(e) => handleChange('upnp', e.target.checked ? '1' : '0')} 
                />
              </label>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

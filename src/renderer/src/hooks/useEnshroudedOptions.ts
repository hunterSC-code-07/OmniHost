import { useState, useEffect } from 'react';
import { useServerStore } from '../store/useServerStore';

export interface EnshroudedConfig {
  name: string;
  password?: string;
  saveDirectory: string;
  logDirectory: string;
  ip: string;
  gamePort: number;
  queryPort: number;
  slotCount: number;
  userGroups?: any[];
}

const DEFAULT_CONFIG: EnshroudedConfig = {
  name: "Enshrouded Server",
  password: "",
  saveDirectory: "./savegame",
  logDirectory: "./logs",
  ip: "0.0.0.0",
  gamePort: 15636,
  queryPort: 15637,
  slotCount: 16
};

export function useEnshroudedOptions() {
  const { activeServerId } = useServerStore();
  const [config, setConfig] = useState<EnshroudedConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, [activeServerId]);

  const loadConfig = async () => {
    if (!activeServerId) return;
    setLoading(true);
    try {
      // @ts-ignore
      const data = await window.api.fs.readFile(activeServerId, 'enshrouded_server.json');
      const parsed = JSON.parse(data);
      
      // Map password from userGroups for the UI
      if (parsed.userGroups && parsed.userGroups.length > 0) {
        parsed.password = parsed.userGroups[0].password || "";
      }
      
      setConfig(parsed);
    } catch (e) {
      console.error("Failed to load Enshrouded config (might not exist yet)", e);
      setConfig(DEFAULT_CONFIG);
    }
    setLoading(false);
  };

  const handleSave = async (newConfig: EnshroudedConfig) => {
    if (!activeServerId) return;
    try {
      const configToSave = { ...newConfig };
      
      // Enshrouded no longer uses the root 'password' field. It uses 'userGroups'.
      // We'll create a single Admin group with the provided password.
      configToSave.userGroups = [
        {
          name: "Admin",
          password: configToSave.password || "",
          canKickBan: true,
          canAccessInventories: true,
          canEditBase: true,
          canExtendBase: true,
          reservedSlots: 0
        }
      ];

      // Remove the root password property so it doesn't pollute the JSON
      delete configToSave.password;

      // @ts-ignore
      await window.api.fs.writeFile(activeServerId, 'enshrouded_server.json', JSON.stringify(configToSave, null, 2));
      
      // Restore password for local UI state
      configToSave.password = newConfig.password;
      setConfig(configToSave);
      alert('Configuration saved successfully!');
    } catch (e) {
      console.error("Failed to save Enshrouded config", e);
      alert('Failed to save configuration');
    }
  };

  return { config, loading, handleSave };
}

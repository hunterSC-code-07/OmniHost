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
      const serverPath = await window.api.system.getServerPath(activeServerId);
      // @ts-ignore
      const exists = await window.api.fs.exists(`${serverPath}/enshrouded_server.json`);
      if (exists) {
        // @ts-ignore
        const data = await window.api.fs.readFile(`${serverPath}/enshrouded_server.json`);
        setConfig(JSON.parse(data));
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } catch (e) {
      console.error("Failed to load Enshrouded config", e);
    }
    setLoading(false);
  };

  const handleSave = async (newConfig: EnshroudedConfig) => {
    if (!activeServerId) return;
    try {
      // @ts-ignore
      const serverPath = await window.api.system.getServerPath(activeServerId);
      // @ts-ignore
      await window.api.fs.writeFile(`${serverPath}/enshrouded_server.json`, JSON.stringify(newConfig, null, 2));
      setConfig(newConfig);
      alert('Configuration saved successfully!');
    } catch (e) {
      console.error("Failed to save Enshrouded config", e);
      alert('Failed to save configuration');
    }
  };

  return { config, loading, handleSave };
}

import { useState } from 'react';
import { useToastStore } from '../store/useToastStore';

export function useMinecraftConfig(activeServerId: number | null) {
  const [rawConfigText, setRawConfigText] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [props, setProps] = useState<Record<string, string>>({});
  const { showToast } = useToastStore();

  const loadConfig = async (id: number) => {
    // @ts-ignore
    const data = await window.api.readConfig(id);
    setRawConfigText(data);
    const parsed: Record<string, string> = {};
    data.split('\n').forEach((line: string) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...val] = line.split('=');
        if (key && val) parsed[key.trim()] = val.join('=').trim();
      }
    });
    setProps(parsed);
  };

  const handleSaveConfig = async () => {
    if (activeServerId !== null) {
      let finalData = rawConfigText;
      Object.keys(props).forEach(key => {
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(finalData)) {
          finalData = finalData.replace(regex, `${key}=${props[key]}`);
        } else {
          finalData += `\n${key}=${props[key]}`;
        }
      });
      // @ts-ignore
      await window.api.writeConfig(activeServerId, advancedMode ? rawConfigText : finalData);
      showToast("Settings saved! Restart server to apply.");
    }
  };

  return {
    rawConfigText, setRawConfigText,
    advancedMode, setAdvancedMode,
    props, setProps,
    loadConfig, handleSaveConfig
  };
}

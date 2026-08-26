import { useState, useEffect } from 'react';
import { useServerStore } from '../store/useServerStore';

export function useDayzOptions() {
  const { activeServerId } = useServerStore();
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
    if (!activeServerId) return;
    setIsLoading(true);
    try {
      const config = await (window.api as any).readDayzConfig(activeServerId);
      if (config) {
        setConfigText(config);
        parseConfig(config);
      }
      
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

      const templateRegex = /(template\s*=\s*)"[^"]*"/i;
      if (templateRegex.test(newConfig)) {
        newConfig = newConfig.replace(templateRegex, `$1"${template}"`);
      }

      await (window.api as any).writeDayzConfig(activeServerId, newConfig);
      setConfigText(newConfig);
      alert('Settings saved successfully!');
    } catch (e) {
      console.error("Failed to save DayZ config", e);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    hostname, setHostname,
    password, setPassword,
    passwordAdmin, setPasswordAdmin,
    maxPlayers, setMaxPlayers,
    serverTimeAcceleration, setServerTimeAcceleration,
    serverNightTimeAcceleration, setServerNightTimeAcceleration,
    template, setTemplate,
    availableMissions,
    handleSave
  };
}

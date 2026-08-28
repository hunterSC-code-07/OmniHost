import { useState, useEffect } from 'react';
import { useServerStore } from '../store/useServerStore';

export function useSevenDaysToDieOptions() {
  const { activeServerId } = useServerStore();
  const [configText, setConfigText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [serverName, setServerName] = useState('');
  const [serverDescription, setServerDescription] = useState('');
  const [serverPassword, setServerPassword] = useState('');
  const [serverMaxPlayerCount, setServerMaxPlayerCount] = useState('8');
  const [gameWorld, setGameWorld] = useState('Navezgane');
  const [worldGenSeed, setWorldGenSeed] = useState('asdf');
  const [gameDifficulty, setGameDifficulty] = useState('2');
  const [serverPort, setServerPort] = useState('26900');

  useEffect(() => {
    loadConfig();
  }, [activeServerId]);

  const loadConfig = async () => {
    if (!activeServerId) return;
    setIsLoading(true);
    try {
      const config = await window.api.fs.readFile(activeServerId, 'serverconfig.xml');
      if (config) {
        setConfigText(config);
        parseConfig(config);
      } else {
        console.warn("serverconfig.xml is empty or not found.");
      }
    } catch (e) {
      console.error("Failed to load 7 Days to Die config", e);
    } finally {
      setIsLoading(false);
    }
  };

  const parseConfig = (text: string) => {
    const extractString = (key: string, defaultVal: string) => {
      const match = text.match(new RegExp(`<property\\s+name="${key}"\\s+value="([^"]*)"`, 'i'));
      return match ? match[1] : defaultVal;
    };

    setServerName(extractString('ServerName', 'My Game Host'));
    setServerDescription(extractString('ServerDescription', 'A 7 Days to Die server'));
    setServerPassword(extractString('ServerPassword', ''));
    setServerMaxPlayerCount(extractString('ServerMaxPlayerCount', '8'));
    setGameWorld(extractString('GameWorld', 'Navezgane'));
    setWorldGenSeed(extractString('WorldGenSeed', 'asdf'));
    setGameDifficulty(extractString('GameDifficulty', '2'));
    setServerPort(extractString('ServerPort', '26900'));
  };

  const handleSave = async () => {
    if (!activeServerId) return;
    setIsSaving(true);
    try {
      let newConfig = configText;

      const replaceString = (key: string, val: string) => {
        const regex = new RegExp(`(<property\\s+name="${key}"\\s+value=")[^"]*(")`, 'i');
        if (regex.test(newConfig)) {
          newConfig = newConfig.replace(regex, `$1${val}$2`);
        } else {
          // If not found, we could append it, but 7DTD configs are structured in XML. 
          // For safety, we only replace existing properties.
          console.warn(`Property ${key} not found in serverconfig.xml, skipping replacement.`);
        }
      };

      replaceString('ServerName', serverName);
      replaceString('ServerDescription', serverDescription);
      replaceString('ServerPassword', serverPassword);
      replaceString('ServerMaxPlayerCount', serverMaxPlayerCount);
      replaceString('GameWorld', gameWorld);
      replaceString('WorldGenSeed', worldGenSeed);
      replaceString('GameDifficulty', gameDifficulty);
      replaceString('ServerPort', serverPort);

      await window.api.fs.writeFile(activeServerId, 'serverconfig.xml', newConfig);
      setConfigText(newConfig);
      alert('Settings saved successfully!');
    } catch (e) {
      console.error("Failed to save 7 Days to Die config", e);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    serverName, setServerName,
    serverDescription, setServerDescription,
    serverPassword, setServerPassword,
    serverMaxPlayerCount, setServerMaxPlayerCount,
    gameWorld, setGameWorld,
    worldGenSeed, setWorldGenSeed,
    gameDifficulty, setGameDifficulty,
    serverPort, setServerPort,
    handleSave
  };
}

import { useState, useEffect } from 'react';

const credentialsPath = 'Profiles/VPPAdminTools/Permissions/credentials.txt';

export const useDayzVppCredentials = (activeServerId: number | null) => {
  const [credentials, setCredentials] = useState<string>('');
  const [newCredential, setNewCredential] = useState('');

  const loadCredentials = async () => {
    if (!activeServerId) return;
    try {
      const credsContent = await window.api.fs.readFile(activeServerId, credentialsPath);
      const firstLine = credsContent.split('\n')[0].trim();
      setCredentials(firstLine);
    } catch (e) {
      console.error('Failed to load credentials', e);
      setCredentials('');
    }
  };

  useEffect(() => {
    loadCredentials();
  }, [activeServerId]);

  const handleSetCredential = async () => {
    if (!newCredential || !activeServerId) return;
    const oldCredentials = credentials;
    setCredentials(newCredential);
    setNewCredential('');
    try {
      await window.api.fs.createFolder(activeServerId, 'Profiles/VPPAdminTools/Permissions').catch(() => {});
      const content = `${newCredential}\n//**In case of lost password**, delete the content of THIS file you are reading, write a new password (32 Characters Maximum) on the very FIRST line, save file, restart DayZ Server.`;
      await window.api.fs.writeFile(activeServerId, credentialsPath, content);
    } catch (e) {
      console.error('Failed to save credentials', e);
      setCredentials(oldCredentials);
    }
  };

  const handleClearCredential = async () => {
    if (!activeServerId) return;
    const oldCredentials = credentials;
    setCredentials('');
    try {
      const content = `\n//**In case of lost password**, delete the content of THIS file you are reading, write a new password (32 Characters Maximum) on the very FIRST line, save file, restart DayZ Server.`;
      await window.api.fs.writeFile(activeServerId, credentialsPath, content);
    } catch (e) {
      console.error('Failed to clear credentials', e);
      setCredentials(oldCredentials);
    }
  };

  return {
    credentials,
    newCredential,
    setNewCredential,
    handleSetCredential,
    handleClearCredential,
    loadCredentials
  };
};

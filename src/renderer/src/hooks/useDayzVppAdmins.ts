import { useState, useEffect } from 'react';

const superAdminsPath = 'Profiles/VPPAdminTools/Permissions/SuperAdmins/SuperAdmins.txt';

export const useDayzVppAdmins = (activeServerId: number | null) => {
  const [superAdmins, setSuperAdmins] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState('');

  const loadAdmins = async () => {
    if (!activeServerId) return;
    try {
      const adminsContent = await window.api.fs.readFile(activeServerId, superAdminsPath);
      const admins = adminsContent.split('\n').map((l: string) => l.trim()).filter(Boolean);
      setSuperAdmins(admins);
    } catch (e) {
      console.error('Failed to load SuperAdmins', e);
      setSuperAdmins([]);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, [activeServerId]);

  const handleAddAdmin = async () => {
    if (!newAdmin || !activeServerId) return;
    const updated = [...superAdmins, newAdmin];
    setSuperAdmins(updated);
    setNewAdmin('');
    try {
      await window.api.fs.createFolder(activeServerId, 'Profiles/VPPAdminTools/Permissions/SuperAdmins').catch(() => {});
      await window.api.fs.writeFile(activeServerId, superAdminsPath, updated.join('\n') + '\n');
    } catch (e) {
      console.error('Failed to save SuperAdmins', e);
      // Revert on failure
      setSuperAdmins(superAdmins);
    }
  };

  const handleRemoveAdmin = async (admin: string) => {
    if (!activeServerId) return;
    const updated = superAdmins.filter(a => a !== admin);
    setSuperAdmins(updated);
    try {
      await window.api.fs.writeFile(activeServerId, superAdminsPath, updated.join('\n') + '\n');
    } catch (e) {
      console.error('Failed to save SuperAdmins', e);
      // Revert on failure
      setSuperAdmins(superAdmins);
    }
  };

  return {
    superAdmins,
    newAdmin,
    setNewAdmin,
    handleAddAdmin,
    handleRemoveAdmin,
    loadAdmins
  };
};

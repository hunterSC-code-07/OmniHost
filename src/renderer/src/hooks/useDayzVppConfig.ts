import { useState, useEffect } from 'react';

export const useDayzVppConfig = (activeServerId: number | null) => {
  const [disablePassword, setDisablePassword] = useState(false);

  const loadConfig = async () => {
    if (!activeServerId) return;
    try {
      const serverCfgContent = await window.api.dayz.readConfig(activeServerId);
      if (serverCfgContent) {
        setDisablePassword(serverCfgContent.includes('vppDisablePassword = 1;'));
      }
    } catch (e) {
      console.error('Failed to load serverDZ.cfg', e);
    }
  };

  useEffect(() => {
    loadConfig();
  }, [activeServerId]);

  const handleToggleDisablePassword = async () => {
    if (!activeServerId) return;
    const newStatus = !disablePassword;
    setDisablePassword(newStatus);
    
    try {
      const serverCfgContent = await window.api.dayz.readConfig(activeServerId);
      if (!serverCfgContent) throw new Error('Config not found');
      
      let updatedCfg = '';
      
      if (newStatus) {
        if (!serverCfgContent.includes('vppDisablePassword')) {
          updatedCfg = serverCfgContent + '\nvppDisablePassword = 1;\n';
        } else {
          updatedCfg = serverCfgContent.replace(/vppDisablePassword\s*=\s*[0-9]+;?/g, 'vppDisablePassword = 1;');
        }
      } else {
        updatedCfg = serverCfgContent.replace(/vppDisablePassword\s*=\s*[0-9]+;?/g, '');
      }
      
      await window.api.dayz.writeConfig(activeServerId, updatedCfg.replace(/\n\n+/g, '\n'));
    } catch(e: any) {
       console.error('Failed to toggle vppDisablePassword', e);
       const errorMsg = e?.message || String(e);
       if (errorMsg.includes('EBUSY')) {
         alert('Error: The server is currently running and has locked the configuration file. Please shut down your DayZ server before changing this setting.');
       } else {
         alert('Failed to save setting: ' + errorMsg);
       }
       setDisablePassword(!newStatus); // revert
    }
  };

  return {
    disablePassword,
    handleToggleDisablePassword,
    loadConfig
  };
};

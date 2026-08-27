import React, { useMemo, useState, useEffect } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useDayzInstalledMods } from '../../../../hooks/useDayzInstalledMods';
import { useServerStore } from '../../../../store/useServerStore';

export const DayzVppAdminTab: React.FC = () => {
  const { mods, loading } = useDayzInstalledMods();
  const { activeServerId } = useServerStore();
  const [showPassword, setShowPassword] = useState(false);

  const [superAdmins, setSuperAdmins] = useState<string[]>([]);
  const [credentials, setCredentials] = useState<string>('');
  const [disablePassword, setDisablePassword] = useState(false);
  
  const [newAdmin, setNewAdmin] = useState('');
  const [newCredential, setNewCredential] = useState('');

  const superAdminsPath = 'Profiles/VPPAdminTools/Permissions/SuperAdmins/SuperAdmins.txt';
  const credentialsPath = 'Profiles/VPPAdminTools/Permissions/credentials.txt';

  const loadVppData = async () => {
    if (!activeServerId) return;
    try {
      const adminsContent = await window.api.fs.readFile(activeServerId, superAdminsPath);
      const admins = adminsContent.split('\n').map((l: string) => l.trim()).filter(Boolean);
      setSuperAdmins(admins);
    } catch (e) {
      console.error('Failed to load SuperAdmins', e);
      setSuperAdmins([]);
    }

    try {
      const credsContent = await window.api.fs.readFile(activeServerId, credentialsPath);
      const firstLine = credsContent.split('\n')[0].trim();
      setCredentials(firstLine);
    } catch (e) {
      console.error('Failed to load credentials', e);
      setCredentials('');
    }

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
    loadVppData();
  }, [activeServerId]);

  const handleAddAdmin = async () => {
    if (!newAdmin) return;
    const updated = [...superAdmins, newAdmin];
    setSuperAdmins(updated);
    setNewAdmin('');
    try {
      await window.api.fs.createFolder(activeServerId, 'Profiles/VPPAdminTools/Permissions/SuperAdmins').catch(() => {});
      await window.api.fs.writeFile(activeServerId, superAdminsPath, updated.join('\n') + '\n');
    } catch (e) {
      console.error('Failed to save SuperAdmins', e);
    }
  };

  const handleRemoveAdmin = async (admin: string) => {
    const updated = superAdmins.filter(a => a !== admin);
    setSuperAdmins(updated);
    try {
      await window.api.fs.writeFile(activeServerId, superAdminsPath, updated.join('\n') + '\n');
    } catch (e) {
      console.error('Failed to save SuperAdmins', e);
    }
  };

  const handleSetCredential = async () => {
    if (!newCredential) return;
    setCredentials(newCredential);
    setNewCredential('');
    try {
      await window.api.fs.createFolder(activeServerId, 'Profiles/VPPAdminTools/Permissions').catch(() => {});
      const content = `${newCredential}\n//**In case of lost password**, delete the content of THIS file you are reading, write a new password (32 Characters Maximum) on the very FIRST line, save file, restart DayZ Server.`;
      await window.api.fs.writeFile(activeServerId, credentialsPath, content);
    } catch (e) {
      console.error('Failed to save credentials', e);
    }
  };

  const handleClearCredential = async () => {
    setCredentials('');
    try {
      const content = `\n//**In case of lost password**, delete the content of THIS file you are reading, write a new password (32 Characters Maximum) on the very FIRST line, save file, restart DayZ Server.`;
      await window.api.fs.writeFile(activeServerId, credentialsPath, content);
    } catch (e) {
      console.error('Failed to save credentials', e);
    }
  };

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

  // Check if VPPAdminTools is installed and enabled
  const vppAdminMod = useMemo(() => {
    return mods.find(
      (m) =>
        m.id === '1820430124' ||
        m.folderName?.toLowerCase() === '@vppadmintools' ||
        m.title?.toLowerCase().includes('vppadmintools')
    );
  }, [mods]);

  const isVppInstalledAndEnabled = !!vppAdminMod && !vppAdminMod.isDisabled;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!isVppInstalledAndEnabled) {
    return (
      <div className="flex flex-col h-full bg-transparent font-body text-white">
        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
          <span className="material-symbols-outlined text-[64px] opacity-50 mb-4 text-red-500/50">
            admin_panel_settings
          </span>
          <p className="font-bold text-xl text-white">VPP Admin Tools Mod Required</p>
          <p className="text-sm opacity-70 mt-2 max-w-md">
            This tab requires the <strong>VPPAdminTools</strong> mod to be installed and enabled. 
            Please install it from the Workshop or enable it in the Installed Mods tab to access these settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent font-body text-white">
      <div className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between shadow-sm shrink-0">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500">admin_panel_settings</span>
          VPP Admin Tools Settings
        </h2>
      </div>

      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/5 shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
               <span className="material-symbols-outlined text-red-400">shield_person</span>
               <h3 className="font-bold">Super Admins</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-4">Manage the list of Steam64 IDs with SuperAdmin privileges.</p>
              
              <div className="bg-surface-container-highest border border-white/10 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center p-3 border-b border-white/5 bg-black/20">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Steam64 ID</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</span>
                </div>
                
                {/* Placeholder List Item */}
                {superAdmins.map((admin, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <div className="font-mono text-sm">{admin}</div>
                    <button 
                      onClick={() => handleRemoveAdmin(admin)}
                      className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
                
                <div className="p-3 bg-black/20">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter Steam64 ID..." 
                      value={newAdmin}
                      onChange={(e) => setNewAdmin(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAdmin()}
                      className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:border-red-500/50 transition-colors font-mono" 
                    />
                    <button 
                      onClick={handleAddAdmin}
                      className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-4 py-1.5 rounded text-sm font-bold transition-colors"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/5 shadow-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
               <span className="material-symbols-outlined text-red-400">password</span>
               <h3 className="font-bold">Credentials</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-400 mb-4">Manage server login passwords for VPP Admin Tools.</p>
              
              <div className="bg-surface-container-highest border border-white/10 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center p-3 border-b border-white/5 bg-black/20">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</span>
                </div>
                
                {/* Placeholder List Item */}
                {credentials && (
                  <div className="flex justify-between items-center p-3 border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <div className="font-mono text-sm tracking-widest flex items-center gap-3">
                      {showPassword ? credentials : '••••••••'}
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-white transition-colors flex items-center justify-center"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                    <button 
                      onClick={handleClearCredential}
                      className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                )}
                
                <div className="p-3 bg-black/20">
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      placeholder="Enter new password..." 
                      value={newCredential}
                      onChange={(e) => setNewCredential(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSetCredential()}
                      className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm outline-none focus:border-red-500/50 transition-colors" 
                    />
                    <button 
                      onClick={handleSetCredential}
                      className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 px-4 py-1.5 rounded text-sm font-bold transition-colors"
                    >
                      {credentials ? 'UPDATE' : 'ADD'}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between bg-black/20 p-4 rounded-lg border border-white/5">
                <div>
                  <h4 className="font-bold text-sm">Bypass Password</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Disable the password requirement completely. Only players listed as Super Admins will be able to access the tools.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold ${!disablePassword ? 'text-gray-400' : 'text-primary'}`}>
                    {!disablePassword ? 'OFF' : 'ON'}
                  </span>
                  <div
                    onClick={handleToggleDisablePassword}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors ${!disablePassword ? 'bg-surface-container-highest' : 'bg-primary'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${!disablePassword ? 'translate-x-0' : 'translate-x-5'}`} />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
};

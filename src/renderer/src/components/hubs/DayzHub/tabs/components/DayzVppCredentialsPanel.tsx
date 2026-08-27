import React, { useState } from 'react';
import { useDayzVppCredentials } from '../../../../../hooks/useDayzVppCredentials';
import { useDayzVppConfig } from '../../../../../hooks/useDayzVppConfig';

interface DayzVppCredentialsPanelProps {
  activeServerId: number | null;
}

export const DayzVppCredentialsPanel: React.FC<DayzVppCredentialsPanelProps> = ({ activeServerId }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { credentials, newCredential, setNewCredential, handleSetCredential, handleClearCredential } = useDayzVppCredentials(activeServerId);
  const { disablePassword, handleToggleDisablePassword } = useDayzVppConfig(activeServerId);

  return (
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
  );
};

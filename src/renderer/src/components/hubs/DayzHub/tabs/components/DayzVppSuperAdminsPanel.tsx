import React from 'react';
import { useDayzVppAdmins } from '../../../../../hooks/useDayzVppAdmins';

interface DayzVppSuperAdminsPanelProps {
  activeServerId: number | null;
}

export const DayzVppSuperAdminsPanel: React.FC<DayzVppSuperAdminsPanelProps> = ({ activeServerId }) => {
  const { superAdmins, newAdmin, setNewAdmin, handleAddAdmin, handleRemoveAdmin } = useDayzVppAdmins(activeServerId);

  return (
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
  );
};

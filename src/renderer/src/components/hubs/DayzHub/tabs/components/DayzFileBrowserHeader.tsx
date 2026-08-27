import React from 'react';
import { useDayzFileStore } from '../../../../../store/useDayzFileStore';
import { useDayzFileNavigation } from '../../../../../hooks/useDayzFileNavigation';
import { useDayzFileOperations } from '../../../../../hooks/useDayzFileOperations';

export const DayzFileBrowserHeader: React.FC = () => {
  const { currentPath, newFolderName, setNewFolderName } = useDayzFileStore();
  const { fetchDir, handleNavigateUp } = useDayzFileNavigation();
  const { handleCreateFolder } = useDayzFileOperations(fetchDir);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold font-display text-white drop-shadow-md">File Manager</h2>
        </div>
        
        <div className="flex gap-2">
          {newFolderName !== null ? (
            <form onSubmit={handleCreateFolder} className="flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Folder Name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-red-500/50 outline-none backdrop-blur-sm"
              />
              <button type="submit" className="text-sm bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-500/30 hover:border-red-400 font-bold px-4 py-2 rounded-lg transition-colors">Create</button>
              <button type="button" onClick={() => setNewFolderName(null)} className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-4 py-2 rounded-lg transition-colors font-bold">Cancel</button>
            </form>
          ) : (
            <button 
              onClick={() => setNewFolderName('')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-900/20 hover:bg-red-900/30 transition border border-red-500/20 hover:border-red-500/40 text-sm font-bold text-red-300"
            >
              <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
              New Folder
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-black/40 backdrop-blur-md rounded-t-xl border border-b-0 border-white/5">
        <button 
          onClick={handleNavigateUp}
          disabled={!currentPath}
          className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50 transition text-gray-400 hover:text-white"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
        <span className="text-sm font-mono text-gray-300 flex items-center">
          <span className="opacity-50 mr-2">Root</span> {currentPath ? `/ ${currentPath}` : ''}
        </span>
      </div>
    </>
  );
};

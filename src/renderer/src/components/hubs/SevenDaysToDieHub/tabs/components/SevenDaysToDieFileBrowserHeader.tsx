import React from 'react';
import { useDayzFileStore } from '../../../../../store/useDayzFileStore';
import { useDayzFileNavigation } from '../../../../../hooks/useDayzFileNavigation';
import { useDayzFileOperations } from '../../../../../hooks/useDayzFileOperations';

export const SevenDaysToDieFileBrowserHeader: React.FC = () => {
  const { currentPath, newFolderName, setNewFolderName } = useDayzFileStore();
  const { fetchDir, handleNavigateUp } = useDayzFileNavigation();
  const { handleCreateFolder } = useDayzFileOperations(fetchDir);

  return (
    <div className="flex justify-between items-end pb-2 border-b border-[var(--7dtd-border)] mb-4">
      <h3 className="sevendays-title text-3xl">FILE MANAGER</h3>
      
      <div className="flex gap-6 items-center">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleNavigateUp}
            disabled={!currentPath}
            className="p-1 border border-transparent hover:border-white disabled:opacity-50 transition text-[var(--7dtd-text-dim)] hover:text-white flex items-center justify-center"
            title="Go Up"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
          <span className="sevendays-title text-lg text-white flex items-center">
            <span className="text-[var(--7dtd-text-dim)] mr-2">ROOT</span> {currentPath ? `/ ${currentPath}` : ''}
          </span>
        </div>

        {/* New Folder Form/Button */}
        <div className="flex gap-4">
          {newFolderName !== null ? (
            <form onSubmit={handleCreateFolder} className="flex gap-4">
              <div className="sevendays-input-container">
                <input
                  autoFocus
                  type="text"
                  placeholder="FOLDER NAME"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="sevendays-input px-4 py-2 uppercase min-w-[200px]"
                />
              </div>
              <button type="submit" className="sevendays-btn sevendays-btn-danger">CREATE</button>
              <button type="button" onClick={() => setNewFolderName(null)} className="sevendays-btn">CANCEL</button>
            </form>
          ) : (
            <button 
              onClick={() => setNewFolderName('')}
              className="sevendays-btn flex items-center justify-center gap-2 py-2"
            >
              <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
              NEW FOLDER
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

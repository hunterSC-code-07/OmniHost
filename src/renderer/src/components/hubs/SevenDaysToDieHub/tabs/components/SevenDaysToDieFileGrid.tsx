import React from 'react';
import { useDayzFileStore } from '../../../../../store/useDayzFileStore';
import { useDayzFileNavigation } from '../../../../../hooks/useDayzFileNavigation';
import { useDayzFileOperations } from '../../../../../hooks/useDayzFileOperations';
import { useDayzFileEditor } from '../../../../../hooks/useDayzFileEditor';
import { formatSize } from '../../../../../utils/formatSize';

export const SevenDaysToDieFileGrid: React.FC = () => {
  const { files, loading } = useDayzFileStore();
  const { fetchDir, handleNavigate } = useDayzFileNavigation();
  const { handleDelete } = useDayzFileOperations(fetchDir);
  const { handleFileClick } = useDayzFileEditor(handleNavigate);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex bg-[var(--7dtd-bg-panel-dark)] border border-[var(--7dtd-border)] border-b-0">
        <div className="p-4 text-sm sevendays-title text-[var(--7dtd-text-dim)] flex-1">NAME</div>
        <div className="p-4 text-sm sevendays-title text-[var(--7dtd-text-dim)] w-32 shrink-0">SIZE</div>
        <div className="p-4 text-sm sevendays-title text-[var(--7dtd-text-dim)] w-48 shrink-0">DATE MODIFIED</div>
        <div className="p-4 text-sm sevendays-title text-[var(--7dtd-text-dim)] w-24 shrink-0 text-right">ACTIONS</div>
      </div>

      <div className="flex-1 relative bg-[var(--7dtd-bg-panel-dark)] border border-[var(--7dtd-border)] min-h-0 overflow-hidden">
        <div className="absolute inset-0 overflow-auto">
          <div className="flex flex-col">
            {loading ? (
              <div className="p-8 text-center text-white/50 animate-pulse sevendays-title">LOADING FILES...</div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-white/50 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">folder_open</span>
                <p className="sevendays-title">FOLDER IS EMPTY</p>
              </div>
            ) : (
              files.map(file => (
                <div 
                  key={file.name} 
                  className="flex items-center hover:bg-white/5 cursor-pointer border-t border-[var(--7dtd-border)] transition-colors group"
                  onClick={() => handleFileClick(file)}
                >
                  <div className="p-4 flex flex-1 items-center gap-3 overflow-hidden min-w-0">
                    <span className={`material-symbols-outlined shrink-0 ${file.isDirectory ? 'text-[var(--7dtd-text-dim)]' : 'text-[var(--7dtd-text-dim)]'}`}>
                      {file.isDirectory ? 'folder' : 'draft'}
                    </span>
                    <span className="text-sm font-bold truncate text-white uppercase">{file.name}</span>
                  </div>
                  <div className="p-4 text-sm text-[var(--7dtd-text-dim)] font-bold uppercase w-32 shrink-0">
                    {file.isDirectory ? '--' : formatSize(file.size)}
                  </div>
                  <div className="p-4 text-sm text-[var(--7dtd-text-dim)] font-bold uppercase w-48 shrink-0">
                    {new Date(file.mtime).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className="p-4 text-right w-24 shrink-0">
                    <button 
                      onClick={(e) => handleDelete(e, file)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 border border-transparent hover:border-[#ff4f4f] bg-transparent text-[#ff4f4f] transition-all"
                      title="DELETE"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

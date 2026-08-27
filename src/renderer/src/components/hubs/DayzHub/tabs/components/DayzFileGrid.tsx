import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useDayzFileStore } from '../../../../../store/useDayzFileStore';
import { useDayzFileNavigation } from '../../../../../hooks/useDayzFileNavigation';
import { useDayzFileOperations } from '../../../../../hooks/useDayzFileOperations';
import { useDayzFileEditor } from '../../../../../hooks/useDayzFileEditor';
import { formatSize } from '../../../../../utils/formatSize';

export const DayzFileGrid: React.FC = () => {
  const { files, loading } = useDayzFileStore();
  const { fetchDir, handleNavigate } = useDayzFileNavigation();
  const { handleDelete } = useDayzFileOperations(fetchDir);
  const { handleFileClick } = useDayzFileEditor(handleNavigate);

  return (
    <>
      <div className="bg-black/60 backdrop-blur-xl border-x border-white/5 border-b border-b-white/10 flex">
        <div className="p-4 text-sm font-bold text-gray-400 font-display flex-1">Name</div>
        <div className="p-4 text-sm font-bold text-gray-400 font-display w-32 shrink-0">Size</div>
        <div className="p-4 text-sm font-bold text-gray-400 font-display w-48 shrink-0">Date Modified</div>
        <div className="p-4 text-sm font-bold text-gray-400 font-display w-24 shrink-0 text-right">Actions</div>
      </div>

      <OverlayScrollbarsComponent options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} className="flex-1 bg-black/20 backdrop-blur-md border border-white/5 border-t-0 rounded-b-xl overflow-hidden custom-scrollbar">
        <div className="flex flex-col">
            {loading ? (
              <div className="p-8 text-center text-red-500 animate-pulse font-bold">Loading files...</div>
            ) : files.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">folder_open</span>
                <p>Folder is empty</p>
              </div>
            ) : (
              files.map(file => (
                <div 
                  key={file.name} 
                  className="flex items-center hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors group"
                  onClick={() => handleFileClick(file)}
                >
                  <div className="p-4 flex flex-1 items-center gap-3 overflow-hidden min-w-0">
                    <span className={`material-symbols-outlined shrink-0 ${file.isDirectory ? 'text-red-400' : 'text-gray-400'}`}>
                      {file.isDirectory ? 'folder' : 'draft'}
                    </span>
                    <span className="text-sm font-mono truncate text-gray-200 group-hover:text-white">{file.name}</span>
                  </div>
                  <div className="p-4 text-sm text-gray-400 font-mono w-32 shrink-0">
                    {file.isDirectory ? '--' : formatSize(file.size)}
                  </div>
                  <div className="p-4 text-sm text-gray-500 font-mono text-[13px] w-48 shrink-0">
                    {new Date(file.mtime).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                  <div className="p-4 text-right w-24 shrink-0">
                    <button 
                      onClick={(e) => handleDelete(e, file)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-500 hover:text-white border border-transparent hover:border-red-400 transition-all"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
        </div>
      </OverlayScrollbarsComponent>
    </>
  );
};

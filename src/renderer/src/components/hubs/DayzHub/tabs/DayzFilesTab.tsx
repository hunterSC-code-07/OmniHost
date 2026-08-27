import React from 'react'
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react'

import { useDayzFiles } from '../../../../hooks/useDayzFiles'

export const DayzFilesTab: React.FC = () => {
  const {
    currentPath,
    files,
    loading,
    editingFile,
    setEditingFile,
    newFolderName,
    setNewFolderName,
    handleNavigateUp,
    handleFileClick,
    handleDelete,
    handleSaveFile,
    handleCreateFolder,
    formatSize
  } = useDayzFiles()

  return (
    <div className="flex-1 flex flex-col p-6 h-full text-white relative bg-transparent font-body">
      {/* Editor Modal */}
      {editingFile && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold font-display text-white">{editingFile.path}</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setEditingFile(null)}
                className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 font-bold text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFile}
                className="px-6 py-2 rounded-lg bg-red-900/30 text-red-400 border border-red-500/30 hover:bg-red-900/50 hover:border-red-400 font-bold transition-colors shadow-[0_0_15px_rgba(220,38,38,0.15)]"
              >
                Save Changes
              </button>
            </div>
          </div>
          <textarea
            value={editingFile.content}
            onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
            className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:border-red-500/50 text-gray-300 shadow-inner custom-scrollbar"
            spellCheck="false"
          />
        </div>
      )}

      {/* Main File Browser */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold font-display text-white drop-shadow-md">
            File Manager
          </h2>
        </div>

        <div className="flex gap-2">
          {newFolderName !== null ? (
            <form onSubmit={handleCreateFolder} className="flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Folder Name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-red-500/50 outline-none backdrop-blur-sm"
              />
              <button
                type="submit"
                className="text-sm bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-500/30 hover:border-red-400 font-bold px-4 py-2 rounded-lg transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setNewFolderName(null)}
                className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-4 py-2 rounded-lg transition-colors font-bold"
              >
                Cancel
              </button>
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

      <div className="bg-black/60 backdrop-blur-xl border-x border-white/5 border-b border-b-white/10 flex">
        <div className="p-4 text-sm font-bold text-gray-400 font-display flex-1">Name</div>
        <div className="p-4 text-sm font-bold text-gray-400 font-display w-32 shrink-0">Size</div>
        <div className="p-4 text-sm font-bold text-gray-400 font-display w-48 shrink-0">
          Date Modified
        </div>
        <div className="p-4 text-sm font-bold text-gray-400 font-display w-24 shrink-0 text-right">
          Actions
        </div>
      </div>

      <OverlayScrollbarsComponent
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }}
        className="flex-1 bg-black/20 backdrop-blur-md border border-white/5 border-t-0 rounded-b-xl overflow-hidden custom-scrollbar"
      >
        <div className="flex flex-col">
          {loading ? (
            <div className="p-8 text-center text-red-500 animate-pulse font-bold">
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                folder_open
              </span>
              <p>Folder is empty</p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.name}
                className="flex items-center hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors group"
                onClick={() => handleFileClick(file)}
              >
                <div className="p-4 flex flex-1 items-center gap-3 overflow-hidden min-w-0">
                  <span
                    className={`material-symbols-outlined shrink-0 ${file.isDirectory ? 'text-red-400' : 'text-gray-400'}`}
                  >
                    {file.isDirectory ? 'folder' : 'draft'}
                  </span>
                  <span className="text-sm font-mono truncate text-gray-200 group-hover:text-white">
                    {file.name}
                  </span>
                </div>
                <div className="p-4 text-sm text-gray-400 font-mono w-32 shrink-0">
                  {file.isDirectory ? '--' : formatSize(file.size)}
                </div>
                <div className="p-4 text-sm text-gray-500 font-mono text-[13px] w-48 shrink-0">
                  {new Date(file.mtime).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
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
    </div>
  )
}

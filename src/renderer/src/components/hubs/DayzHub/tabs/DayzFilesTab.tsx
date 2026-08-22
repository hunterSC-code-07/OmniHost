import React, { useState, useEffect } from 'react';

interface DayzFilesTabProps {
  activeServerId: number;
}

interface FileEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: string;
}

export const DayzFilesTab: React.FC<DayzFilesTabProps> = ({ activeServerId }) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingFile, setEditingFile] = useState<{ path: string, content: string } | null>(null);
  const [newFolderName, setNewFolderName] = useState<string | null>(null);

  const fetchDir = async (path: string) => {
    setLoading(true);
    try {
      const res = await window.api.listDir(activeServerId, path);
      setFiles(res);
      setCurrentPath(path);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDir('');
  }, [activeServerId]);

  const handleNavigate = (path: string) => {
    fetchDir(path);
  };

  const handleNavigateUp = () => {
    const parts = currentPath.split(/\\|\//).filter(Boolean);
    parts.pop();
    fetchDir(parts.join('/'));
  };

  const handleFileClick = async (file: FileEntry) => {
    const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
    if (file.isDirectory) {
      handleNavigate(fullPath);
    } else {
      // Basic check to see if it's a text editable file
      const editableExts = ['.txt', '.json', '.cfg', '.xml', '.yaml', '.yml', '.log'];
      const isEditable = editableExts.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (isEditable || file.size < 1024 * 1024) { // allow small files to be opened
        try {
          const content = await window.api.readFile(activeServerId, fullPath);
          setEditingFile({ path: fullPath, content });
        } catch (e) {
          alert('Could not read file');
        }
      } else {
        alert('File type not supported for editing or too large.');
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, file: FileEntry) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    
    const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
    try {
      await window.api.deleteItem(activeServerId, fullPath);
      fetchDir(currentPath);
    } catch (e) {
      alert('Failed to delete item');
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    try {
      await window.api.writeFile(activeServerId, editingFile.path, editingFile.content);
      alert('File saved successfully!');
      setEditingFile(null);
    } catch (e) {
      alert('Failed to save file');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    
    const fullPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
    try {
      await window.api.createFolder(activeServerId, fullPath);
      setNewFolderName(null);
      fetchDir(currentPath);
    } catch (e) {
      alert('Failed to create folder');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 flex flex-col p-6 h-full text-white relative">
      {/* Editor Modal */}
      {editingFile && (
        <div className="absolute inset-0 z-50 bg-[#0A0A0A] flex flex-col p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold font-display">{editingFile.path}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setEditingFile(null)}
                className="px-4 py-2 rounded bg-white/10 hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveFile}
                className="px-4 py-2 rounded bg-brand text-black font-bold hover:bg-brand/80 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
          <textarea
            value={editingFile.content}
            onChange={e => setEditingFile({ ...editingFile, content: e.target.value })}
            className="flex-1 bg-[#121212] border border-white/10 rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:border-brand"
            spellCheck="false"
          />
        </div>
      )}

      {/* Main File Browser */}
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
                className="bg-[#121212] border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:border-brand outline-none"
              />
              <button type="submit" className="text-sm bg-brand text-black font-bold px-3 py-1.5 rounded-lg">Create</button>
              <button type="button" onClick={() => setNewFolderName(null)} className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg">Cancel</button>
            </form>
          ) : (
            <button 
              onClick={() => setNewFolderName('')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/10 text-sm font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
              New Folder
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 p-3 bg-[#121212] rounded-t-xl border border-b-0 border-white/5">
        <button 
          onClick={handleNavigateUp}
          disabled={!currentPath}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-50 transition"
        >
          <span className="material-symbols-outlined">arrow_upward</span>
        </button>
        <span className="text-sm font-mono text-gray-300">
          Root {currentPath ? `/ ${currentPath}` : ''}
        </span>
      </div>

      <div className="flex-1 overflow-auto bg-[#0A0A0A] border border-white/5 rounded-b-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#151515] sticky top-0 z-10">
            <tr>
              <th className="p-3 text-sm font-bold text-gray-400 font-display">Name</th>
              <th className="p-3 text-sm font-bold text-gray-400 font-display w-32">Size</th>
              <th className="p-3 text-sm font-bold text-gray-400 font-display w-48">Date Modified</th>
              <th className="p-3 text-sm font-bold text-gray-400 font-display w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Loading...</td></tr>
            ) : files.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-gray-500">Folder is empty</td></tr>
            ) : (
              files.map(file => (
                <tr 
                  key={file.name} 
                  className="hover:bg-white/5 cursor-pointer border-b border-white/5 transition-colors group"
                  onClick={() => handleFileClick(file)}
                >
                  <td className="p-3 flex items-center gap-3">
                    <span className={`material-symbols-outlined ${file.isDirectory ? 'text-blue-400' : 'text-gray-400'}`}>
                      {file.isDirectory ? 'folder' : 'draft'}
                    </span>
                    <span className="text-sm font-mono truncate max-w-[400px]">{file.name}</span>
                  </td>
                  <td className="p-3 text-sm text-gray-400 font-mono">
                    {file.isDirectory ? '--' : formatSize(file.size)}
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(file.mtime).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={(e) => handleDelete(e, file)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 transition"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

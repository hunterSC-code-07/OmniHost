import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { File, Folder, Download, Trash2, Home, ChevronRight, Upload, FolderPlus } from 'lucide-react';

interface FileInfo {
  name: string;
  isDirectory: boolean;
  size: number;
  lastModified: number;
}

interface FilesTabProps {
  serverId: number;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const FilesTab: React.FC<FilesTabProps> = React.memo(({ serverId }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [editingFile, setEditingFile] = useState<{ path: string, content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.listDir(serverId, currentPath);
      // Sort: Folders first, then alphabetically
      result.sort((a: FileInfo, b: FileInfo) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(result);
    } catch (e) {
      console.error("Failed to list directory", e);
    } finally {
      setLoading(false);
    }
  }, [serverId, currentPath]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
  };

  const navigateUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleFileClick = async (file: FileInfo) => {
    const relPath = currentPath ? `${currentPath}/${file.name}` : file.name;
    if (file.isDirectory) {
      navigateTo(relPath);
    } else {
      // It's a file, try to open editor if it's text
      const exts = ['.txt', '.json', '.yml', '.yaml', '.properties', '.log'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (exts.includes(ext) || !file.name.includes('.')) {
        setLoading(true);
        const content = await window.api.readFile(serverId, relPath);
        setLoading(false);
        if (content !== null) {
          setEditingFile({ path: relPath, content });
        }
      } else {
        alert("This file type cannot be previewed/edited inside the app yet.");
      }
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    const relPath = currentPath ? `${currentPath}/${file.name}` : file.name;
    const success = await window.api.deleteItem(serverId, relPath);
    if (success) {
      fetchFiles();
    } else {
      alert("Failed to delete item.");
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    const success = await window.api.writeFile(serverId, editingFile.path, editingFile.content);
    setSaving(false);
    if (success) {
      setEditingFile(null); // Close editor on save
      fetchFiles(); // Refresh size
    } else {
      alert("Failed to save file.");
    }
  };

  const breadcrumbs = useMemo(() => {
    if (!currentPath) return [];
    const parts = currentPath.split('/');
    let accum = '';
    return parts.map(p => {
      accum = accum ? `${accum}/${p}` : p;
      return { name: p, path: accum };
    });
  }, [currentPath]);

  return (
    <div className="absolute inset-0 flex flex-col p-8 text-white font-sans animate-in fade-in duration-300 min-h-0">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-3xl font-bold text-[#00ff40]">Files</h2>
      </div>

      {editingFile ? (
        <div className="flex flex-col flex-1 min-h-0 border border-white/10 rounded-lg shadow-xl bg-black/40 backdrop-blur-md">
           <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/40 shrink-0">
              <div className="flex items-center gap-2">
                 <File className="w-5 h-5 text-gray-400" />
                 <span className="font-semibold text-gray-200">{editingFile.path}</span>
              </div>
              <div className="flex items-center gap-3">
                 <button 
                    onClick={() => setEditingFile(null)}
                    className="px-4 py-1.5 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm font-medium"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleSaveFile}
                    disabled={saving}
                    className="px-4 py-1.5 rounded-md bg-[#00ff40] text-black hover:bg-[#00cc33] transition-colors text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                 >
                    {saving ? 'Saving...' : 'Save File'}
                 </button>
              </div>
           </div>
           <textarea
             className="flex-1 w-full bg-transparent text-gray-200 p-4 font-mono text-sm resize-none focus:outline-none"
             value={editingFile.content}
             onChange={e => setEditingFile({ ...editingFile, content: e.target.value })}
             spellCheck={false}
           />
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-xl">
          {/* Toolbar & Breadcrumbs */}
          <div className="flex items-center justify-between p-3 bg-black/40 border-b border-white/10 shrink-0 shadow-inner">
            <div className="flex items-center text-sm font-medium text-gray-300">
              <button 
                onClick={() => navigateTo('')}
                className="hover:text-[#00ff40] transition-colors p-1"
              >
                <Home className="w-5 h-5" />
              </button>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-4 h-4 mx-1 text-gray-500" />
                  <button 
                    onClick={() => navigateTo(crumb.path)}
                    className="hover:text-[#00ff40] transition-colors max-w-[150px] truncate"
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button 
                className="px-3 py-1.5 bg-brand hover:brightness-110 text-black font-bold shadow-[0_0_10px_rgba(76,175,80,0.3)] rounded flex items-center gap-2 text-xs transition-all"
                onClick={() => alert("File Upload via native dialog is pending implementation")}
              >
                <Upload className="w-4 h-4" /> Upload
              </button>
              <button 
                className="px-3 py-1.5 bg-brand hover:brightness-110 text-black font-bold shadow-[0_0_10px_rgba(76,175,80,0.3)] rounded flex items-center gap-2 text-xs transition-all"
                onClick={() => alert("Create folder is pending implementation")}
              >
                <FolderPlus className="w-4 h-4" /> New Folder
              </button>
            </div>
          </div>

          {/* Files List Header */}
          <div className="bg-[#151515] border-b border-white/10 shadow-md z-10 shrink-0 rounded-t-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right w-32">Size</th>
                  <th className="py-3 px-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right w-32">Actions</th>
                </tr>
              </thead>
            </table>
          </div>

          {/* Files List Body */}
          <OverlayScrollbarsComponent 
            className="flex-1 min-h-0"
            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'leave', autoHideDelay: 200 } }} 
            defer
          >
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-400 py-10">Loading files...</div>
            ) : files.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 italic py-10">This folder is empty.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-white/5">
                  {/* Parent Dir Button if not at root */}
                  {currentPath !== '' && (
                    <tr className="hover:bg-white/5 transition-colors cursor-pointer group" onClick={navigateUp}>
                      <td className="py-3 px-4 flex items-center gap-3">
                        <Folder className="w-5 h-5 text-yellow-500" />
                        <span className="text-gray-300 font-medium group-hover:text-white transition-colors">..</span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 text-sm">-</td>
                      <td className="py-3 px-4 text-right"></td>
                    </tr>
                  )}
                  {files.map(f => (
                    <tr key={f.name} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-4 flex items-center gap-3 cursor-pointer" onClick={() => handleFileClick(f)}>
                        {f.isDirectory ? (
                           <Folder className="w-5 h-5 text-[#00ff40]" />
                        ) : (
                           <File className="w-5 h-5 text-gray-400 group-hover:text-gray-200" />
                        )}
                        <span className="text-gray-200 font-medium truncate group-hover:text-[#00ff40] transition-colors max-w-sm">
                          {f.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400 text-sm cursor-pointer" onClick={() => handleFileClick(f)}>
                        {f.isDirectory ? '-' : formatSize(f.size)}
                      </td>
                      <td className="py-3 px-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="p-1.5 rounded bg-black/40 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white transition-colors shadow-sm"
                          title="Download"
                          onClick={() => alert("File Download via native dialog is pending implementation")}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-1.5 rounded bg-[#3a1111]/80 hover:bg-red-600 border border-red-900/50 text-red-400 hover:text-white transition-colors shadow-sm"
                          title="Delete"
                          onClick={() => handleDelete(f)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </OverlayScrollbarsComponent>
        </div>
      )}
    </div>
  );
});

FilesTab.displayName = 'FilesTab';

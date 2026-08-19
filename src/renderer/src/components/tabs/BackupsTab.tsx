import React, { useState, useEffect } from 'react';

interface BackupsTabProps {
  activeServerId: number | null;
}

export const BackupsTab: React.FC<BackupsTabProps> = ({ activeServerId }) => {
  const [backups, setBackups] = useState<any[]>([]);
  const [newBackupName, setNewBackupName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');

  const fetchBackups = async () => {
    if (activeServerId === null) return;
    // @ts-ignore
    const data = await window.api.getBackups(activeServerId);
    setBackups(data);
  };

  useEffect(() => {
    fetchBackups();
  }, [activeServerId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeServerId === null) return;
    setIsProcessing(true);
    setProgressText('Creating backup (this may take a moment)...');
    try {
      // @ts-ignore
      await window.api.createBackup(activeServerId, newBackupName);
      setNewBackupName('');
      await fetchBackups();
    } catch (e: any) {
      alert('Failed to create backup: ' + e.message);
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleRestore = async (filename: string) => {
    if (activeServerId === null) return;
    if (!confirm(`Are you sure you want to restore ${filename}? This will OVERWRITE your current world and cannot be undone!`)) return;
    
    setIsProcessing(true);
    setProgressText(`Restoring ${filename}...`);
    try {
      // @ts-ignore
      await window.api.restoreBackup(activeServerId, filename);
      alert('Backup restored successfully! Make sure to restart your server if it is running.');
    } catch (e: any) {
      alert('Failed to restore backup: ' + e.message);
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleDelete = async (filename: string) => {
    if (activeServerId === null) return;
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    
    setIsProcessing(true);
    try {
      // @ts-ignore
      await window.api.deleteBackup(activeServerId, filename);
      await fetchBackups();
    } catch (e: any) {
      alert('Failed to delete backup: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto">
      <div className="bg-darkCard p-6 rounded-xl border border-gray-800 shadow-md mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Create World Backup</h2>
        <form onSubmit={handleCreate} className="flex gap-4">
          <input
            type="text"
            placeholder="Backup Name (optional)"
            value={newBackupName}
            onChange={(e) => setNewBackupName(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white outline-none focus:border-brand"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing}
            className="px-8 bg-brand hover:bg-yellow-600 rounded-lg font-bold transition-all disabled:opacity-50 text-white"
          >
            {isProcessing && progressText.includes('Creat') ? 'Creating...' : 'Create Backup'}
          </button>
        </form>
        {isProcessing && progressText && <p className="text-brand mt-4 text-sm font-mono animate-pulse">{progressText}</p>}
      </div>

      <div className="flex-1 bg-darkCard rounded-xl border border-gray-800 overflow-hidden flex flex-col shadow-md">
        <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-200">Available Backups</h3>
          <span className="text-sm text-gray-400 font-mono">{backups.length} backups</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {backups.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 flex-col gap-2">
              <span className="text-4xl">📦</span>
              <p>No backups found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {backups.map((b) => (
                <div key={b.name} className="bg-gray-900 border border-gray-800 p-5 rounded-xl group hover:border-gray-600 transition-all flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-white truncate text-lg" title={b.name}>{b.name}</h4>
                      <p className="text-xs text-gray-400 font-mono mt-1">{new Date(b.date).toLocaleString()}</p>
                    </div>
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 font-mono whitespace-nowrap ml-2">
                      {formatBytes(b.size)}
                    </span>
                  </div>
                  
                  <div className="mt-auto grid grid-cols-2 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRestore(b.name)}
                      disabled={isProcessing}
                      className="py-2 bg-green-900/40 hover:bg-green-600 text-green-400 hover:text-white rounded-lg font-bold transition-colors disabled:opacity-50 text-sm"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDelete(b.name)}
                      disabled={isProcessing}
                      className="py-2 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white rounded-lg font-bold transition-colors disabled:opacity-50 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useServerStore } from '../store/useServerStore';
import { useDayzFileStore, FileEntry } from '../store/useDayzFileStore';

export function useDayzFileOperations(fetchDir: (path: string) => void) {
  const { activeServerId } = useServerStore();
  const { currentPath, newFolderName, setNewFolderName } = useDayzFileStore();

  const handleDelete = async (e: React.MouseEvent, file: FileEntry) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;
    
    const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
    try {
      await window.api.fs.deleteItem(activeServerId, fullPath);
      fetchDir(currentPath);
    } catch (e) {
      alert('Failed to delete item');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    
    const fullPath = currentPath ? `${currentPath}/${newFolderName}` : newFolderName;
    try {
      await window.api.fs.createFolder(activeServerId, fullPath);
      setNewFolderName(null);
      fetchDir(currentPath);
    } catch (e) {
      alert('Failed to create folder');
    }
  };

  return {
    handleDelete,
    handleCreateFolder,
  };
}

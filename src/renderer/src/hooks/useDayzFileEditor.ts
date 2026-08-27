import { useServerStore } from '../store/useServerStore';
import { useDayzFileStore, FileEntry } from '../store/useDayzFileStore';

export function useDayzFileEditor(handleNavigate: (path: string) => void) {
  const { activeServerId } = useServerStore();
  const { currentPath, editingFile, setEditingFile } = useDayzFileStore();

  const handleFileClick = async (file: FileEntry) => {
    const fullPath = currentPath ? `${currentPath}/${file.name}` : file.name;
    if (file.isDirectory) {
      handleNavigate(fullPath);
    } else {
      const editableExts = ['.txt', '.json', '.cfg', '.xml', '.yaml', '.yml', '.log'];
      const isEditable = editableExts.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (isEditable || file.size < 1024 * 1024) {
        try {
          const content = await window.api.fs.readFile(activeServerId, fullPath);
          setEditingFile({ path: fullPath, content });
        } catch (e) {
          alert('Could not read file');
        }
      } else {
        alert('File type not supported for editing or too large.');
      }
    }
  };

  const handleSaveFile = async () => {
    if (!editingFile) return;
    try {
      await window.api.fs.writeFile(activeServerId, editingFile.path, editingFile.content);
      alert('File saved successfully!');
      setEditingFile(null);
    } catch (e) {
      alert('Failed to save file');
    }
  };

  return {
    handleFileClick,
    handleSaveFile,
  };
}

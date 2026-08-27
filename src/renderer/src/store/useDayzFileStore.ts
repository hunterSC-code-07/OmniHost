import { create } from 'zustand';

export interface FileEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: string;
}

interface DayzFileState {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  files: FileEntry[];
  setFiles: (files: FileEntry[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  editingFile: { path: string, content: string } | null;
  setEditingFile: (file: { path: string, content: string } | null) => void;
  newFolderName: string | null;
  setNewFolderName: (name: string | null) => void;
}

export const useDayzFileStore = create<DayzFileState>((set) => ({
  currentPath: '',
  setCurrentPath: (path) => set({ currentPath: path }),
  files: [],
  setFiles: (files) => set({ files }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  editingFile: null,
  setEditingFile: (editingFile) => set({ editingFile }),
  newFolderName: null,
  setNewFolderName: (newFolderName) => set({ newFolderName }),
}));

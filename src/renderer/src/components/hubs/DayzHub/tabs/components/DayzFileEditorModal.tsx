import React from 'react';
import { useDayzFileStore } from '../../../../../store/useDayzFileStore';
import { useDayzFileEditor } from '../../../../../hooks/useDayzFileEditor';
import { useDayzFileNavigation } from '../../../../../hooks/useDayzFileNavigation';

export const DayzFileEditorModal: React.FC = () => {
  const { editingFile, setEditingFile } = useDayzFileStore();
  const { handleNavigate } = useDayzFileNavigation();
  const { handleSaveFile } = useDayzFileEditor(handleNavigate);

  if (!editingFile) return null;

  return (
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
        onChange={e => setEditingFile({ ...editingFile, content: e.target.value })}
        className="flex-1 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 font-mono text-sm resize-none focus:outline-none focus:border-red-500/50 text-gray-300 shadow-inner custom-scrollbar"
        spellCheck="false"
      />
    </div>
  );
};

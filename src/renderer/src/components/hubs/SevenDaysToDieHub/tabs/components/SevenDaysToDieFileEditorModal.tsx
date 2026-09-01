import React from 'react';
import { useDayzFileStore } from '../../../../../store/useDayzFileStore';
import { useDayzFileEditor } from '../../../../../hooks/useDayzFileEditor';
import { useDayzFileNavigation } from '../../../../../hooks/useDayzFileNavigation';

export const SevenDaysToDieFileEditorModal: React.FC = () => {
  const { editingFile, setEditingFile } = useDayzFileStore();
  const { handleNavigate } = useDayzFileNavigation();
  const { handleSaveFile } = useDayzFileEditor(handleNavigate);

  if (!editingFile) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/90 flex flex-col p-8 sevendays-ui">
      <div className="flex justify-between items-center mb-6 pb-2 border-b border-[var(--7dtd-border)]">
        <h3 className="text-xl sevendays-title text-white uppercase">{editingFile.path}</h3>
        <div className="flex gap-4">
          <button 
            onClick={() => setEditingFile(null)}
            className="sevendays-btn"
          >
            CANCEL
          </button>
          <button 
            onClick={handleSaveFile}
            className="sevendays-btn sevendays-btn-danger"
          >
            SAVE CHANGES
          </button>
        </div>
      </div>
      <textarea
        value={editingFile.content}
        onChange={e => setEditingFile({ ...editingFile, content: e.target.value })}
        className="flex-1 bg-[var(--7dtd-bg-panel-dark)] border border-[var(--7dtd-border)] p-4 font-mono text-sm resize-none focus:outline-none focus:border-white text-[var(--7dtd-text)]"
        spellCheck="false"
      />
    </div>
  );
};

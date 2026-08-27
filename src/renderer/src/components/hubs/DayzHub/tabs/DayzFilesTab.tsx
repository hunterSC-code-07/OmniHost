import React from 'react';
import { DayzFileEditorModal } from './components/DayzFileEditorModal';
import { DayzFileBrowserHeader } from './components/DayzFileBrowserHeader';
import { DayzFileGrid } from './components/DayzFileGrid';

export const DayzFilesTab: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-6 h-full text-white relative bg-transparent font-body">
      <DayzFileEditorModal />
      <DayzFileBrowserHeader />
      <DayzFileGrid />
    </div>
  );
};

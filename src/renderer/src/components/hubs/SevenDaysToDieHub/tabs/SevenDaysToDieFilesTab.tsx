import React from 'react';
import { SevenDaysToDieFileEditorModal } from './components/SevenDaysToDieFileEditorModal';
import { SevenDaysToDieFileBrowserHeader } from './components/SevenDaysToDieFileBrowserHeader';
import { SevenDaysToDieFileGrid } from './components/SevenDaysToDieFileGrid';

export const SevenDaysToDieFilesTab: React.FC = () => {
  return (
    <div className="flex-1 min-h-0 sevendays-ui flex flex-col p-8 gap-6 h-full relative">
      <SevenDaysToDieFileEditorModal />
      <SevenDaysToDieFileBrowserHeader />
      <SevenDaysToDieFileGrid />
    </div>
  );
};

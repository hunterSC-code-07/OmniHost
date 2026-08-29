import React, { useEffect } from 'react';

interface Props {
  serverId: number;
}

export const SevenDaysToDieCommunityModsTab: React.FC<Props> = ({ serverId }) => {
  useEffect(() => {
    // Register active server for downloads
    // @ts-ignore
    window.api.sevenDaysToDie.setActiveDownloadServer(serverId);
    
    return () => {
      // Unregister on unmount
      // @ts-ignore
      window.api.sevenDaysToDie.setActiveDownloadServer(null);
    };
  }, [serverId]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <webview 
        src="https://7daystodiemods.com/" 
        className="w-full h-full"
        allowpopups="true"
      />
    </div>
  );
};

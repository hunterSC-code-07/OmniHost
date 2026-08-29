import React from 'react';
import { OverviewTab } from '../../../tabs/OverviewTab';

export const TheForestOverviewTab: React.FC = () => {
  return (
    <OverviewTab 
      serverVersion="Latest"
      maxPlayers={8} 
      maxRam={4}
      maxCpu={4}
    />
  );
};

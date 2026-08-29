import React from 'react';
import { OverviewTab } from '../../../tabs/OverviewTab';

interface Props {
  serverId: number;
}

export const TheForestOverviewTab: React.FC<Props> = ({ serverId }) => {
  return (
    <OverviewTab 
      serverVersion="Latest"
      maxPlayers={8} 
      maxRam={4}
      maxCpu={4}
    />
  );
};

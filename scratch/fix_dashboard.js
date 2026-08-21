const fs = require('fs');
const appPath = 'src/renderer/src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

const startMarker = '{activeServerId === null && activeGameHub === null && (';
const endMarker = '</OverlayScrollbarsComponent>';

let startIdx = content.indexOf(startMarker, 800); // skip the top navbar button
let endIdx = content.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find Dashboard block in App.tsx!");
  process.exit(1);
}

const extractedJSX = content.substring(startIdx, endIdx + endMarker.length);

const dashboardComponent = `import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

export function DashboardHub({ servers, activeGameHub, hoveredGame, setHoveredGame, setActiveGameHub, setActiveServerId, handleStart, handleStop, handleRestart, handleDelete, handleTunnel, tunnelStatus, tunnelIp, getGameImageUrl }: any) {
  return (
    ${extractedJSX}
  );
}
`;

fs.writeFileSync('src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx', dashboardComponent);

const replaceContent = `{activeServerId === null && activeGameHub === null && (
            <DashboardHub 
              servers={servers}
              activeGameHub={activeGameHub}
              hoveredGame={hoveredGame}
              setHoveredGame={setHoveredGame}
              setActiveGameHub={setActiveGameHub}
              setActiveServerId={setActiveServerId}
              handleStart={handleStart}
              handleStop={handleStop}
              handleRestart={handleRestart}
              handleDelete={handleDelete}
              handleTunnel={handleTunnel}
              tunnelStatus={tunnelStatus}
              tunnelIp={tunnelIp}
              getGameImageUrl={getGameImageUrl}
            />
          )}`;

const newAppContent = content.substring(0, startIdx) + replaceContent + content.substring(endIdx + endMarker.length + 12);
// The +12 skips the closing ')}' which is usually a few characters after OverlayScrollbarsComponent

fs.writeFileSync(appPath, newAppContent);
console.log("Dashboard correctly extracted and replaced.");

const fs = require('fs');

const appPath = 'src/renderer/src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

const startSearch = '{/* DASHBOARD VIEW */}';
const startIdx = content.indexOf(startSearch);
if (startIdx === -1) process.exit(1);

// Find exactly `{activeServerId === null && activeGameHub === null && (`
const startJSX = content.indexOf('<OverlayScrollbarsComponent', startIdx);
let balance = 0;
let endIdx = -1;
for (let i = startJSX; i < content.length; i++) {
  if (content.substr(i, 26) === '<OverlayScrollbarsComponent') balance++;
  if (content.substr(i, 27) === '</OverlayScrollbarsComponent') {
    balance--;
    if (balance === 0) {
      endIdx = i + 28;
      break;
    }
  }
}

const extractedJSX = content.substring(startJSX, endIdx);

// Create DashboardHub.tsx
const dashboardComponent = `import React from 'react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

export function DashboardHub({ servers, activeGameHub, hoveredGame, setHoveredGame, setActiveGameHub, setActiveServerId, handleStart, handleStop, handleRestart, handleDelete, handleTunnel, tunnelStatus, tunnelIp }: any) {
  return (
    ${extractedJSX}
  );
}
`;

fs.mkdirSync('src/renderer/src/components/hubs/DashboardHub', { recursive: true });
fs.writeFileSync('src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx', dashboardComponent);

// Now replace it in App.tsx
const replaceBlockStart = content.lastIndexOf('{activeServerId === null', startJSX);
let replaceBlockEnd = content.indexOf(')}', endIdx) + 2;

const newAppContent = content.substring(0, replaceBlockStart) + 
  `{activeServerId === null && activeGameHub === null && (
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
              />\n            )}` + 
  content.substring(replaceBlockEnd);

fs.writeFileSync(appPath, newAppContent);
console.log('DashboardHub extracted successfully.');

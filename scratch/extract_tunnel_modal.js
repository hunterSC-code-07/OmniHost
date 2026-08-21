const fs = require('fs');

const appPath = 'src/renderer/src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

const startSearch = "{showTunnelModal && activeServer?.game !== 'DayZ' && (";
let startIdx = content.indexOf(startSearch);
if (startIdx === -1) {
  console.log("No TunnelModal found");
  process.exit(1);
}

const startJSX = content.indexOf('<div className="fixed inset-0', startIdx);
if (startJSX === -1) {
  console.log("No TunnelModal JSX found");
  process.exit(1);
}

let balance = 0;
let endIdx = -1;
for (let i = startJSX; i < content.length; i++) {
  if (content.substr(i, 4) === '<div') balance++;
  if (content.substr(i, 5) === '</div') {
    balance--;
    if (balance === 0) {
      endIdx = i + 6;
      break;
    }
  }
}

const extractedJSX = content.substring(startJSX, endIdx);

const componentCode = `import React from 'react';

export function TunnelModal({
  tempTunnelIp,
  setTempTunnelIp,
  setTunnelIp,
  setShowTunnelModal,
  showToast
}: any) {
  return (
    ${extractedJSX}
  );
}
`;

fs.writeFileSync('src/renderer/src/components/modals/TunnelModal.tsx', componentCode);

const replaceBlockStart = content.lastIndexOf(startSearch, startJSX);
let replaceBlockEnd = content.indexOf(')}', endIdx) + 2;

const newAppContent = content.substring(0, replaceBlockStart) + 
  `{showTunnelModal && activeServer?.game !== 'DayZ' && (
          <TunnelModal 
            tempTunnelIp={tempTunnelIp}
            setTempTunnelIp={setTempTunnelIp}
            setTunnelIp={setTunnelIp}
            setShowTunnelModal={setShowTunnelModal}
            showToast={showToast}
          />\n        )}` + 
  content.substring(replaceBlockEnd);

fs.writeFileSync(appPath, newAppContent);
console.log('TunnelModal extracted successfully.');

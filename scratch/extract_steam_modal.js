const fs = require('fs');

const appPath = 'src/renderer/src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

const startSearch = '{/* STEAM LOGIN MODAL */}';
let startIdx = content.indexOf(startSearch);
if (startIdx === -1) {
  startIdx = content.indexOf('{showSteamLoginModal && (');
}

const startJSX = content.indexOf('<div className="fixed inset-0', startIdx);
if (startJSX === -1) {
  console.log("No SteamLoginModal found");
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

export function SteamLoginModal({
  steamLoginAction,
  steamUsername,
  setSteamUsername,
  steamPassword,
  setSteamPassword,
  isSteamGuardRequired,
  steamGuardCode,
  setSteamGuardCode,
  handleUpdateSteamCache,
  setShowSteamLoginModal
}: any) {
  return (
    ${extractedJSX}
  );
}
`;

fs.writeFileSync('src/renderer/src/components/modals/SteamLoginModal.tsx', componentCode);

const replaceBlockStart = content.lastIndexOf('{showSteamLoginModal && (', startJSX);
let replaceBlockEnd = content.indexOf(')}', endIdx) + 2;

const newAppContent = content.substring(0, replaceBlockStart) + 
  `{showSteamLoginModal && (
          <SteamLoginModal 
            steamLoginAction={steamLoginAction}
            steamUsername={steamUsername}
            setSteamUsername={setSteamUsername}
            steamPassword={steamPassword}
            setSteamPassword={setSteamPassword}
            isSteamGuardRequired={isSteamGuardRequired}
            steamGuardCode={steamGuardCode}
            setSteamGuardCode={setSteamGuardCode}
            handleUpdateSteamCache={handleUpdateSteamCache}
            setShowSteamLoginModal={setShowSteamLoginModal}
          />\n        )}` + 
  content.substring(replaceBlockEnd);

fs.writeFileSync(appPath, newAppContent);
console.log('SteamLoginModal extracted successfully.');

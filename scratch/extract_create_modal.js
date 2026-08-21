const fs = require('fs');

const appPath = 'src/renderer/src/App.tsx';
let content = fs.readFileSync(appPath, 'utf8');

const startSearch = '{/* CREATE SERVER MODAL */}';
const startIdx = content.indexOf(startSearch);

// Find exactly `{showCreateModal && (`
const startJSX = content.indexOf('<div className="fixed inset-0', startIdx);
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

export function CreateServerModal({
  newServerType,
  setNewServerType,
  newServerName,
  setNewServerName,
  newServerVersion,
  setNewServerVersion,
  newServerLoaderVersion,
  setNewServerLoaderVersion,
  isNewServerTypeMenuOpen,
  setIsNewServerTypeMenuOpen,
  isNewServerVersionMenuOpen,
  setIsNewServerVersionMenuOpen,
  isNewServerLoaderMenuOpen,
  setIsNewServerLoaderMenuOpen,
  availableVersions,
  availableLoaderVersions,
  supportedGameHubs,
  isCreatingServer,
  downloadProgress,
  downloadText,
  handleCreateServer,
  setShowCreateModal
}: any) {
  return (
    ${extractedJSX}
  );
}
`;

fs.mkdirSync('src/renderer/src/components/modals', { recursive: true });
fs.writeFileSync('src/renderer/src/components/modals/CreateServerModal.tsx', componentCode);

const replaceBlockStart = content.lastIndexOf('{showCreateModal && (', startJSX);
let replaceBlockEnd = content.indexOf(')}', endIdx) + 2;

const newAppContent = content.substring(0, replaceBlockStart) + 
  `{showCreateModal && (
          <CreateServerModal 
            newServerType={newServerType}
            setNewServerType={setNewServerType}
            newServerName={newServerName}
            setNewServerName={setNewServerName}
            newServerVersion={newServerVersion}
            setNewServerVersion={setNewServerVersion}
            newServerLoaderVersion={newServerLoaderVersion}
            setNewServerLoaderVersion={setNewServerLoaderVersion}
            isNewServerTypeMenuOpen={isNewServerTypeMenuOpen}
            setIsNewServerTypeMenuOpen={setIsNewServerTypeMenuOpen}
            isNewServerVersionMenuOpen={isNewServerVersionMenuOpen}
            setIsNewServerVersionMenuOpen={setIsNewServerVersionMenuOpen}
            isNewServerLoaderMenuOpen={isNewServerLoaderMenuOpen}
            setIsNewServerLoaderMenuOpen={setIsNewServerLoaderMenuOpen}
            availableVersions={availableVersions}
            availableLoaderVersions={availableLoaderVersions}
            supportedGameHubs={supportedGameHubs}
            isCreatingServer={isCreatingServer}
            downloadProgress={downloadProgress}
            downloadText={downloadText}
            handleCreateServer={handleCreateServer}
            setShowCreateModal={setShowCreateModal}
          />\n        )}` + 
  content.substring(replaceBlockEnd);

fs.writeFileSync(appPath, newAppContent);
console.log('CreateServerModal extracted successfully.');

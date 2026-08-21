const fs = require('fs');

const hubPath = 'src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx';
fs.copyFileSync('src/renderer/src/App.tsx', hubPath);

let content = fs.readFileSync(hubPath, 'utf8');

// 1. Rename App to MinecraftHub
content = content.replace('export default App', '');
content = content.replace('function App() {', 'export function MinecraftHub({ activeServerId, activeServer, setActiveServerId, handleStart, handleStop, handleRestart, handleDelete, handleTunnel, tunnelStatus, radminIp, tunnelIp, setTempTunnelIp, setShowTunnelModal, servers }: any) {');

// 2. Extract JSX
const startTag = '<div className="flex-1 flex flex-col relative overflow-hidden">';
const startIdx = content.indexOf(startTag);

let balance = 0;
let endIdx = -1;
for (let i = startIdx; i < content.length; i++) {
  if (content.substr(i, 4) === '<div') balance++;
  if (content.substr(i, 5) === '</div') {
    balance--;
    if (balance === 0) {
      endIdx = i + 6;
      break;
    }
  }
}

const extractedJSX = content.substring(startIdx, endIdx);

// 3. Find the main return (
const regex = /return\s*\(\s*<div className="bg-gradient-to-b/;
const match = content.match(regex);
if (!match) {
  console.log('Failed to match return');
  process.exit(1);
}

const returnIdx = match.index;
const newContent = content.substring(0, returnIdx) + 'return (\n    ' + extractedJSX + '\n  );\n}';

fs.writeFileSync(hubPath, newContent);
console.log('Re-spliced successfully.');

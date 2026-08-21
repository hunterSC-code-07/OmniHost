const fs = require('fs');

const hubPath = 'src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx';
// Reset MinecraftHub.tsx back to App.tsx content
fs.copyFileSync('src/renderer/src/App.tsx', hubPath);

let content = fs.readFileSync(hubPath, 'utf8');

// 1. Rename App to MinecraftHub using simple regex to avoid AST issues for now
content = content.replace('export default App', '');
content = content.replace('function App() {', 'export function MinecraftHub({ activeServerId, activeServer, setActiveServerId, handleStart, handleStop, handleRestart, handleDelete, handleTunnel, tunnelStatus, radminIp, tunnelIp, setTempTunnelIp, setShowTunnelModal, servers }: any) {');

// 2. Splice the JSX
const startTag = '<div className="flex-1 flex flex-col relative overflow-hidden">';
const startIdx = content.indexOf(startTag);

let balance = 0;
let endIdx = -1;
for (let i = startIdx; i < content.length; i++) {
  if (content.substr(i, 4) === '<div') balance++;
  if (content.substr(i, 5) === '</div') {
    balance--;
    if (balance === 0) {
      endIdx = i + 6; // Includes `</div>`
      break;
    }
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.log('Failed to find bounds.');
  process.exit(1);
}

const extractedJSX = content.substring(startIdx, endIdx);

// Replace from `return (` of the main component
const returnSearch = '  return (\n    <div className="bg-gradient';
const returnIdx = content.indexOf(returnSearch);

const newContent = content.substring(0, returnIdx) + '  return (\n    ' + extractedJSX + '\n  );\n}';

fs.writeFileSync(hubPath, newContent);
console.log('Re-spliced successfully.');

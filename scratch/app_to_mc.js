const fs = require('fs');
const content = fs.readFileSync('src/renderer/src/App.tsx', 'utf8');

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

const newContent = content.substring(0, startIdx) + 
  `<MinecraftHub 
    activeServerId={activeServerId} 
    activeServer={activeServer} 
    servers={servers} 
    setActiveServerId={setActiveServerId} 
    handleStart={handleStart} 
    handleStop={handleStop} 
    handleRestart={handleRestart} 
    handleDelete={handleDelete} 
    handleTunnel={handleTunnel} 
    tunnelStatus={tunnelStatus} 
    radminIp={radminIp} 
    tunnelIp={tunnelIp} 
    setTempTunnelIp={setTempTunnelIp} 
    setShowTunnelModal={setShowTunnelModal} 
    showToast={showToast}
  />` + 
  content.substring(endIdx);

fs.writeFileSync('src/renderer/src/App.tsx', newContent);
console.log('App.tsx now uses MinecraftHub!');

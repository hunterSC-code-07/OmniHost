const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();

const appFile = project.addSourceFileAtPath('src/renderer/src/App.tsx');
const hubFile = project.addSourceFileAtPath('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx');

// In MinecraftHub:
// 1. Rename App to MinecraftHub
const appFunction = hubFile.getFunction('App');
if (appFunction) {
  appFunction.rename('MinecraftHub');
  appFunction.setIsExported(true);
}

// 2. Add Props interface
hubFile.insertInterface(0, {
  name: 'MinecraftHubProps',
  properties: [
    { name: 'activeServerId', type: 'number' },
    { name: 'activeServer', type: 'any' },
    { name: 'setActiveServerId', type: 'any' },
    { name: 'handleStart', type: 'any' },
    { name: 'handleStop', type: 'any' },
    { name: 'handleRestart', type: 'any' },
    { name: 'handleDelete', type: 'any' },
    { name: 'handleTunnel', type: 'any' },
    { name: 'tunnelStatus', type: 'string' },
    { name: 'radminIp', type: 'string | null' },
    { name: 'tunnelIp', type: 'string' },
    { name: 'setTempTunnelIp', type: 'any' },
    { name: 'setShowTunnelModal', type: 'any' },
    { name: 'servers', type: 'any[]' },
  ]
});

// Update component signature
if (appFunction) {
  appFunction.addParameter({
    name: '{ activeServerId, activeServer, setActiveServerId, handleStart, handleStop, handleRestart, handleDelete, handleTunnel, tunnelStatus, radminIp, tunnelIp, setTempTunnelIp, setShowTunnelModal, servers }',
    type: 'MinecraftHubProps'
  });
}

// We will manually fix the return statement for MinecraftHub.tsx and App.tsx using replace_file_content because JSX AST manipulation is too hard.
hubFile.saveSync();
appFile.saveSync();
console.log('AST transformations complete.');

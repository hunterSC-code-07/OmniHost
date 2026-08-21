const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');

const project = new Project();
project.addSourceFilesAtPaths("src/main/index.ts");
const indexFile = project.getSourceFile("src/main/index.ts");

// We will find `ipcMain.handle` calls inside the `app.whenReady().then(...)` block.
const appReadyCall = indexFile.getDescendantsOfKind(SyntaxKind.CallExpression)
  .find(c => c.getExpression().getText() === 'app.whenReady().then');

if (!appReadyCall) {
  console.error("Could not find app.whenReady().then");
  process.exit(1);
}

const thenBlock = appReadyCall.getArguments()[0].getBody();
const statements = thenBlock.getStatements();

const serverHandlers = [
  'get-servers', 'delete-server', 'create-server', 'change-server-software',
  'start-server', 'stop-server', 'toggle-auto-start'
];

const steamHandlers = [
  'install-steam-app', 'check-steam-cache', 'delete-steam-cache',
  'update-steam-cache', 'copy-steam-cache', 'send-steamcmd-input'
];

const systemHandlers = [
  'get-system-info', 'update-server-meta', 'get-server-meta', 'get-player-stats',
  'start-tunnel', 'stop-tunnel', 'get-tunnel-status',
  'radmin-check', 'radmin-install', 'radmin-open', 'radmin-get-ip',
  'read-config', 'write-config', 'read-json', 'write-json',
  'list-dir', 'delete-item', 'read-file', 'write-file',
  'create-backup', 'get-backups', 'restore-backup', 'delete-backup',
  'get-cache-info', 'clear-cache', 'send-command'
];

const minecraftHandlers = [
  'get-vanilla-versions', 'get-paper-versions', 'get-fabric-versions', 'get-forge-versions', 'get-neoforge-versions', 'get-loader-versions',
  'search-modpacks', 'get-modpack-details', 'install-curseforge-modpack',
  'search-curseforge-mods', 'get-curseforge-mod', 'get-curseforge-file', 'install-curseforge-mod', 'get-installed-mods', 'delete-mod',
  'download-server-jar', 'get-inventory'
];

let serverCode = [];
let steamCode = [];
let systemCode = [];
let minecraftCode = [];

for (const stmt of statements) {
  if (stmt.getKind() === SyntaxKind.ExpressionStatement) {
    const expr = stmt.getExpression();
    if (expr.getKind() === SyntaxKind.CallExpression) {
      const callText = expr.getExpression().getText();
      if (callText === 'ipcMain.handle') {
        const args = expr.getArguments();
        if (args.length > 0) {
          const handlerName = args[0].getText().replace(/['"`]/g, '');
          const fullText = stmt.getFullText();
          
          if (serverHandlers.includes(handlerName)) serverCode.push(fullText);
          else if (steamHandlers.includes(handlerName)) steamCode.push(fullText);
          else if (systemHandlers.includes(handlerName)) systemCode.push(fullText);
          else if (minecraftHandlers.includes(handlerName)) minecraftCode.push(fullText);
          else console.log(`Unmatched handler: ${handlerName}`);
          
          stmt.remove();
        }
      }
    }
  }
}

const generateImports = () => `import { app, ipcMain } from 'electron';
import { join } from 'path';
import fsPromises from 'fs/promises';
import fs from 'fs';
import os from 'os';
import axios from 'axios';
import semver from 'semver';
import extractZip from 'extract-zip';
import { spawn } from 'child_process';
import { CacheManager } from '../CacheManager';
import { getServers, createServer, deleteServer, updateServerSoftware } from '../db';
import { DayzAdapter } from '../adapters/DayzAdapter';
import { MinecraftAdapter } from '../adapters/MinecraftAdapter';
import { WakeProxy } from '../adapters/WakeProxy';
import { FrpAdapter } from '../adapters/FrpAdapter';
import { RadminVpnAdapter } from '../adapters/RadminVpnAdapter';
import { JavaManager } from '../adapters/JavaManager';
import { SteamCMDManager } from '../adapters/SteamCMDManager';

async function exists(path: string) {
  try {
    await fsPromises.access(path);
    return true;
  } catch {
    return false;
  }
}
const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API_KEY || '';
`;

fs.mkdirSync('src/main/ipc', { recursive: true });

fs.writeFileSync('src/main/ipc/ServerIpc.ts', generateImports() + `
export function registerServerIpc(activeServers: Record<number, any>, activeProxies: Record<number, WakeProxy>) {
${serverCode.join('\n')}
}
`);

fs.writeFileSync('src/main/ipc/SteamCMDIpc.ts', generateImports() + `
export function registerSteamCMDIpc() {
${steamCode.join('\n')}
}
`);

fs.writeFileSync('src/main/ipc/SystemIpc.ts', generateImports() + `
export function registerSystemIpc(tunnelProvider: FrpAdapter, radminVpnProvider: RadminVpnAdapter, activeServers: Record<number, any>) {
${systemCode.join('\n')}
}
`);

fs.writeFileSync('src/main/ipc/MinecraftIpc.ts', generateImports() + `
export function registerMinecraftIpc(activeServers: Record<number, any>) {
${minecraftCode.join('\n')}
}
`);

indexFile.addImportDeclaration({
  namedImports: ['registerServerIpc'],
  moduleSpecifier: './ipc/ServerIpc'
});
indexFile.addImportDeclaration({
  namedImports: ['registerSteamCMDIpc'],
  moduleSpecifier: './ipc/SteamCMDIpc'
});
indexFile.addImportDeclaration({
  namedImports: ['registerSystemIpc'],
  moduleSpecifier: './ipc/SystemIpc'
});
indexFile.addImportDeclaration({
  namedImports: ['registerMinecraftIpc'],
  moduleSpecifier: './ipc/MinecraftIpc'
});

const initBlock = `
  registerServerIpc(activeServers, activeProxies);
  registerSteamCMDIpc();
  registerSystemIpc(tunnelProvider, radminVpnProvider, activeServers);
  registerMinecraftIpc(activeServers);
`;

thenBlock.addStatements(initBlock);

indexFile.saveSync();
console.log("Refactoring complete!");

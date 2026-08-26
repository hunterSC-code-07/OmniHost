const fs = require('fs');

let s = fs.readFileSync('src/main/ipc/ServerIpc.ts', 'utf8');

// Replace MinecraftAdapter with MinecraftProcessManager
s = s.replace(/MinecraftAdapter/g, 'MinecraftProcessManager');
s = s.replace(/from '\.\.\/adapters\/MinecraftProcessManager'/g, "from '../minecraft/MinecraftProcessManager'");

// Replace DayzConfig handlers
s = s.replace(
  /ipcMain\.handle\('read-dayz-config', async \(_, id\) => {[\s\S]*?return null\n  }\)/,
  "ipcMain.handle('read-dayz-config', async (_, id) => { return await DayzConfigManager.readConfig(id); })"
);

s = s.replace(
  /ipcMain\.handle\('write-dayz-config', async \(_, id, content\) => {[\s\S]*?return false\n  }\)/,
  "ipcMain.handle('write-dayz-config', async (_, id, content) => { return await DayzConfigManager.writeConfig(id, content); })"
);

// Add DayzConfigManager import
if (!s.includes('DayzConfigManager')) {
  s = s.replace(
    /import \{ DayzEconomyManager \} from '\.\.\/dayz\/DayzEconomyManager'/,
    "import { DayzEconomyManager } from '../dayz/DayzEconomyManager'\nimport { DayzConfigManager } from '../dayz/DayzConfigManager'"
  );
}

fs.writeFileSync('src/main/ipc/ServerIpc.ts', s);
console.log('Done refactoring ServerIpc.ts');

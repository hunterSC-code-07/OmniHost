const fs = require('fs');
const path = require('path');
const file = path.join('d:', 'github', 'OmniHost', 'src', 'main', 'ipc', 'ServerIpc.ts');
let content = fs.readFileSync(file, 'utf-8');

// 1. Remove XMLParser, XMLBuilder, axios, AdmZip imports
content = content.replace(/import \{ XMLParser, XMLBuilder \} from 'fast-xml-parser'[\r\n]*/, '');
content = content.replace(/import axios from 'axios'[\r\n]*/, '');
content = content.replace(/import AdmZip from 'adm-zip'[\r\n]*/, '');

// 2. Add Manager imports right after SteamCMDManager
const newImports = 'import { DayzConfigManager } from \'../dayz/DayzConfigManager\'\nimport { DayzEconomyManager } from \'../dayz/DayzEconomyManager\'\nimport { DayzWorkshopManager } from \'../dayz/DayzWorkshopManager\'\n';
content = content.replace(/(import \{ SteamCMDManager \} from '\.\.\/adapters\/SteamCMDManager'[\r\n]+)/, '$1' + newImports);

// 3. Remove DAYZ_MAP_REPOS
content = content.replace(/export const DAYZ_MAP_REPOS[\s\S]*?\};\r?\n/m, '');

// 4. Replace config IPCs
content = content.replace(/ipcMain\.handle\('read-dayz-config'[\s\S]*?ipcMain\.handle\('write-dayz-config'[\s\S]*?return false\r?\n\s+\}\)\r?\n/m, 
`ipcMain.handle('read-dayz-config', async (_, id) => {
    return await DayzConfigManager.readConfig(id);
  })

  ipcMain.handle('write-dayz-config', async (_, id, c) => {
    return await DayzConfigManager.writeConfig(id, c);
  })\n`);

// 5. Replace Economy IPCs
content = content.replace(/ipcMain\.handle\('get-dayz-economy'[\s\S]*?ipcMain\.handle\('update-dayz-economy'[\s\S]*?ipcMain\.handle\('wipe-dayz-loot'[\s\S]*?return false;\r?\n\s+\}\);\r?\n/m, 
`ipcMain.handle('get-dayz-economy', async (_, id) => {
    return await DayzEconomyManager.getEconomyConfig(id);
  });

  ipcMain.handle('update-dayz-economy', async (_, id, settings) => {
    return await DayzEconomyManager.updateEconomyConfig(id, settings);
  });

  ipcMain.handle('wipe-dayz-loot', async (_, id) => {
    // We pass activeServers[id] boolean directly since DayzEconomyManager has no access to activeServers
    return await DayzEconomyManager.wipeLoot(id, !!activeServers[id]);
  });\n`);

// Also need to remove 'async function fetchDayzMission(id: number, modId: string) { ... }' which might be caught in the middle.
content = content.replace(/async function fetchDayzMission[\s\S]*?return true;\r?\n\s+\}\r?\n/m, '');

// 6. Replace Mod IPCs
content = content.replace(/ipcMain\.handle\('search-steam-workshop'[\s\S]*?ipcMain\.handle\('uninstall-dayz-mod'[\s\S]*?return false;\r?\n\s+\}\);\r?\n/m, 
`ipcMain.handle('search-steam-workshop', async (_, query, queryType, page, requiredTags) => {
    return await DayzWorkshopManager.searchWorkshop(query, page, queryType, requiredTags);
  });

  ipcMain.handle('get-mod-dependencies', async (_, modId) => {
    return await DayzWorkshopManager.getModDependencies(modId);
  });

  ipcMain.handle('rebuild-mod-dependencies', async (_, id) => {
    return await DayzWorkshopManager.rebuildModDependencies(id);
  });

  ipcMain.handle('get-workshop-item-details', async (_, modIds) => {
    return await DayzWorkshopManager.getWorkshopItemDetails(modIds);
  });

  ipcMain.handle('get-dayz-installed-mods', async (_, id) => {
    return await DayzWorkshopManager.getInstalledMods(id);
  });

  ipcMain.handle('toggle-dayz-map-mod', async (_, id, folderName, isMap) => {
    return await DayzWorkshopManager.toggleMapMod(id, folderName, isMap);
  });

  ipcMain.handle('toggle-dayz-mod-status', async (_, id, folderName, isDisabled) => {
    return await DayzWorkshopManager.toggleModStatus(id, folderName, isDisabled);
  });

  ipcMain.handle('download-dayz-mission', async (_, id, modId) => {
    return await DayzWorkshopManager.fetchDayzMission(id, modId);
  });

  ipcMain.handle('extract-dayz-local-mission', async (_, id, localMissionsPath) => {
    return await DayzWorkshopManager.extractLocalMission(id, localMissionsPath);
  });

  ipcMain.handle('select-workshop-folder', async () => {
    return await DayzWorkshopManager.selectWorkshopFolder();
  });

  ipcMain.handle('import-local-workshop', async (_, id, workshopPath) => {
    return await DayzWorkshopManager.importLocalWorkshop(id, workshopPath);
  });

  ipcMain.handle('install-dayz-mods', async (_, id, modsToInstall, username, password, steamGuardCode) => {
    return await DayzWorkshopManager.installMods(id, modsToInstall, username, password, steamGuardCode);
  });

  ipcMain.handle('install-dayz-mod', async (_, id, modId, modTitle, username, password, steamGuardCode) => {
    return await DayzWorkshopManager.installMod(id, modId, modTitle, username, password, steamGuardCode);
  });

  ipcMain.handle('uninstall-dayz-mod', async (_, id, modIdOrFolder) => {
    return await DayzWorkshopManager.uninstallMod(id, modIdOrFolder);
  });\n`);

fs.writeFileSync(file, content);
console.log('Refactoring complete');

import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import fsPromises from 'fs/promises'
import axios from 'axios'
import semver from 'semver'
import os from 'os'

// Import our custom modules
import { getServers, createServer, deleteServer, updateServerSoftware } from './db'
import { MinecraftAdapter } from './adapters/MinecraftAdapter'
import { WakeProxy } from './adapters/WakeProxy'
import { FrpAdapter } from './adapters/FrpAdapter'
import { JavaManager } from './adapters/JavaManager'
import { spawn } from 'child_process'
import extractZip from 'extract-zip'
import { CacheManager } from './CacheManager';


async function exists(path: string) {
  try {
    await fsPromises.access(path);
    return true;
  } catch {
    return false;
  }
}

import * as dotenv from 'dotenv';
dotenv.config();
const CURSEFORGE_API_KEY = process.env.CURSEFORGE_API_KEY || '';

// Set app data to be stored locally in the repo for full portability
app.setPath('userData', join(process.cwd(), '.omnihost-data'));

// Fix Windows UI freeze/hang issues with Framer Motion without disabling hardware acceleration entirely
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Disable DevTools in production
  if (app.isPackaged) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });
  }

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // --- 1. INITIALIZE SYSTEMS ---
  const activeServers: Record<number, MinecraftAdapter> = {};
  const activeProxies: Record<number, WakeProxy> = {};
  const tunnelProvider = new FrpAdapter();

  // --- 2. IPC HANDLERS (THE BRIDGE) ---
  
  // Database
  ipcMain.handle('get-servers', () => {
    return getServers()
  })

  ipcMain.handle('delete-server', async (_, id) => {
    deleteServer(id);
    if (activeServers[id]) {
      activeServers[id].stop();
      delete activeServers[id];
    }
    const serversDir = join(app.getPath('userData'), 'servers');
    const srvDir = join(serversDir, id.toString());
    if (await exists(srvDir)) await fsPromises.rm(srvDir, { recursive: true, force: true });
    return true;
  });

  ipcMain.handle('create-server', async (_, name, type, version) => {
    const id = createServer(name, type);
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    if (!await exists(serverDir)) await fsPromises.mkdir(serverDir, { recursive: true });
    await fsPromises.writeFile(join(serverDir, 'omnihost.json'), JSON.stringify({ type, version }));
    return id;
  })

  ipcMain.handle('change-server-software', async (_, id, type, version) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    const modsDir = join(serverDir, 'mods');
    
    // Rename old mods folder to prevent compatibility issues
    if (fs.existsSync(modsDir)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.renameSync(modsDir, join(serverDir, `mods_old_${timestamp}`));
    }

    // Cleanup old startup scripts and modloader jars to prevent booting the wrong software
    const cleanupFiles = ['run.bat', 'start.bat', 'run.sh', 'start.sh', 'user_jvm_args.txt'];
    for (const file of cleanupFiles) {
      const p = join(serverDir, file);
      if (fs.existsSync(p)) fs.rmSync(p);
    }
    
    const allFiles = fs.readdirSync(serverDir);
    for (const file of allFiles) {
      if ((file.startsWith('forge-') || file.startsWith('neoforge-')) && file.endsWith('.jar')) {
        fs.rmSync(join(serverDir, file));
      }
    }

    // Update omnihost.json
    fs.writeFileSync(join(serverDir, 'omnihost.json'), JSON.stringify({ type, version }));
    
    // Update DB
    updateServerSoftware(id, type);

    return true;
  })

  // Versions & Downloads
  ipcMain.handle('get-vanilla-versions', async () => {
    try {
      const res = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
      const releases = res.data.versions.filter((v: any) => v.type === 'release');
      return releases.map((v: any) => v.id).filter((v: string) => {
        const coerced = semver.coerce(v);
        return coerced && semver.gte(coerced, '1.16.0');
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  ipcMain.handle('get-paper-versions', async () => {
    try {
      const res = await axios.get('https://fill.papermc.io/v3/projects/paper', { headers: { 'User-Agent': 'OmniHost/1.0.0 (contact@example.com)' } });
      const versionsObj = res.data.versions;
      let allVersions: string[] = [];
      for (const key of Object.keys(versionsObj)) {
        allVersions = allVersions.concat(versionsObj[key]);
      }
      return allVersions.filter((v: string) => {
        const coerced = semver.coerce(v);
        return coerced && semver.gte(coerced, '1.16.0');
      }).sort((a, b) => {
        const cA = semver.coerce(a);
        const cB = semver.coerce(b);
        return (cA && cB) ? semver.rcompare(cA, cB) : 0;
      }); // newest first
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  ipcMain.handle('get-fabric-versions', async () => {
    try {
      const res = await axios.get('https://meta.fabricmc.net/v2/versions/game');
      return res.data.filter((v: any) => v.stable).map((v: any) => v.version);
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  ipcMain.handle('get-forge-versions', async () => {
    try {
      const res = await axios.get('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
      const promos = res.data.promos;
      const versions = new Set<string>();
      for (const key of Object.keys(promos)) {
        if (key.endsWith('-latest')) {
          versions.add(key.replace('-latest', ''));
        }
      }
      return Array.from(versions).reverse();
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  ipcMain.handle('get-neoforge-versions', async () => {
    try {
      const res = await axios.get('https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge');
      const all: string[] = res.data.versions;
      const mcVersions = new Set<string>();
      for (const v of all) {
        const parts = v.split('.');
        if (parts.length >= 2) {
          if (parts[0] === '20' || parts[0] === '21') {
            mcVersions.add('1.' + parts[0] + '.' + parts[1]);
          } else {
            mcVersions.add(parts[0] + '.' + parts[1]);
          }
        }
      }
      return Array.from(mcVersions).reverse();
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  ipcMain.handle('search-modpacks', async (_, query, version, modloader) => {
    try {
      let url = `https://api.curseforge.com/v1/mods/search?gameId=432&classId=4471&sortField=2&sortOrder=desc`;
      if (query) url += `&searchFilter=${encodeURIComponent(query)}`;
      if (version) {
        const cfVersion = version.endsWith('.0') && version.split('.').length === 3 ? version.slice(0, -2) : version;
        url += `&gameVersion=${encodeURIComponent(cfVersion)}`;
      }
      if (modloader) {
        if (modloader === 'Forge') url += '&modLoaderType=1';
        else if (modloader === 'Fabric') url += '&modLoaderType=4';
        else if (modloader === 'NeoForge') url += '&modLoaderType=6';
      }
      
      const res = await axios.get(url, { headers: { 'x-api-key': CURSEFORGE_API_KEY } });
      return res.data.data;
    } catch (e: any) {
      console.error('Error searching modpacks:', e.message);
      return [];
    }
  });

  ipcMain.handle('get-modpack-details', async (_, modId) => {
    try {
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}`, { headers: { 'x-api-key': CURSEFORGE_API_KEY } });
      return res.data.data;
    } catch (e: any) {
      console.error(e.message);
      return null;
    }
  });

  
  
  ipcMain.handle('toggle-auto-start', async (_, id, enabled) => {
    try {
      if (enabled) {
        if (!activeServers[id]) activeServers[id] = new MinecraftAdapter(id);
        const serverDir = join(app.getPath('userData'), 'servers', id.toString());
        const propsPath = join(serverDir, 'server.properties');
        let port = 25565;
        if (await exists(propsPath)) {
          const props = await fsPromises.readFile(propsPath, 'utf-8');
          const portMatch = props.match(/server-port=(\d+)/);
          if (portMatch) port = parseInt(portMatch[1], 10);
        }
        
        if (!activeProxies[id]) {
          activeProxies[id] = new WakeProxy(activeServers[id], port);
        }
        activeProxies[id].startListening();
      } else {
        if (activeProxies[id]) {
          activeProxies[id].stopListening();
          delete activeProxies[id];
        }
      }
      return true;
    } catch (e: any) {
      console.error('WakeProxy error:', e);
      return false;
    }
  });

  ipcMain.handle('get-system-info', () => {
    return {
      totalMem: os.totalmem(),
      cpus: os.cpus().length
    };
  });

  
  ipcMain.handle('update-server-meta', async (_, id, changes) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    const metaPath = join(serverDir, 'omnihost.json');
    let meta = {};
    if (fs.existsSync(metaPath)) {
      try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')); } catch(e){}
    }
    meta = { ...meta, ...changes };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    
    // Live update the running instance
    if (activeServers[id]) {
      activeServers[id].omnihostMeta = meta;
    }
    return true;
  });


  ipcMain.handle('get-server-meta', async (_, id) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    const metaPath = join(serverDir, 'omnihost.json');
    if (await exists(metaPath)) {
      try {
        return JSON.parse(await fsPromises.readFile(metaPath, 'utf-8'));
      } catch (e) {}
    }
    return null;
  });

  ipcMain.handle('search-curseforge-mods', async (_, search, type, version, page, classId = 6, sortField = 2) => {
    try {
      let modLoaderType = 0;
      if (type === 'Forge') modLoaderType = 1;
      else if (type === 'Fabric') modLoaderType = 4;
      else if (type === 'NeoForge') modLoaderType = 6;
      
      const index = page * 20;
      const cfVersion = version.endsWith('.0') && version.split('.').length === 3 ? version.slice(0, -2) : version;
      let url = `https://api.curseforge.com/v1/mods/search?gameId=432&classId=${classId}&sortField=${sortField}&sortOrder=desc&gameVersion=${cfVersion}&index=${index}&pageSize=20`;
      
      // Only apply modLoaderType for the "Mods" class (id 6)
      if (classId === 6 && modLoaderType !== 0) {
        url += `&modLoaderType=${modLoaderType}`;
      }
      
      if (search) url += `&searchFilter=${encodeURIComponent(search)}`;
      
      const res = await axios.get(url, { headers: { 'x-api-key': CURSEFORGE_API_KEY } });
      return res.data.data;
    } catch (e: any) {
      console.error(e.message);
      return [];
    }
  });

  ipcMain.handle('get-curseforge-mod', async (_, modId) => {
    try {
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}`, { headers: { 'x-api-key': CURSEFORGE_API_KEY } });
      return res.data.data;
    } catch (e: any) {
      console.error(e.message);
      return null;
    }
  });

  ipcMain.handle('get-curseforge-file', async (_, modId, fileId) => {
    try {
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}/files/${fileId}`, { headers: { 'x-api-key': CURSEFORGE_API_KEY } });
      return res.data.data;
    } catch (e: any) {
      console.error(e.message);
      return null;
    }
  });

  ipcMain.handle('install-curseforge-mod', async (_, id, downloadUrl, fileName, classId = 6) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      
      let destFolder = 'mods';
      if (classId === 5) destFolder = 'plugins';
      else if (classId === 6945) destFolder = join('world', 'datapacks');
      else if (classId === 12) destFolder = 'resourcepacks';

      const targetDir = join(serverDir, destFolder);
      if (!await exists(targetDir)) {
        await fsPromises.mkdir(targetDir, { recursive: true });
      }
      
      const filePath = join(targetDir, fileName);
      const cachedFile = await CacheManager.getOrDownload('mods', downloadUrl, fileName);
      await fsPromises.copyFile(cachedFile, filePath);

      return true;
    } catch (e: any) {
      console.error(e.message);
      return false;
    }
  });

  ipcMain.handle('get-installed-mods', async (_, id) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const modsDir = join(serverDir, 'mods');
      if (!await exists(modsDir)) return [];
      
      const files = await fsPromises.readdir(modsDir);
      const jarFiles = files.filter(f => f.endsWith('.jar'));
      const modsInfo = await Promise.all(jarFiles.map(async f => {
        const stats = await fsPromises.stat(join(modsDir, f));
        return { name: f, size: stats.size };
      }));
      return modsInfo;
    } catch (e: any) {
      console.error(e.message);
      return [];
    }
  });

  ipcMain.handle('delete-mod', async (_, id, fileName) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const filePath = join(serverDir, 'mods', fileName);
      if (await exists(filePath)) {
        await fsPromises.unlink(filePath);
        return true;
      }
      return false;
    } catch (e: any) {
      console.error(e.message);
      return false;
    }
  });

  ipcMain.handle('install-curseforge-modpack', async (event, id, modId, version) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    
    try {
      event.sender.send(`download-progress-${id}`, 0, 'Fetching pack details...');
      
      const filesRes = await axios.get(`https://api.curseforge.com/v1/mods/${modId}/files`, { headers: { 'x-api-key': CURSEFORGE_API_KEY } });
      const allFiles: any[] = filesRes.data.data;
      
      // Try to find the latest file for the requested version
      let match = allFiles.filter(f => f.gameVersions.includes(version));
      if (match.length === 0) match = allFiles; // Fallback to latest
      
      match.sort((a, b) => new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime());
      
      let targetFile = match[0];
      let isServerPack = false;
      
      if (targetFile.serverPackFileId) {
        const serverFile = allFiles.find(f => f.id === targetFile.serverPackFileId);
        if (serverFile) {
          targetFile = serverFile;
          isServerPack = true;
        } else {
          try {
             const singleRes = await axios.get(`https://api.curseforge.com/v1/mods/${modId}/files/${targetFile.serverPackFileId}`, { headers: { 'x-api-key': CURSEFORGE_API_KEY } });
             targetFile = singleRes.data.data;
             isServerPack = true;
          } catch(e) {}
        }
      } else if (targetFile.fileName.toLowerCase().includes('server')) {
        isServerPack = true;
      }
      
      if (!targetFile.downloadUrl) throw new Error('Modpack file does not expose a direct download URL.');
      
      event.sender.send(`download-progress-${id}`, 0, `Downloading ${isServerPack ? 'Server Pack' : 'Client Pack'}...`);

      const zipPath = join(serverDir, 'modpack.zip');
      const cachedFile = await CacheManager.getOrDownload(
        'modpacks', 
        targetFile.downloadUrl, 
        targetFile.fileName, 
        (progress, text) => {
          event.sender.send(`download-progress-${id}`, progress, isServerPack ? (text === 'Downloading...' ? 'Downloading Server Pack...' : text) : (text === 'Downloading...' ? 'Downloading Client Pack...' : text));
        }
      );
      
      await fsPromises.copyFile(cachedFile, zipPath);
      
      event.sender.send(`download-progress-${id}`, 100, 'Extracting pack...');
      
      await extractZip(zipPath, { dir: serverDir });
      await fsPromises.unlink(zipPath);

      let overridesDir = join(serverDir, 'overrides');
      let modloader = 'Forge';
      
      if (isServerPack) {
        // Find if extracted into a subfolder
        const files = await fsPromises.readdir(serverDir);
        if (files.length === 2 && files.includes('omnihost.json')) {
           const sub = files.find(f => f !== 'omnihost.json');
           if (sub && (await fsPromises.stat(join(serverDir, sub))).isDirectory()) {
               const subPath = join(serverDir, sub);
               for (const subFile of await fsPromises.readdir(subPath)) {
                  await fsPromises.rename(join(subPath, subFile), join(serverDir, subFile));
               }
               await fsPromises.rmdir(subPath);
           }
        }
        event.sender.send(`download-progress-${id}`, 100, 'Server Pack Extracted! Installing Modloader if needed...');
        
        // Search for Forge or NeoForge installer in the extracted files and run it
        const extracted = await fsPromises.readdir(serverDir);
        const installer = extracted.find(f => (f.startsWith('forge-') || f.startsWith('neoforge-')) && f.includes('installer') && f.endsWith('.jar'));
        if (installer) {
           let javaRequired: 8 | 16 | 17 | 21 | 25 = 17;
           const coerced = semver.coerce(version);
           if (coerced) {
             if (semver.lt(coerced, '1.17.0')) javaRequired = 8;
             else if (semver.lt(coerced, '1.18.0')) javaRequired = 16;
             else if (semver.lt(coerced, '1.20.5')) javaRequired = 17;
             else if (semver.lt(coerced, '26.0.0')) javaRequired = 21;
             else javaRequired = 25;
           }
           const javaPath = await JavaManager.getJavaPath(javaRequired);
           await new Promise((resolve, reject) => {
             const proc = spawn(javaPath, ['-jar', installer, '--installServer'], { cwd: serverDir, stdio: 'inherit' });
             proc.on('close', resolve);
             proc.on('error', reject);
           });
           await fsPromises.unlink(join(serverDir, installer));
        }
      } else {
         event.sender.send(`download-progress-${id}`, 100, 'Parsing manifest and downloading mods...');
         const manifestPath = join(serverDir, 'manifest.json');
         if (!await exists(manifestPath)) throw new Error('Invalid Client Pack: Missing manifest.json');
         
         const manifest = JSON.parse(await fsPromises.readFile(manifestPath, 'utf-8'));
         const modsDir = join(serverDir, 'mods');
         if (!await exists(modsDir)) await fsPromises.mkdir(modsDir);
         
         const modFiles = manifest.files || [];
         let count = 0;
         for (const mod of modFiles) {
           count++;
           event.sender.send(`download-progress-${id}`, Math.round((count/modFiles.length)*100), `Downloading Mods (${count}/${modFiles.length})...`);
           try {
             const fRes = await axios.get(`https://api.curseforge.com/v1/mods/${mod.projectID}/files/${mod.fileID}/download-url`, { headers: { 'x-api-key': CURSEFORGE_API_KEY } });
             let dUrl = fRes.data.data;
             if (!dUrl) {
                const manualRes = await axios.get(`https://api.curseforge.com/v1/mods/${mod.projectID}/files/${mod.fileID}`, { headers: { 'x-api-key': CURSEFORGE_API_KEY } });
                dUrl = manualRes.data.data.downloadUrl;
             }
             if (dUrl) {
                const nameParts = dUrl.split('/');
                const fileName = decodeURIComponent(nameParts[nameParts.length - 1]);
                const cachedOverride = await CacheManager.getOrDownload('mods', dUrl, fileName);
                await fsPromises.copyFile(cachedOverride, join(modsDir, fileName));
             }
           } catch(e) { console.error('Failed to download mod', mod.projectID); }
         }
         
         if (await exists(overridesDir)) {
           const cp = require('child_process');
           if (process.platform === 'win32') {
               cp.execSync(`xcopy "${overridesDir}\\*" "${serverDir}\\" /s /e /y`);
           } else {
               cp.execSync(`cp -r "${overridesDir}/"* "${serverDir}/"`);
           }
           await fsPromises.rm(overridesDir, { recursive: true, force: true });
         }
         
         if (manifest.minecraft.modLoaders && manifest.minecraft.modLoaders.length > 0) {
            const mlId = manifest.minecraft.modLoaders[0].id.toLowerCase();
            if (mlId.includes('fabric')) modloader = 'Fabric';
            else if (mlId.includes('neoforge')) modloader = 'NeoForge';
         }
         
         const configPath = join(serverDir, 'omnihost.json');
         if (await exists(configPath)) {
            const conf = JSON.parse(await fsPromises.readFile(configPath, 'utf-8'));
            conf.type = modloader;
            await fsPromises.writeFile(configPath, JSON.stringify(conf, null, 2));
         }
      }
      
      return { isClientPack: !isServerPack, modloader: !isServerPack ? modloader : undefined, version };
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message);
    }
  });

  ipcMain.handle('download-server-jar', async (event, id, type, version) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    const jarPath = join(serverDir, 'server.jar');
    const installerPath = join(serverDir, 'installer.jar');
    
    try {
      let downloadUrl = '';
      let isInstaller = false;
      let installerArgs: string[] = [];

      if (type === 'Vanilla') {
        const manifestRes = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
        const vData = manifestRes.data.versions.find((v: any) => v.id === version);
        if (!vData) throw new Error('Version not found');
        const vRes = await axios.get(vData.url);
        downloadUrl = vRes.data.downloads.server.url;
      } else if (type === 'Paper') {
        const buildsRes = await axios.get(`https://fill.papermc.io/v3/projects/paper/versions/${version}`, { headers: { 'User-Agent': 'OmniHost/1.0.0 (contact@example.com)' } });
        const build = buildsRes.data.builds[buildsRes.data.builds.length - 1];
        const buildData = await axios.get(`https://fill.papermc.io/v3/projects/paper/versions/${version}/builds/${build}`, { headers: { 'User-Agent': 'OmniHost/1.0.0 (contact@example.com)' } });
        downloadUrl = buildData.data.downloads['server:default'].url;
      } else if (type === 'Fabric') {
        const loaderRes = await axios.get('https://meta.fabricmc.net/v2/versions/loader');
        const loader = loaderRes.data.find((v: any) => v.stable).version;
        const installerRes = await axios.get('https://meta.fabricmc.net/v2/versions/installer');
        const installer = installerRes.data.find((v: any) => v.stable).version;
        downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/${loader}/${installer}/server/jar`;
      } else if (type === 'Forge') {
        const forgeRes = await axios.get('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
        let forgeVersion = forgeRes.data.promos[version + '-latest'] || forgeRes.data.promos[version + '-recommended'];
        if (!forgeVersion) throw new Error('Forge version not found for ' + version);
        downloadUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${version}-${forgeVersion}/forge-${version}-${forgeVersion}-installer.jar`;
        isInstaller = true;
        installerArgs = ['--installServer'];
      } else if (type === 'NeoForge') {
        const neoRes = await axios.get('https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge');
        const all: string[] = neoRes.data.versions;
        let prefix = version.startsWith('1.') ? version.substring(2) : version;
        const matched = all.filter((v: string) => v.startsWith(prefix + '.')).sort((a: string, b: string) => semver.rcompare(semver.coerce(a)!, semver.coerce(b)!));
        if (matched.length === 0) throw new Error('NeoForge version not found for ' + version);
        const neoVersion = matched[0];
        downloadUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVersion}/neoforge-${neoVersion}-installer.jar`;
        isInstaller = true;
        installerArgs = ['--installServer'];
      }

      if (!downloadUrl) throw new Error('Could not resolve download URL');

      const targetPath = isInstaller ? installerPath : jarPath;
      const fileName = `${type}-${version}${isInstaller ? '-installer' : ''}.jar`;
      const cachedFile = await CacheManager.getOrDownload(
        'jars', 
        downloadUrl, 
        fileName, 
        (progress, text) => {
          event.sender.send(`download-progress-${id}`, progress, isInstaller ? (text === 'Downloading...' ? 'Downloading Installer...' : text) : (text === 'Downloading...' ? 'Downloading Jar...' : text));
        }
      );
      
      await fsPromises.copyFile(cachedFile, targetPath);

      if (isInstaller) {
        event.sender.send(`download-progress-${id}`, 100, 'Installing Modloader...');
        
        let javaRequired: 8 | 16 | 17 | 21 | 25 = 17;
        const coerced = semver.coerce(version);
        if (coerced) {
          if (semver.lt(coerced, '1.17.0')) javaRequired = 8;
          else if (semver.lt(coerced, '1.18.0')) javaRequired = 16;
          else if (semver.lt(coerced, '1.20.5')) javaRequired = 17;
          else if (semver.lt(coerced, '26.0.0')) javaRequired = 21;
          else javaRequired = 25;
        }

        const javaPath = await JavaManager.getJavaPath(javaRequired);
        
        await new Promise((resolve, reject) => {
          const proc = spawn(javaPath, ['-jar', 'installer.jar', ...installerArgs], { cwd: serverDir, stdio: 'inherit' });
          proc.on('close', (code) => {
            if (code === 0) resolve(true);
            else reject(new Error('Installer failed with code ' + code));
          });
          proc.on('error', reject);
        });

        if (await exists(installerPath)) {
          await fsPromises.unlink(installerPath);
        }
      }

      return true;
    } catch (e: any) {
      console.error(e);
      throw new Error(e.message);
    }
  });

  // Server Lifecycle
  ipcMain.handle('start-server', async (_, id) => {
    if (!activeServers[id]) {
      activeServers[id] = new MinecraftAdapter(id);
    }
    
    // CRITICAL: Stop proxy if it exists to free the port!
    if (activeProxies[id]) {
       activeProxies[id].stopListening();
    }
    
    await activeServers[id].start();
    return true;
  });

  ipcMain.handle('stop-server', async (_, id) => {
    if (activeServers[id]) {
      activeServers[id].stop();
      delete activeServers[id];
    }
    return true;
  });

  // Tunnels
  ipcMain.handle('start-tunnel', async (_, ip: string) => {
    await tunnelProvider.start(ip);
    return true;
  });

  ipcMain.handle('stop-tunnel', () => {
    tunnelProvider.stop();
    return true;
  });

  // Config Editor
  ipcMain.handle('read-config', async (_, id) => {
    const configPath = join(app.getPath('userData'), 'servers', id.toString(), 'server.properties');
    if (await exists(configPath)) return await fsPromises.readFile(configPath, 'utf-8');
    return '# No server.properties found.\n# Start the server once to generate this file automatically!';
  });

  ipcMain.handle('write-config', async (_, id, data) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    if (!await exists(serverDir)) await fsPromises.mkdir(serverDir, { recursive: true });
    await fsPromises.writeFile(join(serverDir, 'server.properties'), data);
    return true;
  });

  // Player JSON Editor
  ipcMain.handle('read-json', async (_, id, filename) => {
    const filePath = join(app.getPath('userData'), 'servers', id.toString(), `${filename}.json`);
    if (await exists(filePath)) return JSON.parse(await fsPromises.readFile(filePath, 'utf-8'));
    return [];
  });

  ipcMain.handle('write-json', async (_, id, filename, data) => {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString());
    if (!await exists(serverDir)) await fsPromises.mkdir(serverDir, { recursive: true });
    await fsPromises.writeFile(join(serverDir, `${filename}.json`), JSON.stringify(data, null, 2));
    return true;
  });

  // Live Commands & Inventory
  ipcMain.handle('send-command', async (_, id, cmd) => {
    if (activeServers[id]) activeServers[id].sendCommand(cmd);
    return true;
  });

  ipcMain.handle('get-inventory', async (_, id, playerName) => {
    if (activeServers[id]) {
      return await activeServers[id].getPlayerInventory(playerName);
    }
    return null;
  });

  
  // --- File Manager ---
  ipcMain.handle('list-dir', async (_, id, relPath) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      // Prevent directory traversal
      const targetPath = join(serverDir, relPath);
      if (!targetPath.startsWith(serverDir)) return [];
      
      if (!await exists(targetPath)) return [];
      
      const files = await fsPromises.readdir(targetPath);
      const result: any[] = [];
      for (const f of files) {
        try {
          const stat = await fsPromises.stat(join(targetPath, f));
          result.push({
            name: f,
            isDirectory: stat.isDirectory(),
            size: stat.size,
            lastModified: stat.mtimeMs
          });
        } catch (e) {}
      }
      return result;
    } catch (e: any) {
      console.error(e.message);
      return [];
    }
  });

  ipcMain.handle('delete-item', async (_, id, relPath) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const targetPath = join(serverDir, relPath);
      if (!targetPath.startsWith(serverDir) || targetPath === serverDir) return false;
      if (await exists(targetPath)) {
        await fsPromises.rm(targetPath, { recursive: true, force: true });
        return true;
      }
      return false;
    } catch (e: any) {
      console.error(e.message);
      return false;
    }
  });

  ipcMain.handle('read-file', async (_, id, relPath) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const targetPath = join(serverDir, relPath);
      if (!targetPath.startsWith(serverDir)) return null;
      if (await exists(targetPath)) {
        return await fsPromises.readFile(targetPath, 'utf-8');
      }
      return null;
    } catch (e: any) {
      console.error(e.message);
      return null;
    }
  });

  ipcMain.handle('write-file', async (_, id, relPath, content) => {
    try {
      const serverDir = join(app.getPath('userData'), 'servers', id.toString());
      const targetPath = join(serverDir, relPath);
      if (!targetPath.startsWith(serverDir)) return false;
      await fsPromises.writeFile(targetPath, content, 'utf-8');
      return true;
    } catch (e: any) {
      console.error(e.message);
      return false;
    }
  });

  ipcMain.handle('get-cache-info', () => {
    return CacheManager.getCacheSize();
  });

  ipcMain.handle('clear-cache', () => {
    CacheManager.clearCache();
    return true;
  });

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
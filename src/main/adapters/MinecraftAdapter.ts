import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import semver from 'semver'
import { JavaManager } from './JavaManager'
import pidusage from 'pidusage'

export class MinecraftAdapter {
  serverId: number;
  serverDir: string;
  process: ChildProcess | null = null;
  onlinePlayers: string[] = [];
  autoStopTimer: NodeJS.Timeout | null = null;
  statsTimer: NodeJS.Timeout | null = null;
  omnihostMeta: any = {}; 

  constructor(serverId: number) {
    this.serverId = serverId;
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
  }

  sendLog(msg: string) {
    console.log(msg); // Guaranteed VS Code output!
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('console-log', msg);
    });
  }

  sendPlayerUpdate() {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('online-players', { id: this.serverId, players: this.onlinePlayers });
    });
  }

  sendCommand(cmd: string) {
    if (this.process && this.process.stdin) {
      this.process.stdin.write(cmd + '\n');
      this.sendLog(`> ${cmd}`); 
    } else {
      this.sendLog(`[System] Cannot send command: Server is offline.`);
    }
  }

  async getPlayerInventory(playerName: string) {
    try {
      this.sendCommand('save-all flush');
      await new Promise(r => setTimeout(r, 200));

      const cachePath = join(this.serverDir, 'usercache.json');
      if (!fs.existsSync(cachePath)) return null;
      
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      const playerEntry = cache.find((p: any) => p.name.toLowerCase() === playerName.toLowerCase());
      if (!playerEntry) return null;

      const datPath = join(this.serverDir, 'world', 'playerdata', `${playerEntry.uuid}.dat`);
      if (!fs.existsSync(datPath)) return null;

      const buffer = fs.readFileSync(datPath);
      
      // Clean NBT Require (Fixes the deprecation warning in the terminal!)
      const libName = 'prismarine-nbt';
      const nbt = require(libName);
      const { parsed } = await nbt.parse(buffer);
      
      const inventory = parsed.value.Inventory?.value?.value || [];
      return inventory.map((item: any) => ({
        slot: item.Slot.value,
        id: item.id.value.replace('minecraft:', ''),
        count: item.Count.value
      }));
    } catch (err: any) {
      this.sendLog(`[System] Inventory Error: ${err.message}`);
      return null;
    }
  }

  async init() {
    if (!fs.existsSync(this.serverDir)) fs.mkdirSync(this.serverDir, { recursive: true });
    
    // Auto-accept EULA
    fs.writeFileSync(join(this.serverDir, 'eula.txt'), 'eula=true\n');
  }

  async updatePlayerStats(username: string, isJoin: boolean) {
    const statsPath = join(this.serverDir, 'player-stats.json');
    let stats: any = {};
    if (fs.existsSync(statsPath)) {
      try {
        stats = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      } catch (e) {}
    }
    
    if (!stats[username]) {
      stats[username] = {
        username,
        firstJoin: Date.now(),
        lastLeft: null,
        totalPlaytime: 0
      };
    }

    if (isJoin) {
      stats[username].currentSessionStart = Date.now();
      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
    } else {
      const joinTime = stats[username].currentSessionStart;
      if (joinTime) {
        const duration = Date.now() - joinTime;
        stats[username].totalPlaytime += duration;
        stats[username].currentSessionStart = null;
      }
      stats[username].lastLeft = Date.now();

      try {
        const cachePath = join(this.serverDir, 'usercache.json');
        if (fs.existsSync(cachePath)) {
          const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
          const playerEntry = cache.find((p: any) => p.name.toLowerCase() === username.toLowerCase());
          if (playerEntry) {
            const datPath = join(this.serverDir, 'world', 'playerdata', `${playerEntry.uuid}.dat`);
            if (fs.existsSync(datPath)) {
              const buffer = fs.readFileSync(datPath);
              const nbt = require('prismarine-nbt');
              const { parsed } = await nbt.parse(buffer);
              const pos = parsed.value.Pos?.value?.value || [];
              if (pos.length === 3) {
                 stats[username].logoffPosition = { x: Math.round(pos[0]), y: Math.round(pos[1]), z: Math.round(pos[2]) };
              }
            }
          }
        }
      } catch (err) {
        this.sendLog(`[System] Error getting position for ${username}: ${err}`);
      }

      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
    }
  }

  async start() {
    await this.init();
    this.onlinePlayers = []; 
    this.sendPlayerUpdate();
    
    this.sendLog(`[System] Starting Server ${this.serverId}...`);

    const metaPath = join(this.serverDir, 'omnihost.json');
    let version = '1.20.4';
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        this.omnihostMeta = meta;
        if (meta.version) version = meta.version;
      } catch(e) {}
    }

    let javaRequired: 8 | 16 | 17 | 21 | 25 = 17;
    const coerced = semver.coerce(version);
    if (coerced) {
      if (semver.lt(coerced, '1.17.0')) javaRequired = 8;
      else if (semver.lt(coerced, '1.18.0')) javaRequired = 16;
      else if (semver.lt(coerced, '1.20.5')) javaRequired = 17;
      else if (semver.lt(coerced, '26.0.0')) javaRequired = 21;
      else javaRequired = 25;
    }

    let javaPath = 'java';
    try {
      let lastPercent = -1;
      javaPath = await JavaManager.getJavaPath(javaRequired, (percent) => {
        if (percent - lastPercent >= 25 || percent === 100) {
           this.sendLog(`[System] Downloading Java ${javaRequired}: ${percent}%`);
           lastPercent = percent;
        }
      });
    } catch (err: any) {
      this.sendLog(`[System] Warning: Failed to download dynamic Java (${err.message}). Falling back to system java.`);
    }

    const jarPath = join(this.serverDir, 'server.jar');
    const runBatPath = join(this.serverDir, 'run.bat');
    const startBatPath = join(this.serverDir, 'start.bat');
    
    let targetExecutable = javaPath;
    const ramLimit = this.omnihostMeta.ram ? `-Xmx${this.omnihostMeta.ram}G` : '-Xmx2G';
    const minRam = this.omnihostMeta.ram ? `-Xms${this.omnihostMeta.ram}G` : '-Xms2G';
    
    // Minimum of 4 cores to prevent World Gen NPE in modern Minecraft
    const safeCpuLimit = this.omnihostMeta.cpu ? Math.max(4, parseInt(this.omnihostMeta.cpu)) : null;
    const cpuLimit = safeCpuLimit ? `-XX:ActiveProcessorCount=${safeCpuLimit}` : '';
    let targetArgs = [ramLimit, minRam, '-jar', 'server.jar', 'nogui'];
    if (cpuLimit) targetArgs.splice(2, 0, cpuLimit);
    let env = { ...process.env };

    if (javaPath !== 'java') {
      const pathModule = require('path');
      const javaBinDir = pathModule.dirname(javaPath);
      env.PATH = `${javaBinDir};${process.env.PATH}`;
      env.JAVA_HOME = pathModule.dirname(javaBinDir);
    }

    if (fs.existsSync(runBatPath)) {
      targetExecutable = 'cmd.exe';
      targetArgs = ['/c', 'run.bat', 'nogui'];
    } else if (fs.existsSync(startBatPath)) {
      targetExecutable = 'cmd.exe';
      targetArgs = ['/c', 'start.bat', 'nogui'];
    } else {
      const files = fs.readdirSync(this.serverDir);
      const forgeJar = files.find(f => (f.startsWith('forge-') || f.startsWith('neoforge-')) && f.endsWith('.jar') && !f.includes('installer'));
      if (forgeJar) {
        targetArgs = [ramLimit, minRam];
        if (cpuLimit) targetArgs.push(cpuLimit);
        targetArgs.push('-jar', forgeJar, 'nogui');
      } else if (!fs.existsSync(jarPath)) {
        this.sendLog(`[System Error] server.jar or modloader not found! Please delete and recreate this server.`);
        return;
      }
    }

    this.sendLog(`[System] Launching Java with args: ${targetArgs.join(' ')}`);
    this.process = spawn(targetExecutable, targetArgs, { cwd: this.serverDir, env });

    if (this.process.pid) {
      this.statsTimer = setInterval(async () => {
        if (!this.process || !this.process.pid) return;
        try {
          const stats = await pidusage(this.process.pid);
          BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) win.webContents.send('server-stats', {
              id: this.serverId,
              cpu: stats.cpu,
              ram: stats.memory
            });
          });
        } catch (e) {
          // PID might not exist anymore
        }
      }, 2000);
    }

    const readline = require('readline');
    if (this.process.stdout) {
      const rl = readline.createInterface({ input: this.process.stdout, terminal: false });
      rl.on('line', (line: string) => {
        const rawText = line.trim();
        const cleanText = rawText.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
        if (!cleanText) return;

        this.sendLog(`[Minecraft]: ${cleanText}`);

        const joinMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) joined the game/);
        if (joinMatch) {
          if (!this.onlinePlayers.includes(joinMatch[1])) {
            this.onlinePlayers.push(joinMatch[1]);
            this.updatePlayerStats(joinMatch[1], true);
            this.sendPlayerUpdate();
          }
        }
        const leaveMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) left the game/);
        if (leaveMatch) {
          this.onlinePlayers = this.onlinePlayers.filter(p => p !== leaveMatch[1]);
          this.updatePlayerStats(leaveMatch[1], false);
          this.sendPlayerUpdate();
        }
      });
    }
    this.process.stderr?.on('data', (data) => this.sendLog(`[Minecraft Error]: ${data.toString().trim()}`));
  }

  stop() {
    if (this.process) {
      this.sendLog(`[System] Stopping Server ${this.serverId}...`);
      this.process.stdin?.write('stop\n');
      
      const p = this.process;
      this.process = null;
      if (this.autoStopTimer) clearTimeout(this.autoStopTimer);
      if (this.statsTimer) clearInterval(this.statsTimer);
      this.autoStopTimer = null;
      this.statsTimer = null;

      // Update stats for all players before clearing them
      for (const pName of this.onlinePlayers) {
        this.updatePlayerStats(pName, false);
      }
      
      this.onlinePlayers = []; 
      this.sendPlayerUpdate();

      // Force kill after 15 seconds if it hasn't gracefully exited
      setTimeout(() => {
        try {
          if (p.pid) {
            // Check if process is still alive
            process.kill(p.pid, 0);
            this.sendLog(`[System] Server took too long to stop. Force killing process tree...`);
            const { exec } = require('child_process');
            exec(`taskkill /pid ${p.pid} /T /F`, () => {});
          }
        } catch (e) {
          // Process already dead
        }
      }, 15000);
    }
  }
}
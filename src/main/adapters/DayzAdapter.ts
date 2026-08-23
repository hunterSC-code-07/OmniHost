import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'

export class DayzAdapter {
  serverId: number;
  serverDir: string;
  process: ChildProcess | null = null;
  onlinePlayers: string[] = [];
  autoStopTimer: NodeJS.Timeout | null = null;
  statsTimer: NodeJS.Timeout | null = null;
  omnihostMeta: any = {}; 
  
  private logWatcher: NodeJS.Timeout | null = null;
  private logFd: number | null = null;
  private lastLogPos: number = 0;
  private startTime: number = 0;
  private logBuffer: string = '';

  constructor(serverId: number) {
    this.serverId = serverId;
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
  }

  sendLog(msg: string) {
    console.log(msg); // Guaranteed VS Code output!
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('console-log', { id: this.serverId, msg });
    });
  }

  sendPlayerUpdate() {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('online-players', { id: this.serverId, players: this.onlinePlayers });
    });
  }

  sendCommand(cmd: string) {
    // Basic implementation (later use RCon/BEC for DayZ)
    this.sendLog(`[System] Sending commands to DayZ requires RCon setup (not yet implemented). Command: ${cmd}`);
  }

  async getPlayerInventory() {
    return null; // Stub for DayZ inventory
  }

  async init() {
    if (!fs.existsSync(this.serverDir)) fs.mkdirSync(this.serverDir, { recursive: true });
    
    // Auto-generate basic serverDZ.cfg if it doesn't exist
    const cfgPath = join(this.serverDir, 'serverDZ.cfg');
    if (!fs.existsSync(cfgPath)) {
      const defaultCfg = `BattlEye = 0;               // Disable BattlEye for proxy/FRP compatibility
steamQueryPort = 27016;     // Explicitly set Steam Query Port for FRP Tunnel
hostname = "OmniHost DayZ Server";  // Server name
password = "";              // Password to connect to the server
passwordAdmin = "";         // Password to become a server admin
maxPlayers = 60;            // Maximum amount of players
verifySignatures = 2;       // Verifies .pbos against .bisign files. (only 2 is supported)
forceSameBuild = 1;         // When enabled, the server will allow the connection only to clients with same the .exe revision as the server (value 0-1)
disableVoN = 0;             // Enable/disable voice over network (value 0-1)
vonCodecQuality = 20;       // Voice over network codec quality, the higher the better (values 0-30)
disable3rdPerson=0;         // Toggles the 3rd person view for players (value 0-1)
disableCrosshair=0;         // Toggles the cross-hair (value 0-1)
serverTime="SystemTime";    // Initial in-game time of the server. "SystemTime" means the local time of the machine. Another possibility is to set the time to some value in "YYYY/MM/DD/HH/MM" format, f.e. "2015/4/8/17/23"
serverTimeAcceleration=1;   // Accelerated Time (value 0-24)
serverNightTimeAcceleration=1; // Accelerated Nigh Time
serverTimePersistent=0;     // Persistent Time
guaranteedUpdates=1;        // Communication protocol used with game server (use only number 1)
loginQueueConcurrentPlayers=5; // The number of players concurrently processed during the login process.
loginQueueMaxPlayers=500;   // The maximum number of players that can wait in login queue
instanceId = 1;             // DayZ server instance id, to identify the number of instances per box and their storage folders with persistence files
storeHouseStateDisabled = false;// Disable houses/doors persistence (value true/false), usable in case of problems with persistence
storageAutoFix = 1;         // Checks if the persistence files are corrupted and replaces corrupted ones with empty ones (value 0-1)

class Missions
{
    class DayZ
    {
        template="dayzOffline.chernarusplus"; // Mission to load on server startup.
    };
};
`;
      fs.writeFileSync(cfgPath, defaultCfg);
    }
  }

  async updatePlayerStats() {
    // Stub for DayZ stats
  }

  async start() {
    await this.init();

    const exePath = join(this.serverDir, 'DayZServer_x64.exe');
    if (!fs.existsSync(exePath)) {
      this.sendLog(`[System] DayZ Server executable not found at ${exePath}. Did you finish the SteamCMD download?`);
      return;
    }

    this.sendLog('[System] Starting DayZ Server...');

    const args = [
      '-config=serverDZ.cfg',
      '-port=2302',
      '-profiles=Profiles',
      '-BEpath=BattlEye',
      '-dologs',
      '-adminlog',
      '-netlog',
      '-freezecheck'
    ];

    // Load mods
    try {
      const folders = fs.readdirSync(this.serverDir, { withFileTypes: true });
      let mods = folders
        .filter(f => (f.isDirectory() || f.isSymbolicLink()) && f.name.startsWith('@'))
        .filter(f => !fs.existsSync(join(this.serverDir, f.name, 'disabled.txt')))
        .map(f => f.name);

      const depsPath = join(this.serverDir, 'mod_dependencies.json');
      let modDeps: Record<string, string[]> = {};
      if (fs.existsSync(depsPath)) {
        try { modDeps = JSON.parse(fs.readFileSync(depsPath, 'utf8')); } catch (e) {}
      }

      // Map folder names to mod IDs
      const folderToId: Record<string, string> = {};
      const idToFolder: Record<string, string> = {};
      for (const folder of mods) {
        const modIdPath = join(this.serverDir, folder, 'modid.txt');
        if (fs.existsSync(modIdPath)) {
          const content = fs.readFileSync(modIdPath, 'utf-8');
          const modId = content.trim().split(':')[0];
          if (modId) {
            folderToId[folder] = modId;
            idToFolder[modId] = folder;
          }
        }
      }

      // Build graph
      const graph: Record<string, string[]> = {};
      const inDegree: Record<string, number> = {};
      
      mods.forEach(m => {
        graph[m] = [];
        inDegree[m] = 0;
      });

      mods.forEach(folder => {
        const modId = folderToId[folder];
        if (modId && modDeps[modId]) {
          modDeps[modId].forEach(depId => {
            const depFolder = idToFolder[depId];
            // If the dependency is installed and enabled, add an edge: depFolder -> folder
            if (depFolder && mods.includes(depFolder)) {
              graph[depFolder].push(folder);
              inDegree[folder]++;
            }
          });
        }
      });

      // Kahn's Algorithm
      const queue: string[] = [];
      
      // Force critical base mods to have precedence in queue if inDegree is 0
      const baseMods = ['@CF', '@CommunityOnlineTools', '@DabsFramework'];
      
      // Sort initial queue so base mods are processed first if they have 0 inDegree
      const initialZero = mods.filter(m => inDegree[m] === 0);
      initialZero.sort((a, b) => {
        const aIndex = baseMods.indexOf(a);
        const bIndex = baseMods.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b, undefined, { sensitivity: 'base' });
      });
      queue.push(...initialZero);

      const sortedMods: string[] = [];
      while (queue.length > 0) {
        const current = queue.shift()!;
        sortedMods.push(current);
        
        for (const neighbor of graph[current]) {
          inDegree[neighbor]--;
          if (inDegree[neighbor] === 0) {
            queue.push(neighbor);
          }
        }
      }

      // If there's a cycle, some mods won't be in sortedMods. Just append them alphabetically.
      if (sortedMods.length < mods.length) {
        const remaining = mods.filter(m => !sortedMods.includes(m));
        remaining.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        sortedMods.push(...remaining);
      }

      mods = sortedMods;
      
      if (mods.length > 0) {
        args.push(`"-mod=${mods.join(';')}"`);
        this.sendLog(`[System] Loading mods: ${mods.join(', ')}`);
      }
    } catch (e) {
      this.sendLog(`[System Error] Failed to load mods: ${e}`);
    }

    this.startTime = Date.now() - 5000; // Buffer of 5 seconds

    this.process = spawn(`"${exePath}"`, args, { cwd: this.serverDir, shell: true });

    this.process.stdout?.on('data', (data) => {
      this.sendLog(`[DayZ] ${data.toString().trim()}`);
    });

    this.process.stderr?.on('data', (data) => {
      this.sendLog(`[DayZ Error] ${data.toString().trim()}`);
    });

    this.setupLogWatcher();

    this.process.on('close', (code) => {
      this.sendLog(`[System] DayZ Server stopped (Code: ${code})`);
      this.cleanupLogWatcher();
      this.process = null;
      this.onlinePlayers = [];
      this.sendPlayerUpdate();
    });

    this.process.on('error', (err) => {
      this.sendLog(`[System Error] ${err.message}`);
    });
  }

  stop() {
    if (this.process) {
      this.sendLog('[System] Stopping DayZ Server...');
      if (this.process.pid) {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', this.process.pid.toString(), '/f', '/t']);
        } else {
          this.process.kill();
        }
      }
      this.process = null;
      this.cleanupLogWatcher();
    }
    
    this.onlinePlayers = [];
    this.sendPlayerUpdate();
  }

  private setupLogWatcher() {
    const profilesDir = join(this.serverDir, 'Profiles');
    this.sendLog(`[System] Initializing Log Watcher at: ${profilesDir}`);
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    this.pollForLogFile(profilesDir);
  }

  private pollForLogFile(profilesDir: string) {
    const checkFile = () => {
      if (!this.process) return; // Stop if server process exited
      
      try {
        let files = fs.readdirSync(profilesDir).filter(f => f.toLowerCase().endsWith('.adm'));
        // Only consider files created/modified AFTER the server started
        files = files.filter(f => fs.statSync(join(profilesDir, f)).mtimeMs > this.startTime);
        
        if (files.length > 0) {
          files.sort((a, b) => {
            return fs.statSync(join(profilesDir, b)).mtimeMs - fs.statSync(join(profilesDir, a)).mtimeMs;
          });
          const latestFile = join(profilesDir, files[0]);
          this.tailLogFile(latestFile);
        } else {
          setTimeout(checkFile, 2000);
        }
      } catch (e) {
        setTimeout(checkFile, 2000);
      }
    };
    setTimeout(checkFile, 2000);
  }

  private tailLogFile(filePath: string) {
    this.sendLog(`[System] Attaching to DayZ Admin Log: ${filePath}`);
    
    try {
      this.logFd = fs.openSync(filePath, 'r');
      this.lastLogPos = 0; // Read from start to catch existing players
      this.logBuffer = ''; // Clear buffer on new file
      this.readNewLogs();

      // Use setInterval instead of fs.watch for much faster and more reliable updates on Windows
      this.logWatcher = setInterval(() => {
        this.readNewLogs();
      }, 500);
    } catch (e) {
      this.sendLog(`[System Error] Failed to tail log: ${e}`);
    }
  }

  private readNewLogs() {
    if (this.logFd === null) return;
    try {
      const stats = fs.fstatSync(this.logFd);
      if (stats.size > this.lastLogPos) {
        const length = stats.size - this.lastLogPos;
        const buffer = Buffer.alloc(length);
        fs.readSync(this.logFd, buffer, 0, length, this.lastLogPos);
        this.lastLogPos = stats.size;
        
        const content = buffer.toString('utf8');
        this.logBuffer += content;
        
        let newlineIdx;
        while ((newlineIdx = this.logBuffer.indexOf('\n')) !== -1) {
          const line = this.logBuffer.substring(0, newlineIdx).trim();
          this.logBuffer = this.logBuffer.substring(newlineIdx + 1);
          
          if (line) {
            this.sendLog(`[DayZ] ${line}`);
            this.parseLogLine(line);
          }
        }
      }
    } catch (e) {}
  }

  private parseLogLine(line: string) {
    const connectedMatch = line.match(/Player "([^"]+)" .*?is connected/i);
    if (connectedMatch) {
      const pName = connectedMatch[1];
      if (!this.onlinePlayers.includes(pName)) {
        this.onlinePlayers.push(pName);
        this.sendPlayerUpdate();
      }
    }
    
    const disconnectedMatch = line.match(/Player "([^"]+)" .*?has been disconnected/i);
    if (disconnectedMatch) {
      const pName = disconnectedMatch[1];
      this.onlinePlayers = this.onlinePlayers.filter(p => p !== pName);
      this.sendPlayerUpdate();
    }
  }

  private cleanupLogWatcher() {
    if (this.logWatcher) {
      clearInterval(this.logWatcher);
      this.logWatcher = null;
    }
    if (this.logFd !== null) {
      fs.closeSync(this.logFd);
      this.logFd = null;
    }
  }
}

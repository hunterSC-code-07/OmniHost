import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import pidusage from 'pidusage';

export class SonsOfTheForestProcessManager {
  serverId: number;
  serverDir: string;
  process: ChildProcess | null = null;
  onlinePlayers: string[] = [];
  logHistory: string[] = [];
  statsTimer: NodeJS.Timeout | null = null;

  constructor(serverId: number) {
    this.serverId = serverId;
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
  }

  sendLog(msg: string) {
    console.log(msg); // Guaranteed VS Code output
    this.logHistory.push(msg);
    if (this.logHistory.length > 2000) this.logHistory.shift();

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
    if (!this.process || !this.process.stdin) {
      this.sendLog(`[System] Process not running or stdin not available, cannot send command: ${cmd}`);
      return;
    }
    
    // Send command via standard input
    this.process.stdin.write(cmd + '\n');
    this.sendLog(`[Command] > ${cmd}`);
  }

  async start() {
    const exePath = join(this.serverDir, 'SonsOfTheForestDS.exe');
    if (!fs.existsSync(exePath)) {
      this.sendLog(`[System] Sons of the Forest Server executable not found at ${exePath}. Did you finish the SteamCMD download?`);
      return;
    }

    const appIdPath = join(this.serverDir, 'steam_appid.txt');
    // Force write the Game AppID (1326470) instead of the Dedicated Server AppID (2465200)
    // otherwise the server crashes in SteamManager.Update ()
    fs.writeFileSync(appIdPath, '1326470');

    const cfgPath = join(this.serverDir, 'dedicatedserver.cfg');
    if (fs.existsSync(cfgPath)) {
      try {
        const cfgData = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
        let changed = false;
        
        if (cfgData.SkipNetworkAccessibilityTest !== true) {
          cfgData.SkipNetworkAccessibilityTest = true;
          changed = true;
        }
        
        if (cfgData.ServerSteamAccount === undefined) {
          cfgData.ServerSteamAccount = "";
          changed = true;
        }

        if (changed) {
          fs.writeFileSync(cfgPath, JSON.stringify(cfgData, null, 2));
        }
      } catch (e) {
        this.sendLog(`[System] Warning: Failed to parse or update dedicatedserver.cfg: ${e}`);
      }
    } else {
      // Create a default config with the test bypassed so it doesn't fail on first boot
      const defaultCfg = {
        "IpAddress": "0.0.0.0",
        "GamePort": 8766,
        "QueryPort": 27016,
        "BlobSyncPort": 9700,
        "ServerName": "Sons Of The Forest Server (dedicated)",
        "MaxPlayers": 8,
        "Password": "",
        "LanOnly": false,
        "SaveSlot": 1,
        "SaveMode": "Continue",
        "GameMode": "Normal",
        "SaveInterval": 600,
        "IdleDayCycleSpeed": 0.0,
        "IdleTargetFramerate": 5,
        "ActiveTargetFramerate": 60,
        "LogFilesEnabled": false,
        "TimestampLogFilenames": true,
        "TimestampLogEntries": true,
        "SkipNetworkAccessibilityTest": true,
        "ServerSteamAccount": "",
        "GameSettings": {},
        "CustomGameModeSettings": {}
      };
      fs.writeFileSync(cfgPath, JSON.stringify(defaultCfg, null, 2));
    }

    this.sendLog('[System] Starting Sons of the Forest Server...');

    const args = [
      '-batchmode',
      '-nographics',
      '-dedicated',
      '-userdatapath',
      this.serverDir
    ];

    this.process = spawn(exePath, args, { cwd: this.serverDir, shell: true });

    const ignorePatterns = [
      /No mesh data available for mesh/,
      /shader is not supported on this GPU/,
      /Shader Unsupported:/,
      /Did you use #pragma only_renderers/,
      /If subshaders removal was intentional/,
      /Microsoft Media Foundation video decoding/,
      /convex MeshCollider/,
      /BoxCollider, SphereCollider, CapsuleCollider/,
      /de shader pass YCbCrA/,
      /The referenced script .* is missing/,
      /allocator-block-size/,
      /allocator-size/
    ];

    const processLogData = (data: any, prefix: string, buffer: { text: string }) => {
      buffer.text += data.toString();
      let newlineIndex;
      while ((newlineIndex = buffer.text.indexOf('\n')) !== -1) {
        let line = buffer.text.substring(0, newlineIndex);
        buffer.text = buffer.text.substring(newlineIndex + 1);
        
        // Strip ANSI escape codes and carriage returns, then trim
        line = line.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').replace(/\r/g, '').trim();
        if (!line) continue;

        if (ignorePatterns.some(p => p.test(line))) {
          continue;
        }

        this.sendLog(`[${prefix}] ${line}`);
        this.parseLogLine(line);
      }
    };

    let stdoutBuffer = { text: '' };
    this.process.stdout?.on('data', (data) => processLogData(data, 'SonsOfTheForest', stdoutBuffer));

    let stderrBuffer = { text: '' };
    this.process.stderr?.on('data', (data) => processLogData(data, 'SonsOfTheForest Error', stderrBuffer));

    this.process.on('close', (code) => {
      this.sendLog(`[System] Sons of the Forest Server stopped (Code: ${code})`);
      this.process = null;
      this.onlinePlayers = [];
      this.logHistory = [];
      if (this.statsTimer) {
        clearInterval(this.statsTimer);
        this.statsTimer = null;
      }
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) win.webContents.send('server-stats', { id: this.serverId, cpu: 0, ram: 0 });
      });
      this.sendPlayerUpdate();
    });

    if (this.process.pid) {
      this.statsTimer = setInterval(async () => {
        if (!this.process || !this.process.pid) return;
        try {
          const stats = await pidusage(this.process.pid);
          BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) win.webContents.send('server-stats', { id: this.serverId, cpu: stats.cpu, ram: stats.memory });
          });
        } catch (e: any) {
          // PID might not exist anymore
        }
      }, 2000);
    }

    this.process.on('error', (err) => {
      this.sendLog(`[System Error] ${err.message}`);
    });
  }

  parseLogLine(line: string) {
    if (line.includes('joined')) {
      const match = line.match(/Player\s+([^ ]+)\s+joined/i) || line.match(/joined the game:\s*(.+)/i);
      if (match) {
        const playerName = (match[1] || match[2]).trim();
        if (!this.onlinePlayers.includes(playerName)) {
          this.onlinePlayers.push(playerName);
          this.sendPlayerUpdate();
        }
      }
    }

    if (line.includes('left') || line.includes('disconnected')) {
      const match = line.match(/Player\s+([^ ]+)\s+(left|disconnected)/i) || line.match(/(left|disconnected):\s*(.+)/i);
      if (match) {
        const playerName = (match[1] || match[2]).trim();
        this.onlinePlayers = this.onlinePlayers.filter(p => p !== playerName);
        this.sendPlayerUpdate();
      }
    }
  }

  stop() {
    if (this.process) {
      this.sendLog('[System] Stopping Sons of the Forest Server...');
      if (this.process.pid) {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', this.process.pid.toString(), '/f', '/t']);
        } else {
          this.process.kill();
        }
      }
      this.process = null;
    }
    
    this.onlinePlayers = [];
    this.logHistory = [];
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('server-stats', { id: this.serverId, cpu: 0, ram: 0 });
    });
    this.sendPlayerUpdate();
  }
}

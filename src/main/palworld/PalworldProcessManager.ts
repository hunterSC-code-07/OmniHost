import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import { PalworldRcon } from './PalworldRcon'

export class PalworldProcessManager {
  serverId: number;
  serverDir: string;
  process: ChildProcess | null = null;
  onlinePlayers: string[] = [];
  logHistory: string[] = [];
  omnihostMeta: any = {};
  
  private rcon: PalworldRcon;

  constructor(serverId: number) {
    this.serverId = serverId;
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
    this.rcon = new PalworldRcon(serverId);
  }

  sendLog(msg: string) {
    console.log(msg); // Guaranteed VS Code output!
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

  async sendCommand(cmd: string) {
    const response = await this.rcon.sendCommand(cmd);
    this.sendLog(`> ${cmd}`);
    if (response) {
      this.sendLog(`[RCON] ${response}`);
    }
  }

  async start() {
    const exePath = join(this.serverDir, 'PalServer.exe');
    if (!fs.existsSync(exePath)) {
      this.sendLog(`[System] Palworld Server executable not found at ${exePath}. Did you finish the SteamCMD download?`);
      return;
    }

    this.sendLog('[System] Starting Palworld Server...');

    // No extra args needed out-of-the-box, but we can pass standard ports or configurations if desired
    const args: string[] = [];

    this.process = spawn(`"${exePath}"`, args, { cwd: this.serverDir, shell: true });

    // Apply CPU Core Limits
    if (process.platform === 'win32' && this.process.pid) {
      try {
        const metaPath = join(this.serverDir, 'omnihost.json');
        if (fs.existsSync(metaPath)) {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          if (meta.cpu) {
            const cpuLimit = parseInt(meta.cpu, 10);
            if (cpuLimit > 0) {
              const affinityMask = (1 << cpuLimit) - 1;
              spawn('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${this.process.pid}).ProcessorAffinity = ${affinityMask}`]);
              this.sendLog(`[System] Applied CPU limit: ${cpuLimit} cores (Affinity: ${affinityMask})`);
            }
          }
        }
      } catch (e) {
        this.sendLog(`[System Error] Failed to apply resource limits: ${e}`);
      }
    }

    this.process.stdout?.on('data', (data) => {
      this.sendLog(`[Palworld] ${data.toString().trim()}`);
    });

    this.process.stderr?.on('data', (data) => {
      this.sendLog(`[Palworld Error] ${data.toString().trim()}`);
    });

    this.process.on('close', (code) => {
      this.sendLog(`[System] Palworld Server stopped (Code: ${code})`);
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
      this.sendLog('[System] Stopping Palworld Server...');
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
    this.sendPlayerUpdate();
  }
}

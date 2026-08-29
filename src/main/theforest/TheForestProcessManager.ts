import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import pidusage from 'pidusage';

export class TheForestProcessManager {
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
    this.process.stdin.write(cmd + '\\n');
    this.sendLog(`[Command] > ${cmd}`);
  }

  async start() {
    const exePath = join(this.serverDir, 'TheForestDedicatedServer.exe');
    if (!fs.existsSync(exePath)) {
      this.sendLog(`[System] The Forest Server executable not found at ${exePath}. Did you finish the SteamCMD download?`);
      return;
    }

    this.sendLog('[System] Starting The Forest Server...');

    const args = [
      '-batchmode',
      '-nographics',
      '-dedicated'
    ];

    this.process = spawn(exePath, args, { cwd: this.serverDir });

    this.process.stdout?.on('data', (data) => {
      const text = data.toString();
      const lines = text.trim().split('\\n');
      for (const line of lines) {
        if (line.trim()) {
          this.sendLog(`[TheForest] ${line.trim()}`);
          this.parseLogLine(line.trim());
        }
      }
    });

    this.process.stderr?.on('data', (data) => {
      this.sendLog(`[TheForest Error] ${data.toString().trim()}`);
    });

    this.process.on('close', (code) => {
      this.sendLog(`[System] The Forest Server stopped (Code: ${code})`);
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
      const match = line.match(/Player\\s+([^ ]+)\\s+joined/i) || line.match(/joined the game:\\s*(.+)/i);
      if (match) {
        const playerName = (match[1] || match[2]).trim();
        if (!this.onlinePlayers.includes(playerName)) {
          this.onlinePlayers.push(playerName);
          this.sendPlayerUpdate();
        }
      }
    }

    if (line.includes('left') || line.includes('disconnected')) {
      const match = line.match(/Player\\s+([^ ]+)\\s+(left|disconnected)/i) || line.match(/(left|disconnected):\\s*(.+)/i);
      if (match) {
        const playerName = (match[1] || match[2]).trim();
        this.onlinePlayers = this.onlinePlayers.filter(p => p !== playerName);
        this.sendPlayerUpdate();
      }
    }
  }

  stop() {
    if (this.process) {
      this.sendLog('[System] Stopping The Forest Server...');
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

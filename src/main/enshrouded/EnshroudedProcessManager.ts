import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'

export class EnshroudedProcessManager {
  serverId: number;
  serverDir: string;
  process: ChildProcess | null = null;
  onlinePlayers: string[] = [];
  
  constructor(serverId: number) {
    this.serverId = serverId;
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
  }

  sendLog(msg: string) {
    console.log(msg);
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
    this.sendLog(`[System] Command execution is not natively supported for Enshrouded yet. Command: ${cmd}`);
  }

  async start() {
    const exePath = join(this.serverDir, 'enshrouded_server.exe');
    if (!fs.existsSync(exePath)) {
      this.sendLog(`[System] Enshrouded Server executable not found at ${exePath}. Did you finish the SteamCMD download?`);
      return;
    }

    this.sendLog('[System] Starting Enshrouded Server...');

    const args: string[] = [];

    this.process = spawn(`"${exePath}"`, args, { cwd: this.serverDir, shell: true });

    this.process.stdout?.on('data', (data) => {
      const text = data.toString();
      const lines = text.trim().split('\n');
      for (const line of lines) {
        this.sendLog(`[Enshrouded] ${line.trim()}`);
      }
    });

    this.process.stderr?.on('data', (data) => {
      this.sendLog(`[Enshrouded Error] ${data.toString().trim()}`);
    });

    this.process.on('close', (code) => {
      this.sendLog(`[System] Enshrouded Server stopped (Code: ${code})`);
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
      this.sendLog('[System] Stopping Enshrouded Server...');
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

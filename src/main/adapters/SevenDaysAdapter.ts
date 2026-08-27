import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'

export class SevenDaysAdapter {
  serverId: number;
  serverDir: string;
  process: ChildProcess | null = null;
  onlinePlayers: string[] = [];
  logBuffer: string[] = [];
  logFlushTimer: NodeJS.Timeout | null = null;

  constructor(serverId: number) {
    this.serverId = serverId;
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
  }

  sendLog(msg: string) {
    console.log(msg);
    
    this.logBuffer.push(msg);
    if (!this.logFlushTimer) {
      this.logFlushTimer = setTimeout(() => {
        const msgs = [...this.logBuffer];
        this.logBuffer = [];
        this.logFlushTimer = null;
        if (msgs.length > 0) {
          const batchedMsg = msgs.join('\n');
          BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) win.webContents.send('console-log', { id: this.serverId, msg: batchedMsg });
          });
        }
      }, 50);
    }
  }

  sendPlayerUpdate() {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('online-players', { id: this.serverId, players: this.onlinePlayers });
    });
  }

  sendCommand(cmd: string) {
    this.sendLog(`[System] Sending commands to 7 Days to Die requires Telnet setup (not yet implemented). Command: ${cmd}`);
  }

  async start() {
    const exePath = join(this.serverDir, '7DaysToDieServer.exe');
    if (!fs.existsSync(exePath)) {
      this.sendLog(`[System] 7 Days to Die Server executable not found at ${exePath}. Did you finish the SteamCMD download?`);
      return;
    }

    this.sendLog('[System] Starting 7 Days to Die Server...');

    const args = [
      '-batchmode',
      '-nographics',
      '-dedicated',
      '-configfile=serverconfig.xml'
    ];

    this.process = spawn(exePath, args, { cwd: this.serverDir });

    this.process.stdout?.on('data', (data) => {
      this.sendLog(`[7Days] ${data.toString().trim()}`);
    });

    this.process.stderr?.on('data', (data) => {
      this.sendLog(`[7Days Error] ${data.toString().trim()}`);
    });

    this.process.on('close', (code) => {
      this.sendLog(`[System] 7 Days to Die Server exited with code ${code}`);
      this.process = null;
      this.onlinePlayers = [];
      this.sendPlayerUpdate();
    });
  }

  stop() {
    if (this.process) {
      this.sendLog('[System] Stopping 7 Days to Die Server...');
      this.process.kill('SIGTERM');
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

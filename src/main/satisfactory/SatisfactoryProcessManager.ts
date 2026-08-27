import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import https from 'https'
import axios from 'axios'

export class SatisfactoryProcessManager {
  serverId: number;
  serverDir: string;
  process: ChildProcess | null = null;
  onlinePlayers: string[] = [];
  apiToken: string | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(serverId: number) {
    this.serverId = serverId;
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
    this.loadToken();
  }

  loadToken() {
    try {
      const cfgPath = join(this.serverDir, 'omnihost-config.json');
      if (fs.existsSync(cfgPath)) {
        const data = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
        this.apiToken = data.satisfactoryApiToken || null;
      }
    } catch (e) {
      console.error('Failed to load satisfactory token', e);
    }
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
    this.sendLog(`[System] Satisfactory commands via console are not natively supported by the standard engine output yet. Command: ${cmd}`);
  }

  async start() {
    const exePath = join(this.serverDir, 'FactoryServer.exe');
    if (!fs.existsSync(exePath)) {
      this.sendLog(`[System] Satisfactory Server executable not found at ${exePath}. Did you finish the SteamCMD download?`);
      return;
    }

    this.sendLog('[System] Starting Satisfactory Server...');
    this.loadToken(); // Refresh token on start

    const args = [
      '-log',
      '-unattended'
    ];

    this.process = spawn(`"${exePath}"`, args, { cwd: this.serverDir, shell: true });

    this.process.stdout?.on('data', (data) => {
      const text = data.toString();
      fs.appendFileSync(join(app.getAppPath(), '..', '..', 'satisfactory_debug.log'), text);
      const lines = text.trim().split('\n');
      for (const line of lines) {
        this.sendLog(`[Satisfactory] ${line.trim()}`);
      }
    });

    this.process.stderr?.on('data', (data) => {
      this.sendLog(`[Satisfactory Error] ${data.toString().trim()}`);
    });

    this.process.on('close', (code) => {
      this.sendLog(`[System] Satisfactory Server stopped (Code: ${code})`);
      this.process = null;
      this.onlinePlayers = [];
      this.sendPlayerUpdate();
      if (this.pollInterval) clearInterval(this.pollInterval);
    });

    this.process.on('error', (err) => {
      this.sendLog(`[System Error] ${err.message}`);
    });

    // Start polling API for players
    this.startPolling();
  }

  startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);

    // Poll every 10 seconds
    this.pollInterval = setInterval(async () => {
      if (!this.process || !this.apiToken) return;

      try {
        const agent = new https.Agent({ rejectUnauthorized: false }); // Bypass self-signed cert
        const res = await axios.post('https://127.0.0.1:7777/api/v1', {
          function: 'QueryServerState'
        }, {
          httpsAgent: agent,
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.status === 200) {
          const data = res.data;
          
          if (data && data.data && data.data.serverGameState) {
             const numPlayers = data.data.serverGameState.numConnectedPlayers || 0;
             const newPlayers = Array(numPlayers).fill('Unknown Pioneer');
             
             // Deep compare to prevent useless updates
             if (JSON.stringify(newPlayers) !== JSON.stringify(this.onlinePlayers)) {
               this.onlinePlayers = newPlayers;
               this.sendPlayerUpdate();
             }
          }
        }
      } catch (err: any) {
        // Suppress fetch errors silently unless debug is enabled to avoid spam
      }
    }, 10000);
  }

  stop() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    
    if (this.process) {
      this.sendLog('[System] Stopping Satisfactory Server...');
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

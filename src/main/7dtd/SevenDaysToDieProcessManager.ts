import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import net from 'net';

export class SevenDaysToDieProcessManager {
  serverId: number;
  serverDir: string;
  process: ChildProcess | null = null;
  onlinePlayers: string[] = [];

  constructor(serverId: number) {
    this.serverId = serverId;
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
  }

  sendLog(msg: string) {
    console.log(msg); // Guaranteed VS Code output
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
    if (!this.process) {
      this.sendLog(`[System] Process not running, cannot send command: ${cmd}`);
      return;
    }

    // Attempt to read Telnet port from config, default to 8081
    let telnetPort = 8081;
    let telnetPassword = '';
    const configPath = join(this.serverDir, 'serverconfig.xml');
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      const portMatch = configData.match(/<property name="TelnetPort"[\s]+value="(\d+)"/);
      if (portMatch && portMatch[1]) {
        telnetPort = parseInt(portMatch[1], 10);
      }
      const passMatch = configData.match(/<property name="TelnetPassword"[\s]+value="([^"]*)"/);
      if (passMatch && passMatch[1]) {
        telnetPassword = passMatch[1];
      }
    }

    const client = new net.Socket();
    client.connect(telnetPort, '127.0.0.1', () => {
      if (telnetPassword) {
        client.write(telnetPassword + '\r\n');
      }
      client.write(cmd + '\r\n');
      // Give it a brief moment to process before destroying
      setTimeout(() => {
        client.destroy();
      }, 500);
    });

    client.on('error', (err) => {
      this.sendLog(`[System Error] Telnet command failed: ${err.message}`);
    });
  }

  async start() {
    const exePath = join(this.serverDir, '7DaysToDieServer.exe');
    if (!fs.existsSync(exePath)) {
      this.sendLog(`[System] 7 Days to Die Server executable not found at ${exePath}. Did you finish the SteamCMD download?`);
      return;
    }

    this.sendLog('[System] Starting 7 Days to Die Server...');

    // Usually 7dtd servers are started with arguments: -quit -batchmode -nographics -dedicated
    const args = [
      '-batchmode',
      '-nographics',
      '-dedicated',
      '-configfile=serverconfig.xml'
    ];

    this.process = spawn(`"${exePath}"`, args, { cwd: this.serverDir, shell: true });

    this.process.stdout?.on('data', (data) => {
      const text = data.toString();
      const lines = text.trim().split('\n');
      for (const line of lines) {
        this.sendLog(`[7DTD] ${line.trim()}`);
        this.parseLogLine(line.trim());
      }
    });

    this.process.stderr?.on('data', (data) => {
      this.sendLog(`[7DTD Error] ${data.toString().trim()}`);
    });

    this.process.on('close', (code) => {
      this.sendLog(`[System] 7 Days to Die Server stopped (Code: ${code})`);
      this.process = null;
      this.onlinePlayers = [];
      this.sendPlayerUpdate();
    });

    this.process.on('error', (err) => {
      this.sendLog(`[System Error] ${err.message}`);
    });
  }

  parseLogLine(line: string) {
    // 7DTD connection logs examples:
    // INF GMSG: Player 'AVALON' joined the game
    // INF PlayerSpawnedInWorld (reason: EnterMultiplayer, position: ...): ... PlayerName='AVALON', ClientNumber='1'
    const joinMatch = line.match(/GMSG: Player '([^']+)' joined the game/) || line.match(/PlayerName='([^']+)'/);
    
    if (line.includes('joined the game') || line.includes('PlayerSpawnedInWorld')) {
      const match = line.match(/GMSG: Player '([^']+)' joined the game/) || line.match(/PlayerName='([^']+)'/);
      if (match) {
        const playerName = match[1].trim();
        if (!this.onlinePlayers.includes(playerName)) {
          this.onlinePlayers.push(playerName);
          this.sendPlayerUpdate();
        }
      }
    }

    // 7DTD disconnection logs examples:
    // INF GMSG: Player 'AVALON' left the game
    // INF Player disconnected: EntityID=171, PltfmId='...', CrossId='...', OwnerID='...', PlayerName='AVALON'
    if (line.includes('left the game') || line.includes('Player disconnected:')) {
      const match = line.match(/GMSG: Player '([^']+)' left the game/) || line.match(/PlayerName='([^']+)'/);
      if (match) {
        const playerName = match[1].trim();
        this.onlinePlayers = this.onlinePlayers.filter(p => p !== playerName);
        this.sendPlayerUpdate();
      }
    }
  }

  stop() {
    if (this.process) {
      this.sendLog('[System] Stopping 7 Days to Die Server...');
      // 7dtd server accepts 'shutdown' command via telnet, but via stdin if it works we can try.
      // Alternatively, we can force kill.
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

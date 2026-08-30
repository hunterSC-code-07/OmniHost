import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import { PalworldRcon } from './PalworldRcon'
import { PalworldConfigManager } from './PalworldConfigManager'
import { FileTailer } from '../utils/FileTailer'
import pidusage from 'pidusage'

export class PalworldProcessManager {
  serverId: number
  serverDir: string
  process: ChildProcess | null = null
  serverPid: number | null = null
  onlinePlayers: any[] = []
  logHistory: string[] = []
  omnihostMeta: any = {}

  private rcon: PalworldRcon
  private fileTailer: FileTailer | null = null
  private playerInterval: NodeJS.Timeout | null = null
  private statsTimer: NodeJS.Timeout | null = null

  constructor(serverId: number) {
    this.serverId = serverId
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString())
    this.rcon = new PalworldRcon(serverId)
  }

  sendLog(msg: string) {
    console.log(msg) // Guaranteed VS Code output!
    this.logHistory.push(msg)
    if (this.logHistory.length > 2000) this.logHistory.shift()
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) win.webContents.send('console-log', { id: this.serverId, msg })
    })
  }

  sendPlayerUpdate() {
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed())
        win.webContents.send('online-players', { id: this.serverId, players: this.onlinePlayers })
    })
  }

  async sendCommand(cmd: string) {
    if (cmd.startsWith('/KickPlayer ') || cmd.startsWith('/BanPlayer ') || cmd.startsWith('/UnbanPlayer ')) {
      const parts = cmd.split(' ');
      const action = parts[0] === '/KickPlayer' ? 'kick' : (parts[0] === '/BanPlayer' ? 'ban' : 'unban');
      const target = parts[1];

      const adminPass = (this as any).adminPassword || '';
      const auth = Buffer.from(`admin:${adminPass}`).toString('base64');
      
      try {
        const res = await fetch(`http://127.0.0.1:8212/v1/api/${action}`, {
          method: 'POST',
          headers: { 
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userid: target })
        });
        
        this.sendLog(`> ${cmd} (via REST API)`);
        if (res.ok) {
          this.sendLog(`[REST] Successfully executed ${action} on ${target}`);
          if (action === 'ban') {
            const p = this.onlinePlayers.find(op => op.userId === target || op.playerId === target || op.name === target);
            if (p && p.name) {
              const namesFile = join(this.serverDir, 'banned_names.json');
              let namesMap: Record<string, string> = {};
              try { if (fs.existsSync(namesFile)) namesMap = JSON.parse(fs.readFileSync(namesFile, 'utf8')); } catch(e) {}
              namesMap[p.userId || p.playerId || target] = p.name;
              fs.writeFileSync(namesFile, JSON.stringify(namesMap, null, 2));
            }
          }
        } else {
          this.sendLog(`[REST Error] Failed to ${action} ${target} (HTTP ${res.status})`);
        }
        return;
      } catch (e) {
        this.sendLog(`[REST Error] ${e}`);
        // Fallback to RCON if REST fails
      }
    }

    const response = await this.rcon.sendCommand(cmd)
    this.sendLog(`> ${cmd}`)
    if (response) {
      this.sendLog(`[RCON] ${response}`)
    }
  }

  private getActualPid(): Promise<number> {
    return new Promise((resolve) => {
      const proc = this.process;
      if (!proc || !proc.pid) return resolve(0);
      if (this.serverPid) return resolve(this.serverPid);
      if (process.platform !== 'win32') return resolve(proc.pid);

      const { spawn } = require('child_process');
      const ps = spawn('powershell', ['-NoProfile', '-Command', '-']);
      
      let out = '';
      ps.stdout.on('data', (data: any) => out += data.toString());
      
      ps.on('close', () => {
        const pid = parseInt(out.trim());
        if (!isNaN(pid) && pid > 0) {
          this.serverPid = pid;
          resolve(pid);
        } else {
          resolve(proc.pid!);
        }
      });

      const script = `
        $all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name
        $target = ${proc.pid}
        $children = @{}
        foreach ($p in $all) {
            $parentId = [string]$p.ParentProcessId
            if (-not $children.ContainsKey($parentId)) {
                $children[$parentId] = @()
            }
            $children[$parentId] += $p
        }
        $queue = [System.Collections.Generic.Queue[string]]::new()
        $queue.Enqueue([string]$target)
        $found = 0
        while ($queue.Count -gt 0) {
            $curr = $queue.Dequeue()
            if ($children.ContainsKey($curr)) {
                foreach ($c in $children[$curr]) {
                    if ($c.Name -match 'PalServer') {
                        $found = $c.ProcessId
                        break
                    }
                    $queue.Enqueue($c.ProcessId)
                }
            }
            if ($found -ne 0) { break }
        }
        Write-Output $found
      `;
      ps.stdin.write(script);
      ps.stdin.end();
    });
  }

  async start() {
    const exePath = join(this.serverDir, 'PalServer.exe')
    if (!fs.existsSync(exePath)) {
      this.sendLog(
        `[System] Palworld Server executable not found at ${exePath}. Did you finish the SteamCMD download?`
      )
      return
    }

    this.sendLog('[System] Starting Palworld Server...')

    // Force enable RCON, REST API, and set an AdminPassword so we can track players
    const config = await PalworldConfigManager.getConfig(this.serverId);
    let adminPassword = config['AdminPassword'] ? config['AdminPassword'].replace(/"/g, '') : '';
    
    if (config['RCONEnabled'] !== 'True' || config['RESTAPIEnabled'] !== 'True' || !adminPassword) {
      this.sendLog('[System] Enabling RCON & REST API, generating Admin Password for player tracking...');
      const newPassword = `"${Math.random().toString(36).substring(2, 10)}"`;
      await PalworldConfigManager.setConfig(this.serverId, { RCONEnabled: 'True', RESTAPIEnabled: 'True', AdminPassword: newPassword });
      adminPassword = newPassword.replace(/"/g, '');
    }
    
    // Store it on the class so the interval can use it
    (this as any).adminPassword = adminPassword;

    const logDir = join(this.serverDir, 'Pal', 'Saved', 'Logs')
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })
    const logFilePath = join(logDir, 'Pal.log')
    try {
      fs.writeFileSync(logFilePath, '')
    } catch (e) {
      this.sendLog(`[System Warning] Could not clear old Pal.log: ${e}`)
    }

    const shippingExePath = join(this.serverDir, 'Pal', 'Binaries', 'Win64', 'PalServer-Win64-Shipping.exe')
    const args = [
      '/c',
      `""${shippingExePath}" Pal -log > "${logFilePath}" 2>&1"`
    ]
    const startTime = Date.now() - 5000;

    this.process = spawn('cmd.exe', args, { cwd: this.serverDir, shell: false, windowsHide: false, windowsVerbatimArguments: true })

    // Wait a few seconds for the child process to spawn before applying CPU limit
    setTimeout(() => {
      if (process.platform === 'win32' && this.process?.pid) {
        try {
          const metaPath = join(this.serverDir, 'omnihost.json')
          if (fs.existsSync(metaPath)) {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
            if (meta.cpu) {
              const cpuLimit = parseInt(meta.cpu, 10)
              if (cpuLimit > 0) {
                const affinityMask = (1 << cpuLimit) - 1
                // Find the child process (Shipping.exe) of cmd.exe and apply affinity
                spawn('powershell', [
                  '-NoProfile',
                  '-Command',
                  `$child = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq ${this.process.pid} }; if ($child) { (Get-Process -Id $child.ProcessId).ProcessorAffinity = ${affinityMask} }`
                ])
                this.sendLog(
                  `[System] Applied CPU limit: ${cpuLimit} cores (Affinity: ${affinityMask})`
                )
              }
            }
          }
        } catch (e) {
          this.sendLog(`[System Error] Failed to apply resource limits: ${e}`)
        }
      }
    }, 5000)

    this.process.stdout?.on('data', (data) => {
      // Just log any cmd.exe output if it happens
      const output = data.toString().trim()
      if (output) this.sendLog(`[System] ${output}`)
    })

    this.process.stderr?.on('data', (data) => {
      this.sendLog(`[Palworld Error] ${data.toString().trim()}`)
    })

    this.fileTailer = new FileTailer({
      directory: join(this.serverDir, 'Pal', 'Saved', 'Logs'),
      filePattern: /\.log$/i,
      startTime,
      onLine: (line) => this.sendLog(`[Palworld] ${line}`),
      onLog: (msg) => this.sendLog(msg)
    });
    this.fileTailer.start();

    if (this.process.pid) {
      this.statsTimer = setInterval(async () => {
        if (!this.process || !this.process.pid) return;
        try {
          const actualPid = await this.getActualPid();
          if (actualPid === 0) return;
          const stats = await pidusage(actualPid);
          BrowserWindow.getAllWindows().forEach((win) => {
            if (!win.isDestroyed())
              win.webContents.send('server-stats', { id: this.serverId, cpu: stats.cpu, ram: stats.memory })
          })
        } catch (e: any) {
          // PID might not exist anymore
          this.serverPid = null;
        }
      }, 2000);
    }

    // Start REST API polling for players (Palworld RCON is broken and times out)
    this.playerInterval = setInterval(async () => {
      if (!this.process) return;
      try {
        const adminPass = (this as any).adminPassword || '';
        const auth = Buffer.from(`admin:${adminPass}`).toString('base64');
        const res = await fetch('http://127.0.0.1:8212/v1/api/players', {
          headers: { 'Authorization': `Basic ${auth}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          // data.players is an array of objects: { name, playerId, userId, ip, ping }
          const currentPlayers = data.players || [];
          
          // Only send update if players changed
          const getIds = (arr: any[]) => arr.map(p => p.userId || p.name);
          const currIds = getIds(currentPlayers);
          const oldIds = getIds(this.onlinePlayers);
          
          if (JSON.stringify(currIds) !== JSON.stringify(oldIds)) {
            // Find joined and left players to emit real-time logs (bypassing slow file buffer)
            const joined = currentPlayers.filter((p: any) => !oldIds.includes(p.userId || p.name));
            const left = this.onlinePlayers.filter((p: any) => !currIds.includes(p.userId || p.name));
            
            for (const p of joined) {
              this.sendLog(`[System] ${p.name || 'Unknown Player'} joined the game`);
            }
            for (const p of left) {
              this.sendLog(`[System] ${p.name || 'Unknown Player'} left the game`);
            }

            this.onlinePlayers = currentPlayers;
            this.sendPlayerUpdate();
          }
        }
      } catch (e) {
        // Ignore polling errors while server is booting or REST API is unreachable
      }
    }, 10000);

    this.process.on('close', (code) => {
      this.sendLog(`[System] Palworld Server stopped (Code: ${code})`)
      this.fileTailer?.stop()
      if (this.playerInterval) { clearInterval(this.playerInterval); this.playerInterval = null; }
      if (this.statsTimer) { clearInterval(this.statsTimer); this.statsTimer = null; }
      try { this.rcon.disconnect() } catch (e) {}
      this.process = null
      this.serverPid = null
      this.onlinePlayers = []
      this.sendPlayerUpdate()
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) win.webContents.send('server-stats', { id: this.serverId, cpu: 0, ram: 0 })
      })
    })

    this.process.on('error', (err) => {
      this.sendLog(`[System Error] ${err.message}`)
    })
  }

  stop() {
    if (this.process) {
      this.sendLog('[System] Stopping Palworld Server...')
      if (this.serverPid && process.platform === 'win32') {
        spawn('taskkill', ['/pid', this.serverPid.toString(), '/f', '/t'])
      } else if (this.process.pid) {
        // Fallback to killing powershell if something went wrong
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', this.process.pid.toString(), '/f', '/t'])
        } else {
          this.process.kill()
        }
      }
      this.process = null
      this.serverPid = null
      this.fileTailer?.stop()
      if (this.playerInterval) { clearInterval(this.playerInterval); this.playerInterval = null; }
      if (this.statsTimer) { clearInterval(this.statsTimer); this.statsTimer = null; }
      try { this.rcon.disconnect() } catch (e) {}
    }

    this.onlinePlayers = []
    this.sendPlayerUpdate()
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) win.webContents.send('server-stats', { id: this.serverId, cpu: 0, ram: 0 })
    })
  }
}

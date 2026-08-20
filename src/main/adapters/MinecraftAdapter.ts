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
  javaPid: number | null = null; 

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

  private getActualPid(): Promise<number> {
    return new Promise((resolve) => {
      const proc = this.process;
      if (!proc || !proc.pid) return resolve(0);
      if (this.javaPid) return resolve(this.javaPid);
      if (process.platform !== 'win32') return resolve(proc.pid);

      const { spawn } = require('child_process');
      const ps = spawn('powershell', ['-NoProfile', '-Command', '-']);
      
      let out = '';
      ps.stdout.on('data', (data: any) => out += data.toString());
      
      ps.on('close', () => {
        const pid = parseInt(out.trim());
        if (!isNaN(pid) && pid > 0) {
          this.javaPid = pid;
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
            if (-not $children.ContainsKey($p.ParentProcessId)) {
                $children[$p.ParentProcessId] = @()
            }
            $children[$p.ParentProcessId] += $p
        }
        $queue = [System.Collections.Generic.Queue[int]]::new()
        $queue.Enqueue($target)
        $found = 0
        while ($queue.Count -gt 0) {
            $curr = $queue.Dequeue()
            if ($children.ContainsKey($curr)) {
                foreach ($c in $children[$curr]) {
                    if ($c.Name -match 'java') {
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

  private lastSaveFlushTime: number = 0;

  async getPlayerInventory(playerName: string) {
    try {
      // Rate-limit save-all flush to avoid spamming "Saved the game" to all players in-game.
      // The live inventory tracker polls every 3s, but we only need to flush to disk periodically.
      // Between flushes, we read the .dat file as-is (updated on auto-save every ~5min or player disconnect).
      const now = Date.now();
      if (now - this.lastSaveFlushTime > 60000 && this.process?.stdin) {
        this.process.stdin.write('save-all flush\n');
        this.lastSaveFlushTime = now;
        await new Promise(r => setTimeout(r, 200));
      }

      const cachePath = join(this.serverDir, 'usercache.json');
      if (!fs.existsSync(cachePath)) return null;
      
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      const playerEntry = cache.find((p: any) => p.name.toLowerCase() === playerName.toLowerCase());
      if (!playerEntry) return null;

      let datPath = join(this.serverDir, 'world', 'playerdata', `${playerEntry.uuid}.dat`);
      if (!fs.existsSync(datPath)) {
        datPath = join(this.serverDir, 'world', 'players', 'data', `${playerEntry.uuid}.dat`);
      }
      if (!fs.existsSync(datPath)) return null;

      const buffer = fs.readFileSync(datPath);
      
      // Clean NBT Require (Fixes the deprecation warning in the terminal!)
      const nbt = require('prismarine-nbt');
      const { parsed } = await nbt.parse(buffer);
      
      const inventory = parsed.value.Inventory?.value?.value || [];
      return inventory.map((item: any) => ({
        slot: item.Slot?.value ?? 0,
        id: item.id?.value?.replace('minecraft:', '') ?? 'air',
        count: item.Count?.value ?? item.count?.value ?? 1
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
            let datPath = join(this.serverDir, 'world', 'playerdata', `${playerEntry.uuid}.dat`);
            if (!fs.existsSync(datPath)) {
              datPath = join(this.serverDir, 'world', 'players', 'data', `${playerEntry.uuid}.dat`);
            }
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

  /**
   * Parses a Forge/NeoForge run.bat or start.bat file to extract Java arguments.
   * This allows us to spawn Java directly instead of through cmd.exe,
   * which is required for pidusage to measure the correct process.
   * 
   * Typical Forge/NeoForge run.bat format:
   *   @echo off
   *   java @user_jvm_args.txt @libraries/.../win_args.txt %*
   *   pause
   * 
   * Returns the extracted args array, or null if parsing fails.
   */
  private parseRunBat(batPath: string): string[] | null {
    try {
      const content = fs.readFileSync(batPath, 'utf-8');
      const lines = content.split(/\r?\n/);

      // Forge run.bat has TWO java commands:
      //   1) java -jar forge-...-shim.jar --onlyCheckJava  (version check, exits immediately)
      //   2) java @user_jvm_args.txt @libraries/.../win_args.txt %*  (actual server)
      // We want the LAST java command, which is always the actual server launch.
      let lastJavaArgs: string[] | null = null;

      for (const rawLine of lines) {
        const line = rawLine.trim();

        // Skip non-Java lines (echo, set, rem, pause, empty, labels, conditionals, etc.)
        if (!line || line.startsWith('@echo') || line.startsWith('REM') || line.startsWith('rem') ||
            line.startsWith('set ') || line.startsWith('SET ') || line === 'pause' || line === 'PAUSE' ||
            line.startsWith('::') || line.startsWith('if ') || line.startsWith('IF ') ||
            line.startsWith(':') || line.startsWith('echo') || line.startsWith('goto')) {
          continue;
        }

        // Look for the java launch command
        // Matches: java ..., "java" ..., %JAVA_HOME%\bin\java ..., "path\to\java.exe" ...
        const javaMatch = line.match(/^(?:@\s*)?(?:"[^"]*[/\\])?(?:java(?:w)?(?:\.exe)?)"?\s+(.*)/i);
        if (javaMatch) {
          const argsString = javaMatch[1];
          // Parse the args, preserving @argfile references and handling %* placeholder
          const args: string[] = [];
          // Split on spaces, but respect quoted strings and @-prefixed argfile paths
          const tokens = argsString.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
          for (const token of tokens) {
            if (token === '%*' || token === '%1' || token === '%~1') continue; // Skip batch arg placeholders
            // Remove surrounding quotes if present
            const cleaned = token.replace(/^"(.*)"$/, '$1');
            if (cleaned) args.push(cleaned);
          }
          if (args.length > 0) lastJavaArgs = args;
        }
      }

      return lastJavaArgs;
    } catch (e) {
      return null; // File read or parse error
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
    const maxRamGB = this.omnihostMeta.ram ? parseInt(this.omnihostMeta.ram, 10) : 2;
    const minRamGB = Math.min(1, maxRamGB);
    const ramLimit = `-Xmx${maxRamGB}G`;
    const minRam = `-Xms${minRamGB}G`;
    
    // Minimum of 4 cores to prevent World Gen NPE in modern Minecraft
    const safeCpuLimit = this.omnihostMeta.cpu ? Math.max(4, parseInt(this.omnihostMeta.cpu)) : null;
    const cpuLimit = safeCpuLimit ? `-XX:ActiveProcessorCount=${safeCpuLimit}` : '';

    // High-performance GC flags (Aikar's G1GC flags) to prevent GC stutter and chunk generation lag
    const g1gcFlags = [
      '-XX:+UseG1GC',
      '-XX:+ParallelRefProcEnabled',
      '-XX:MaxGCPauseMillis=200',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:+DisableExplicitGC',
      '-XX:G1NewSizePercent=30',
      '-XX:G1MaxNewSizePercent=40',
      '-XX:G1ReservePercent=20',
      '-XX:G1HeapWastePercent=5',
      '-XX:G1MixedGCCountTarget=4',
      '-XX:InitiatingHeapOccupancyPercent=15',
      '-XX:G1MixedGCLiveThresholdPercent=90',
      '-XX:G1RSetUpdatingPauseTimePercent=5',
      '-XX:SurvivorRatio=32',
      '-XX:+PerfDisableSharedMem',
      '-XX:MaxTenuringThreshold=1',
      '-XX:G1PeriodicGCInterval=15000'
    ];

    const baseFlags = [ramLimit, minRam, ...g1gcFlags];
    if (cpuLimit) baseFlags.push(cpuLimit);

    let targetArgs = [...baseFlags, '-jar', 'server.jar', 'nogui'];
    let env = { ...process.env };

    if (javaPath !== 'java') {
      const pathModule = require('path');
      const javaBinDir = pathModule.dirname(javaPath);
      env.PATH = `${javaBinDir};${process.env.PATH}`;
      env.JAVA_HOME = pathModule.dirname(javaBinDir);
    }

    // Try to parse run.bat/start.bat and launch Java directly (fixes CPU/RAM stats for Forge/NeoForge)
    // Launching through cmd.exe causes pidusage to measure cmd.exe instead of the actual Java process
    const batPath = fs.existsSync(runBatPath) ? runBatPath : fs.existsSync(startBatPath) ? startBatPath : null;
    if (batPath) {
      const parsedArgs = this.parseRunBat(batPath);
      if (parsedArgs) {
        // Filter out any -Xmx/-Xms from the batch file args so OmniHost's limits take precedence
        const filteredArgs = parsedArgs.filter(a => !a.startsWith('-Xmx') && !a.startsWith('-Xms'));
        targetArgs = [...baseFlags, ...filteredArgs];
        // Ensure 'nogui' is present
        if (!targetArgs.includes('nogui')) targetArgs.push('nogui');
      } else {
        // Fallback: could not parse bat file, use cmd.exe (stats may not work)
        this.sendLog(`[System] Warning: Could not parse ${batPath === runBatPath ? 'run.bat' : 'start.bat'}, launching via cmd.exe (resource stats may be inaccurate).`);
        targetExecutable = 'cmd.exe';
        targetArgs = ['/c', batPath === runBatPath ? 'run.bat' : 'start.bat', 'nogui'];
      }
    } else {
      const files = fs.readdirSync(this.serverDir);
      const forgeJar = files.find(f => (f.startsWith('forge-') || f.startsWith('neoforge-')) && f.endsWith('.jar') && !f.includes('installer'));
      if (forgeJar) {
        targetArgs = [...baseFlags, '-jar', forgeJar, 'nogui'];
      } else if (!fs.existsSync(jarPath)) {
        this.sendLog(`[System Error] server.jar or modloader not found! Please delete and recreate this server.`);
        return;
      }
    }

    this.sendLog(`[System] Launching Java with args: ${targetArgs.join(' ')}`);
    this.process = spawn(targetExecutable, targetArgs, { cwd: this.serverDir, env });
    this.javaPid = null;

    if (this.process.pid) {
      this.statsTimer = setInterval(async () => {
        if (!this.process || !this.process.pid) return;
        try {
          const actualPid = await this.getActualPid();
          if (actualPid === 0) return;
          const stats = await pidusage(actualPid);
          BrowserWindow.getAllWindows().forEach(win => {
            if (!win.isDestroyed()) win.webContents.send('server-stats', {
              id: this.serverId,
              cpu: stats.cpu,
              ram: stats.memory
            });
          });
        } catch (e) {
          // PID might not exist anymore (e.g. temporary java check process finished)
          this.javaPid = null;
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
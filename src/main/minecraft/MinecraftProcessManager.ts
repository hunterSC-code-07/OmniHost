import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import semver from 'semver'
import { JavaManager } from '../adapters/JavaManager'
import pidusage from 'pidusage'
import { MinecraftConfigManager } from './MinecraftConfigManager'
import { MinecraftPlayerManager } from './MinecraftPlayerManager'

export class MinecraftProcessManager {
  serverId: number;
  serverDir: string;
  process: ChildProcess | null = null;
  playerManager: MinecraftPlayerManager;
  autoStopTimer: NodeJS.Timeout | null = null;
  statsTimer: NodeJS.Timeout | null = null;
  omnihostMeta: any = {}; 
  javaPid: number | null = null; 
  isFullyStarted: boolean = false; 
  logHistory: string[] = [];

  constructor(serverId: number) {
    this.serverId = serverId;
    this.serverDir = join(app.getPath('userData'), 'servers', serverId.toString());
    this.playerManager = new MinecraftPlayerManager(serverId, this.serverDir);
  }

  sendLog(msg: string) {
    console.log(msg); // Guaranteed VS Code output!
    this.logHistory.push(msg);
    if (this.logHistory.length > 2000) this.logHistory.shift();
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) win.webContents.send('console-log', { id: this.serverId, msg });
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
    await MinecraftConfigManager.init(this.serverDir);
    this.playerManager.clearOnlinePlayers(); 
    this.logHistory = [];
    this.isFullyStarted = false;
    this.playerManager.sendPlayerUpdate();
    
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
    const maxRamGB = this.omnihostMeta.ram ? parseInt(this.omnihostMeta.ram, 10) : 4;
    const minRamGB = Math.min(1, maxRamGB);
    const ramLimit = `-Xmx${maxRamGB}G`;
    const minRam = `-Xms${minRamGB}G`;
    
    // Minimum of 4 cores to prevent World Gen NPE in modern Minecraft
    const safeCpuLimit = this.omnihostMeta.cpu ? Math.max(4, parseInt(this.omnihostMeta.cpu)) : 4;
    const cpuLimit = `-XX:ActiveProcessorCount=${safeCpuLimit}`;

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
        } catch (e: any) {
          // PID might not exist anymore (e.g. temporary java check process finished)
          this.sendLog(`[System Error Debug] Stats error: ${e.message}`);
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

        if (cleanText.match(/Done \(.+?\)! For help, type "help"/i)) {
          this.isFullyStarted = true;
        }

        const joinMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) joined the game/);
        if (joinMatch) {
          this.playerManager.handlePlayerJoin(joinMatch[1]);
        }
        const leaveMatch = cleanText.match(/([a-zA-Z0-9_]{3,16}) left the game/);
        if (leaveMatch) {
          this.playerManager.handlePlayerLeave(leaveMatch[1]);
        }
      });
    }
    this.process.stderr?.on('data', (data) => this.sendLog(`[Minecraft Error]: ${data.toString().trim()}`));
  }

  async stop(): Promise<void> {
    return new Promise(async (resolve) => {
      if (!this.process) {
        resolve();
        return;
      }
      
      this.sendLog(`[System] Stopping Server ${this.serverId}...`);
      this.process.stdin?.write('stop\n');
      
      const p = this.process;
      this.process = null;
      if (this.autoStopTimer) clearTimeout(this.autoStopTimer);
      if (this.statsTimer) clearInterval(this.statsTimer);
      this.autoStopTimer = null;
      this.statsTimer = null;

      // Update stats for all players before clearing them
      await this.playerManager.handleServerStop();

      let isResolved = false;

      p.on('exit', () => {
         if (!isResolved) {
             isResolved = true;
             resolve();
         }
      });

      // Force kill after 15 seconds if it hasn't gracefully exited
      setTimeout(() => {
        if (!isResolved) {
          try {
            if (p.pid) {
              // Check if process is still alive
              process.kill(p.pid, 0);
              this.sendLog(`[System] Server took too long to stop. Force killing process tree...`);
              const { exec } = require('child_process');
              exec(`taskkill /pid ${p.pid} /T /F`, () => {
                 isResolved = true;
                 resolve();
              });
            } else {
              isResolved = true;
              resolve();
            }
          } catch (e) {
            // Process already dead
            isResolved = true;
            resolve();
          }
        }
      }, 15000);
    });
  }
}
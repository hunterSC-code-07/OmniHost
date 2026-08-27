import fs from 'fs'
import { join } from 'path'
import semver from 'semver'
import { JavaManager } from '../adapters/JavaManager'

export class MinecraftCommandBuilder {
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
  static parseRunBat(batPath: string): string[] | null {
    try {
      const content = fs.readFileSync(batPath, 'utf-8');
      const lines = content.split(/\r?\n/);

      let lastJavaArgs: string[] | null = null;

      for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line || line.startsWith('@echo') || line.startsWith('REM') || line.startsWith('rem') ||
            line.startsWith('set ') || line.startsWith('SET ') || line === 'pause' || line === 'PAUSE' ||
            line.startsWith('::') || line.startsWith('if ') || line.startsWith('IF ') ||
            line.startsWith(':') || line.startsWith('echo') || line.startsWith('goto')) {
          continue;
        }

        const javaMatch = line.match(/^(?:@\s*)?(?:"[^"]*[/\\])?(?:java(?:w)?(?:\.exe)?)"?\s+(.*)/i);
        if (javaMatch) {
          const argsString = javaMatch[1];
          const args: string[] = [];
          const tokens = argsString.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
          for (const token of tokens) {
            if (token === '%*' || token === '%1' || token === '%~1') continue; 
            const cleaned = token.replace(/^"(.*)"$/, '$1');
            if (cleaned) args.push(cleaned);
          }
          if (args.length > 0) lastJavaArgs = args;
        }
      }

      return lastJavaArgs;
    } catch (e) {
      return null;
    }
  }

  static async buildCommand(
    serverDir: string, 
    sendLog: (msg: string) => void
  ): Promise<{ targetExecutable: string, targetArgs: string[], env: NodeJS.ProcessEnv } | null> {
    const metaPath = join(serverDir, 'omnihost.json');
    let version = '1.20.4';
    let omnihostMeta: any = {};

    if (fs.existsSync(metaPath)) {
      try {
        omnihostMeta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (omnihostMeta.version) version = omnihostMeta.version;
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
           sendLog(`[System] Downloading Java ${javaRequired}: ${percent}%`);
           lastPercent = percent;
        }
      });
    } catch (err: any) {
      sendLog(`[System] Warning: Failed to download dynamic Java (${err.message}). Falling back to system java.`);
    }

    const jarPath = join(serverDir, 'server.jar');
    const runBatPath = join(serverDir, 'run.bat');
    const startBatPath = join(serverDir, 'start.bat');
    
    let targetExecutable = javaPath;
    const maxRamGB = omnihostMeta.ram ? parseInt(omnihostMeta.ram, 10) : 4;
    const minRamGB = Math.min(1, maxRamGB);
    const ramLimit = `-Xmx${maxRamGB}G`;
    const minRam = `-Xms${minRamGB}G`;
    
    const safeCpuLimit = omnihostMeta.cpu ? Math.max(4, parseInt(omnihostMeta.cpu)) : 4;
    const cpuLimit = `-XX:ActiveProcessorCount=${safeCpuLimit}`;

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

    const batPath = fs.existsSync(runBatPath) ? runBatPath : fs.existsSync(startBatPath) ? startBatPath : null;
    if (batPath) {
      const parsedArgs = this.parseRunBat(batPath);
      if (parsedArgs) {
        const filteredArgs = parsedArgs.filter(a => !a.startsWith('-Xmx') && !a.startsWith('-Xms'));
        targetArgs = [...baseFlags, ...filteredArgs];
        if (!targetArgs.includes('nogui')) targetArgs.push('nogui');
      } else {
        sendLog(`[System] Warning: Could not parse ${batPath === runBatPath ? 'run.bat' : 'start.bat'}, launching via cmd.exe (resource stats may be inaccurate).`);
        targetExecutable = 'cmd.exe';
        targetArgs = ['/c', batPath === runBatPath ? 'run.bat' : 'start.bat', 'nogui'];
      }
    } else {
      const files = fs.readdirSync(serverDir);
      const forgeJar = files.find(f => (f.startsWith('forge-') || f.startsWith('neoforge-')) && f.endsWith('.jar') && !f.includes('installer'));
      if (forgeJar) {
        targetArgs = [...baseFlags, '-jar', forgeJar, 'nogui'];
      } else if (!fs.existsSync(jarPath)) {
        sendLog(`[System Error] server.jar or modloader not found! Please delete and recreate this server.`);
        return null;
      }
    }

    return { targetExecutable, targetArgs, env };
  }
}

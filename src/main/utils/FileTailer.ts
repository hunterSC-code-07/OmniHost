import fs from 'fs';
import { join } from 'path';

export type FileTailerOptions = {
  directory: string;
  filePattern: RegExp | ((filename: string) => boolean);
  startTime: number;
  onLine: (line: string) => void;
  onLog: (msg: string) => void;
};

export class FileTailer {
  private fileWatcher: NodeJS.Timeout | null = null;
  private logWatcher: NodeJS.Timeout | null = null;
  private logFd: number | null = null;
  private lastLogPos: number = 0;
  private logBuffer: string = '';
  private isTailing: boolean = false;

  constructor(private options: FileTailerOptions) {}

  start() {
    this.options.onLog(`[System] Initializing File Tailer at: ${this.options.directory}`);
    if (!fs.existsSync(this.options.directory)) {
      fs.mkdirSync(this.options.directory, { recursive: true });
    }
    this.pollForFile();
  }

  private pollForFile() {
    this.isTailing = true;
    const checkFile = () => {
      if (!this.isTailing) return;
      
      try {
        let files = fs.readdirSync(this.options.directory).filter(f => {
          if (typeof this.options.filePattern === 'function') {
            return this.options.filePattern(f);
          }
          return this.options.filePattern.test(f);
        });
        
        // Only consider files created/modified AFTER the start time
        files = files.filter(f => fs.statSync(join(this.options.directory, f)).mtimeMs > this.options.startTime);
        
        if (files.length > 0) {
          files.sort((a, b) => {
            return fs.statSync(join(this.options.directory, b)).mtimeMs - fs.statSync(join(this.options.directory, a)).mtimeMs;
          });
          const latestFile = join(this.options.directory, files[0]);
          this.tailLogFile(latestFile);
        } else {
          this.fileWatcher = setTimeout(checkFile, 2000);
        }
      } catch (e) {
        this.fileWatcher = setTimeout(checkFile, 2000);
      }
    };
    this.fileWatcher = setTimeout(checkFile, 2000);
  }

  private tailLogFile(filePath: string) {
    this.options.onLog(`[System] Attaching to Log File: ${filePath}`);
    
    try {
      this.logFd = fs.openSync(filePath, 'r');
      this.lastLogPos = 0; // Read from start to catch existing content
      this.logBuffer = ''; // Clear buffer on new file
      this.readNewLogs();

      // Use setInterval instead of fs.watch for much faster and more reliable updates on Windows
      this.logWatcher = setInterval(() => {
        this.readNewLogs();
      }, 500);
    } catch (e) {
      this.options.onLog(`[System Error] Failed to tail log: ${e}`);
    }
  }

  private readNewLogs() {
    if (this.logFd === null) return;
    try {
      const stats = fs.fstatSync(this.logFd);
      if (stats.size > this.lastLogPos) {
        const length = stats.size - this.lastLogPos;
        const buffer = Buffer.alloc(length);
        fs.readSync(this.logFd, buffer, 0, length, this.lastLogPos);
        this.lastLogPos = stats.size;
        
        const content = buffer.toString('utf8');
        this.logBuffer += content;
        
        let newlineIdx;
        while ((newlineIdx = this.logBuffer.indexOf('\n')) !== -1) {
          const line = this.logBuffer.substring(0, newlineIdx).trim();
          this.logBuffer = this.logBuffer.substring(newlineIdx + 1);
          
          if (line) {
            this.options.onLine(line);
          }
        }
      }
    } catch (e) {}
  }

  stop() {
    this.isTailing = false;
    if (this.fileWatcher) {
      clearTimeout(this.fileWatcher);
      this.fileWatcher = null;
    }
    if (this.logWatcher) {
      clearInterval(this.logWatcher);
      this.logWatcher = null;
    }
    if (this.logFd !== null) {
      try {
        fs.closeSync(this.logFd);
      } catch (e) {}
      this.logFd = null;
    }
  }
}

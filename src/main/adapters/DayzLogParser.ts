import { join } from 'path';
import { FileTailer, IFileTailer } from '../utils/FileTailer';

type LogCallback = (msg: string) => void;
type PlayerCallback = (playerName: string, isConnected: boolean) => void;

export class DayzLogParser {
  private tailer: IFileTailer | null = null;

  constructor(
    private serverDir: string,
    private startTime: number,
    private onLog: LogCallback,
    private onPlayerUpdate: PlayerCallback
  ) {}

  setupLogWatcher() {
    const profilesDir = join(this.serverDir, 'Profiles');
    this.tailer = new FileTailer({
      directory: profilesDir,
      filePattern: (f) => f.toLowerCase().endsWith('.adm'),
      startTime: this.startTime,
      onLog: this.onLog,
      onLine: (line) => {
        this.onLog(`[DayZ] ${line}`);
        this.parseLogLine(line);
      }
    });
    this.tailer.start();
  }

  private parseLogLine(line: string) {
    const connectedMatch = line.match(/Player "([^"]+)" .*?is connected/i);
    if (connectedMatch) {
      const pName = connectedMatch[1];
      this.onPlayerUpdate(pName, true);
    }
    
    const disconnectedMatch = line.match(/Player "([^"]+)" .*?has been disconnected/i);
    if (disconnectedMatch) {
      const pName = disconnectedMatch[1];
      this.onPlayerUpdate(pName, false);
    }
  }

  cleanup() {
    if (this.tailer) {
      this.tailer.stop();
      this.tailer = null;
    }
  }
}

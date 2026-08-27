import { exec } from 'child_process'
import fs from 'fs'
import { shell } from 'electron'
import { IVpnAdapter } from './IVpnAdapter'

export type RadminLogCallback = (msg: string) => void;

export class RadminVpnAdapter implements IVpnAdapter {
  private exePath: string = 'C:\\Program Files (x86)\\Radmin VPN\\RvRvpnGui.exe';
  private onLog: RadminLogCallback;

  constructor(onLog?: RadminLogCallback) {
    this.onLog = onLog || (() => {});
  }

  private sendLog(msg: string) {
    this.onLog(msg);
  }

  public isInstalled(): boolean {
    return fs.existsSync(this.exePath);
  }

  public install() {
    this.sendLog('[System] Opening Radmin VPN download page...');
    shell.openExternal('https://www.radmin-vpn.com/download/Radmin_VPN.exe');
  }

  public async open(): Promise<boolean> {
    if (!this.isInstalled()) return false;
    
    this.sendLog(`[Radmin VPN] Launching Radmin VPN application...`);
    
    return new Promise((resolve) => {
      exec(`"${this.exePath}"`, () => {
        // We ignore errors here because Radmin VPN's GUI executable often returns 
        // non-zero exit codes (e.g. if an instance is already running) even though it succeeds.
      });
      // The exec callback might not fire until the app is closed, 
      // so we resolve immediately after spawning it
      setTimeout(() => {
        this.sendLog(`[Radmin VPN] Successfully launched application.`);
        resolve(true);
      }, 1000);
    });
  }

  public async getIp(): Promise<string | null> {
    return new Promise((resolve) => {
      exec('ipconfig /all', (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        const lines = stdout.split('\n').map(l => l.trim());
        let inRadminAdapter = false;
        
        for (const line of lines) {
          if (line.includes('Famatech Radmin VPN Ethernet Adapter')) {
            inRadminAdapter = true;
          } else if (line.startsWith('Ethernet adapter') || line.startsWith('Unknown adapter') || line.startsWith('Wireless LAN adapter')) {
            if (inRadminAdapter) {
              break; 
            }
          } else if (inRadminAdapter && line.startsWith('IPv4 Address')) {
            const parts = line.split(':');
            if (parts.length > 1) {
              const ipWithExtra = parts[1].trim();
              const ip = ipWithExtra.split('(')[0].trim();
              resolve(ip);
              return;
            }
          }
        }
        
        resolve(null); 
      });
    });
  }
}

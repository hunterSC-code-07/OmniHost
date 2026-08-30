import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import os from 'os'
import axios from 'axios'
import AdmZip from 'adm-zip'

export abstract class BaseFrpAdapter {
  process: ChildProcess | null = null;
  frpDir: string;
  exePath: string;
  configPath: string;

  constructor() {
    this.frpDir = join(app.getPath('userData'), 'frp_client');
    this.exePath = join(this.frpDir, 'frpc.exe');
    this.configPath = join(this.frpDir, 'frpc.toml');
  }

  abstract getProxyConfig(localIp: string): string;

  sendLog(msg: string) {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('console-log', { id: 'global', msg });
    }
  }

  async start(ip: string = "34.131.235.17") {
    if (!fs.existsSync(this.frpDir)) fs.mkdirSync(this.frpDir, { recursive: true });

    // 1. Download and Extract FRP from GitHub
    if (!fs.existsSync(this.exePath)) {
      this.sendLog('[System] Downloading FRP Client from GitHub...');
      const zipPath = join(this.frpDir, 'frp.zip');
      const url = 'https://github.com/fatedier/frp/releases/download/v0.58.1/frp_0.58.1_windows_amd64.zip';
      
      const response = await axios({ url, method: 'GET', responseType: 'arraybuffer' });
      fs.writeFileSync(zipPath, response.data);
      
      this.sendLog('[System] Extracting FRP...');
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();
      
      // Look inside the zip to find the specific frpc.exe file
      for (const entry of zipEntries) {
        if (entry.entryName.endsWith('frpc.exe')) {
           fs.writeFileSync(this.exePath, entry.getData());
        }
      }
      fs.unlinkSync(zipPath); // Clean up the zip file
      this.sendLog('[System] Extraction complete!');
    }

    // 2. Build the FRP Configuration
    // Get the local LAN IP to prevent game servers dropping loopback packets (127.0.0.1)
    let localIp = '127.0.0.1';
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      if (name.toLowerCase().includes('nordlynx') || name.toLowerCase().includes('vpn')) continue;
      for (const iface of interfaces[name]!) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
    }

    const proxyConfig = this.getProxyConfig(localIp);

    const tomlConfig = `
serverAddr = "${ip}"
serverPort = 7000
${proxyConfig}
`;
    fs.writeFileSync(this.configPath, tomlConfig);

    this.sendLog('[FRP Tunnel] Connecting to the Cloud Server...');
    
    // Clean up any zombie frpc processes before starting
    const { exec } = await import('child_process');
    await new Promise<void>((resolve) => {
      exec('taskkill /F /IM frpc.exe', () => {
        resolve();
      });
    });

    // 3. Launch the Client
    this.process = spawn(this.exePath, ['-c', this.configPath], { cwd: this.frpDir });

    this.process.stdout?.on('data', (data) => this.sendLog(`[FRP]: ${data.toString().trim()}`));
    this.process.stderr?.on('data', (data) => this.sendLog(`[FRP Error]: ${data.toString().trim()}`));
    
    this.process.on('error', (err) => {
      this.sendLog(`[FRP Fatal]: ${err.message}`);
    });
  }

  stop() {
    if (this.process) {
      this.sendLog('[FRP Tunnel] Disconnecting...');
      this.process.kill('SIGKILL');
      import('child_process').then(cp => cp.exec('taskkill /F /IM frpc.exe'));
      this.process = null;
    }
  }
}

import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { app, BrowserWindow, dialog } from 'electron'
import fs from 'fs'
import os from 'os'
import axios from 'axios'
import AdmZip from 'adm-zip'
import { exec } from 'child_process'

export class FrpAdapter {
  process: ChildProcess | null = null;
  frpDir: string;
  exePath: string;
  configPath: string;
  hasPromptedDefender: boolean = false;

  constructor() {
    this.frpDir = join(app.getPath('userData'), 'frp_client');
    this.exePath = join(this.frpDir, 'omnihost_tunnel.exe');
    this.configPath = join(this.frpDir, 'frpc.toml');
  }

  sendLog(msg: string) {
    console.log(msg); // Log to backend terminal so user can see it
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].webContents.send('console-log', { id: 'global', msg });
    }
  }

  handleDefenderBlock() {
    if (this.hasPromptedDefender) return;
    this.hasPromptedDefender = true;
    
    dialog.showMessageBox({
      type: 'warning',
      title: 'Windows Defender Blocked Tunnel',
      message: 'Windows Defender (or your antivirus) has blocked the tunneling client (FRP) because it is a network proxy tool.',
      detail: 'Would you like to automatically add an exclusion for it? You will be prompted for Administrator privileges.',
      buttons: ['Yes, add exclusion', 'No, I will do it manually'],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 0) {
        const script = `Add-MpPreference -ExclusionPath '${this.frpDir}'`;
        const b64 = Buffer.from(script, 'utf16le').toString('base64');
        const psCommand = `Start-Process powershell -ArgumentList '-EncodedCommand ${b64}' -Verb RunAs -WindowStyle Hidden`;
        exec(`powershell -Command "${psCommand}"`, (err) => {
          if (err) {
            this.sendLog(`[System] Failed to add exclusion: ${err.message}`);
          } else {
            this.sendLog('[System] Exclusion added! Cleaning up blocked client...');
            try {
              if (fs.existsSync(this.exePath)) fs.unlinkSync(this.exePath);
            } catch (e) {
              this.sendLog(`[System] Warning: could not delete old client - ${e.message}`);
            }
            this.sendLog('[System] Please click start again.');
            this.hasPromptedDefender = false;
          }
        });
      } else {
        this.hasPromptedDefender = false;
      }
    });
  }

  async start(ip: string = "34.131.235.17") {
    if (!fs.existsSync(this.frpDir)) fs.mkdirSync(this.frpDir, { recursive: true });

    // 1. Download and Extract FRP from GitHub
    let needsDownload = !fs.existsSync(this.exePath);
    if (!needsDownload) {
      try {
        const stats = fs.statSync(this.exePath);
        if (stats.size < 1000000) needsDownload = true; // less than 1MB means it's corrupted/quarantined
      } catch (e) {
        needsDownload = true;
      }
    }

    if (needsDownload) {
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

    const tomlConfig = `
serverAddr = "${ip}"
serverPort = 7000

[[proxies]]
name = "minecraft-${Date.now()}"
type = "tcp"
localIP = "${localIp}"
localPort = 25565
remotePort = 25565

[[proxies]]
name = "minecraft-udp"
type = "udp"
localIP = "${localIp}"
localPort = 25565
remotePort = 25565

[[proxies]]
name = "dayz-game"
type = "udp"
localIP = "${localIp}"
localPort = 2302
remotePort = 2302

[[proxies]]
name = "dayz-steam-query"
type = "udp"
localIP = "${localIp}"
localPort = 2303
remotePort = 2303

[[proxies]]
name = "dayz-steam-master-8766"
type = "udp"
localIP = "${localIp}"
localPort = 8766
remotePort = 8766

[[proxies]]
name = "dayz-steam-master-2304"
type = "udp"
localIP = "${localIp}"
localPort = 2304
remotePort = 2304

[[proxies]]
name = "dayz-von"
type = "udp"
localIP = "${localIp}"
localPort = 2305
remotePort = 2305

[[proxies]]
name = "dayz-battleye"
type = "udp"
localIP = "${localIp}"
localPort = 2306
remotePort = 2306

[[proxies]]
name = "dayz-steam"
type = "udp"
localIP = "${localIp}"
localPort = 27016
remotePort = 27016

[[proxies]]
name = "7dtd-tcp-26900"
type = "tcp"
localIP = "${localIp}"
localPort = 26900
remotePort = 26900

[[proxies]]
name = "7dtd-udp-26900"
type = "udp"
localIP = "${localIp}"
localPort = 26900
remotePort = 26900

[[proxies]]
name = "7dtd-udp-26901"
type = "udp"
localIP = "${localIp}"
localPort = 26901
remotePort = 26901

[[proxies]]
name = "7dtd-udp-26902"
type = "udp"
localIP = "${localIp}"
localPort = 26902
remotePort = 26902
`;
    fs.writeFileSync(this.configPath, tomlConfig);

    this.sendLog('[FRP Tunnel] Connecting to the Cloud Server...');
    
    // Clean up any zombie frpc processes before starting
    import('child_process').then(cp => {
      cp.exec('taskkill /F /IM omnihost_tunnel.exe', () => {
        setTimeout(() => {
          // 3. Launch the Client
          this.process = spawn(this.exePath, ['-c', this.configPath], { cwd: this.frpDir, shell: true });

          this.process.stdout?.on('data', (data) => this.sendLog(`[FRP]: ${data.toString().trim()}`));
          this.process.stderr?.on('data', (data) => {
            const msg = data.toString().trim();
            this.sendLog(`[FRP Error]: ${msg}`);
            if (msg.toLowerCase().includes('access is denied') || msg.toLowerCase().includes('access denied')) {
              this.handleDefenderBlock();
            }
          });
          
          this.process.on('error', (err) => {
            this.sendLog(`[FRP Fatal]: ${err.message}`);
            if (err.message.toLowerCase().includes('eacces')) {
              this.handleDefenderBlock();
            }
          });
        }, 1000);
      });
    });
  }

  stop() {
    if (this.process) {
      this.sendLog('[FRP Tunnel] Disconnecting...');
      this.process.kill('SIGKILL');
      import('child_process').then(cp => cp.exec('taskkill /F /IM omnihost_tunnel.exe'));
      this.process = null;
    }
  }
}
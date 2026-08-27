import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import yauzl from 'yauzl'; 
import { IncomingMessage } from 'http';
import https from 'https';

export class PalworldModManager {
  private static getApiKey(): string {
    const key = process.env.CURSEFORGE_API_KEY;
    if (!key) throw new Error('CURSEFORGE_API_KEY is not set in .env');
    return key;
  }

  private static fetchCurseForge<T>(endpoint: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const apiKey = this.getApiKey();
      
      const options = {
        hostname: 'api.curseforge.com',
        path: `/v1${endpoint}`,
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        }
      };

      https.get(options, (res: IncomingMessage) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`CurseForge API error: ${res.statusCode} ${data}`));
            return;
          }
          resolve(JSON.parse(data));
        });
      }).on('error', reject);
    });
  }

  private static async getPalworldGameId(): Promise<number> {
    const res = await this.fetchCurseForge<{ data: any[] }>('/games?name=Palworld');
    if (res.data && res.data.length > 0) {
      return res.data[0].id;
    }
    throw new Error('Could not find Palworld on CurseForge');
  }

  static async searchMods(query: string, categoryId?: number, index = 0, pageSize = 20) {
    try {
      const gameId = await this.getPalworldGameId();
      let url = `/mods/search?gameId=${gameId}&searchFilter=${encodeURIComponent(query)}&index=${index}&pageSize=${pageSize}&sortField=2&sortOrder=desc`;
      if (categoryId) url += `&categoryId=${categoryId}`;
      
      const res = await this.fetchCurseForge<any>(url);
      return res.data;
    } catch (e: any) {
      console.error(e);
      return { error: e.message };
    }
  }

  static async installMod(serverId: number, modId: number, fileId: number) {
    try {
      // 1. Get Mod File Details
      const fileRes = await this.fetchCurseForge<{ data: { downloadUrl: string, fileName: string } }>(`/mods/${modId}/files/${fileId}`);
      if (!fileRes.data || !fileRes.data.downloadUrl) {
        throw new Error('Could not find download URL for this mod file');
      }

      const downloadUrl = fileRes.data.downloadUrl;
      const fileName = fileRes.data.fileName;
      
      const serverDir = path.join(app.getPath('userData'), 'servers', serverId.toString());
      const tempZip = path.join(serverDir, fileName);

      // 2. Download the zip file
      await new Promise<void>((resolve, reject) => {
        https.get(downloadUrl, (res) => {
          const fileStream = fs.createWriteStream(tempZip);
          res.pipe(fileStream);
          fileStream.on('finish', () => resolve());
          fileStream.on('error', reject);
        }).on('error', reject);
      });

      // 3. Extract based on type (Pak vs UE4SS)
      const extractTemp = path.join(serverDir, `extract_${modId}`);
      if (fs.existsSync(extractTemp)) fs.rmSync(extractTemp, { recursive: true, force: true });
      fs.mkdirSync(extractTemp, { recursive: true });

      await extract(tempZip, { dir: extractTemp });

      const installPak = (dir: string) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            installPak(fullPath);
          } else if (file.endsWith('.pak')) {
            const paksDir = path.join(serverDir, 'Pal', 'Content', 'Paks', 'LogicMods');
            if (!fs.existsSync(paksDir)) fs.mkdirSync(paksDir, { recursive: true });
            fs.copyFileSync(fullPath, path.join(paksDir, file));
          } else if (file === 'Scripts') {
            const ue4ssDir = path.join(serverDir, 'Pal', 'Binaries', 'Win64', 'Mods');
            if (!fs.existsSync(ue4ssDir)) fs.mkdirSync(ue4ssDir, { recursive: true });
          }
        }
      };

      installPak(extractTemp);

      fs.unlinkSync(tempZip);
      fs.rmSync(extractTemp, { recursive: true, force: true });

      return true;
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }

  private static async extractMod(zipPath: string, serverDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err || !zipfile) return reject(err);
        
        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
          if (/\/$/.test(entry.fileName)) {
            zipfile.readEntry();
          } else {
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err || !readStream) return reject(err);

              let destPath = '';
              if (entry.fileName.toLowerCase().endsWith('.pak')) {
                destPath = path.join(serverDir, 'Pal', 'Content', 'Paks', 'LogicMods', path.basename(entry.fileName));
              } else if (entry.fileName.toLowerCase().endsWith('main.lua') || entry.fileName.includes('Scripts/')) {
                const modFolderName = entry.fileName.split('/')[0];
                destPath = path.join(serverDir, 'Pal', 'Binaries', 'Win64', 'Mods', modFolderName, path.basename(entry.fileName));
              } else {
                zipfile.readEntry();
                return;
              }

              const dir = path.dirname(destPath);
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

              const writeStream = fs.createWriteStream(destPath);
              readStream.pipe(writeStream);
              writeStream.on('close', () => zipfile.readEntry());
            });
          }
        });
        zipfile.on('end', () => resolve());
      });
    });
  }

  static async getInstalledMods(serverId: number) {
    const serverDir = path.join(app.getPath('userData'), 'servers', serverId.toString());
    const pakDir = path.join(serverDir, 'Pal', 'Content', 'Paks', 'LogicMods');
    const scriptsDir = path.join(serverDir, 'Pal', 'Binaries', 'Win64', 'Mods');
    
    const installed: { type: string, name: string }[] = [];
    if (fs.existsSync(pakDir)) {
      const paks = fs.readdirSync(pakDir).filter(f => f.endsWith('.pak'));
      installed.push(...paks.map(p => ({ type: 'Pak', name: p })));
    }
    
    if (fs.existsSync(scriptsDir)) {
      const scripts = fs.readdirSync(scriptsDir).filter(f => fs.statSync(path.join(scriptsDir, f)).isDirectory() && f !== 'shared');
      installed.push(...scripts.map(s => ({ type: 'UE4SS', name: s })));
    }
    
    return installed;
  }
}

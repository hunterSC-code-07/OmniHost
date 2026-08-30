import { app } from 'electron';
import { join } from 'path';
import fs from 'fs';
import axios from 'axios';

export interface ModInfo {
  mod_reference: string;
  name: string;
  short_description: string;
  views: number;
  downloads: number;
  versions: ModVersion[];
  logo: string;
}

export interface ModVersion {
  version: string;
  link: string;
  dependencies: { mod_id: string; condition: string }[];
}

export class SatisfactoryModManager {
  private static getModsDir(serverId: number): string {
    return join(app.getPath('userData'), 'servers', serverId.toString(), 'FactoryGame', 'Mods');
  }

  private static ensureModsDir(serverId: number) {
    const dir = this.getModsDir(serverId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static async searchMods(query: string, limit: number = 20, offset: number = 0): Promise<ModInfo[]> {
    const filterParts = [`limit: ${limit}`, `offset: ${offset}`, `order_by: views`];
    if (query && query.trim() !== '') {
      filterParts.push(`search: "${query}"`);
    }
    const filterString = filterParts.join(', ');

    const graphqlQuery = `
      query {
        getMods(filter: { ${filterString} }) {
          mods {
            mod_reference
            name
            short_description
            views
            downloads
            logo
            versions(filter: { limit: 1 }) {
              version
              link
              dependencies {
                mod_id
                condition
              }
            }
          }
        }
      }
    `;

    try {
      const response = await axios.post('https://api.ficsit.app/v2/query', { query: graphqlQuery });
      return response.data.data.getMods.mods;
    } catch (error) {
      console.error('Error fetching mods from SMR:', error);
      throw new Error('Failed to fetch mods from Satisfactory Mod Repository.');
    }
  }

  static getInstalledMods(serverId: number): string[] {
    const dir = this.getModsDir(serverId);
    if (!fs.existsSync(dir)) return [];
    
    return fs.readdirSync(dir).filter(file => file.endsWith('.smod'));
  }

  static async installMod(serverId: number, modReference: string, downloadLink: string): Promise<void> {
    this.ensureModsDir(serverId);
    const targetPath = join(this.getModsDir(serverId), `${modReference}.smod`);
    
    try {
      const fullUrl = downloadLink.startsWith('/') ? `https://api.ficsit.app${downloadLink}` : downloadLink;
      const response = await axios({
        method: 'GET',
        url: fullUrl,
        responseType: 'stream'
      });
      
      const writer = fs.createWriteStream(targetPath);
      response.data.pipe(writer);
      
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(`Error downloading mod ${modReference}:`, error);
      throw new Error(`Failed to download mod ${modReference}.`);
    }
  }

  static uninstallMod(serverId: number, modFilename: string): void {
    const targetPath = join(this.getModsDir(serverId), modFilename);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  }
}

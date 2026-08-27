import axios from 'axios';
import { IServerDownloaderStrategy, DownloadConfig } from './IServerDownloaderStrategy';

export class ForgeStrategy implements IServerDownloaderStrategy {
  async getVersions(): Promise<string[]> {
    try {
      const res = await axios.get(
        'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
      );
      const promos = res.data.promos;
      const versions = new Set<string>();
      for (const key of Object.keys(promos)) {
        if (key.endsWith('-latest')) {
          versions.add(key.replace('-latest', ''));
        }
      }
      return Array.from(versions).reverse();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getLoaderVersions(mcVersion: string): Promise<string[]> {
    try {
      const promoRes = await axios.get(
        'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
      );
      const recommended = promoRes.data.promos[`${mcVersion}-recommended`];

      const mavenRes = await axios.get(
        'https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml'
      );
      const xml = mavenRes.data;
      const versionMatches = xml.match(/<version>(.*?)<\/version>/g) || [];

      const versions = new Set<string>();
      for (const vTag of versionMatches) {
        const v = vTag.replace('<version>', '').replace('</version>', '');
        if (v.startsWith(mcVersion + '-')) {
          versions.add(v.replace(mcVersion + '-', ''));
        }
      }

      let result = Array.from(versions).sort((a, b) => {
        const vA = a.split('.').map(Number);
        const vB = b.split('.').map(Number);
        for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
          const numA = vA[i] || 0;
          const numB = vB[i] || 0;
          if (numA !== numB) return numB - numA;
        }
        return 0;
      });

      if (recommended && result.includes(recommended)) {
        result = result.filter((v) => v !== recommended);
        result.unshift(recommended + ' (Recommended)');
      }
      return result;
    } catch (e: any) {
      console.error('Error fetching loader versions:', e.message);
      return [];
    }
  }

  async getDownloadConfig(version: string, loaderVersion?: string): Promise<DownloadConfig> {
    let forgeVersion = loaderVersion ? loaderVersion.replace(' (Recommended)', '') : null;
    if (!forgeVersion) {
      const forgeRes = await axios.get(
        'https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json'
      );
      forgeVersion =
        forgeRes.data.promos[version + '-latest'] ||
        forgeRes.data.promos[version + '-recommended'];
    }
    if (!forgeVersion) throw new Error('Forge version not found for ' + version);
    const downloadUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${version}-${forgeVersion}/forge-${version}-${forgeVersion}-installer.jar`;

    return {
      downloadUrl,
      isInstaller: true,
      installerArgs: ['--installServer'],
      buildNumberStr: ''
    };
  }
}

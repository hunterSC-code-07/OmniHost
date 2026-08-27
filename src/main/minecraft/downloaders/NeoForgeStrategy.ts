import axios from 'axios';
import semver from 'semver';
import { IServerDownloaderStrategy, DownloadConfig } from './IServerDownloaderStrategy';

export class NeoForgeStrategy implements IServerDownloaderStrategy {
  async getVersions(): Promise<string[]> {
    try {
      const res = await axios.get(
        'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge'
      );
      const all: string[] = res.data.versions;
      const mcVersions = new Set<string>();
      for (const v of all) {
        const parts = v.split('.');
        if (parts.length >= 2) {
          if (parts[0] === '20' || parts[0] === '21') {
            mcVersions.add('1.' + parts[0] + '.' + parts[1]);
          } else {
            mcVersions.add(parts[0] + '.' + parts[1]);
          }
        }
      }
      return Array.from(mcVersions).reverse();
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getLoaderVersions(mcVersion: string): Promise<string[]> {
    try {
      const res = await axios.get(
        'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge'
      );
      const all: string[] = res.data.versions;

      let prefix = mcVersion.replace('1.', '');
      if (mcVersion.startsWith('1.20') || mcVersion.startsWith('1.21')) {
        prefix = prefix.split('.')[0] + '.';
      } else {
        prefix = prefix + '.';
      }

      const versions = all.filter((v: string) => v.startsWith(prefix));
      return versions.sort((a, b) => {
        const vA = a.split('.').map(Number);
        const vB = b.split('.').map(Number);
        for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
          const numA = vA[i] || 0;
          const numB = vB[i] || 0;
          if (numA !== numB) return numB - numA;
        }
        return 0;
      });
    } catch (e: any) {
      console.error('Error fetching loader versions:', e.message);
      return [];
    }
  }

  async getDownloadConfig(version: string, loaderVersion?: string): Promise<DownloadConfig> {
    let neoVersion = loaderVersion ? loaderVersion.replace(' (Recommended)', '') : null;
    if (!neoVersion) {
      const neoRes = await axios.get(
        'https://maven.neoforged.net/api/maven/versions/releases/net/neoforged/neoforge'
      );
      const all: string[] = neoRes.data.versions;
      const prefix = version.startsWith('1.') ? version.substring(2) : version;
      const matched = all
        .filter((v: string) => v.startsWith(prefix + '.'))
        .sort((a: string, b: string) => semver.rcompare(semver.coerce(a)!, semver.coerce(b)!));
      if (matched.length === 0) throw new Error('NeoForge version not found for ' + version);
      neoVersion = matched[0];
    }
    const downloadUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVersion}/neoforge-${neoVersion}-installer.jar`;

    return {
      downloadUrl,
      isInstaller: true,
      installerArgs: ['--installServer'],
      buildNumberStr: ''
    };
  }
}

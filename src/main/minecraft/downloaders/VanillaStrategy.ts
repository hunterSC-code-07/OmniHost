import axios from 'axios';
import semver from 'semver';
import { IServerDownloaderStrategy, DownloadConfig } from './IServerDownloaderStrategy';

export class VanillaStrategy implements IServerDownloaderStrategy {
  async getVersions(): Promise<string[]> {
    try {
      const res = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
      const releases = res.data.versions.filter((v: any) => v.type === 'release');
      return releases
        .map((v: any) => v.id)
        .filter((v: string) => {
          const coerced = semver.coerce(v);
          return coerced && semver.gte(coerced, '1.16.0');
        });
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getDownloadConfig(version: string): Promise<DownloadConfig> {
    const manifestRes = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json');
    const vData = manifestRes.data.versions.find((v: any) => v.id === version);
    if (!vData) throw new Error('Version not found');
    const vRes = await axios.get(vData.url);
    const downloadUrl = vRes.data.downloads.server.url;

    return {
      downloadUrl,
      isInstaller: false,
      installerArgs: [],
      buildNumberStr: ''
    };
  }
}

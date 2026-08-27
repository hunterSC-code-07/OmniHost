import axios from 'axios';
import { IServerDownloaderStrategy, DownloadConfig } from './IServerDownloaderStrategy';

export class FabricStrategy implements IServerDownloaderStrategy {
  async getVersions(): Promise<string[]> {
    try {
      const res = await axios.get('https://meta.fabricmc.net/v2/versions/game');
      return res.data.filter((v: any) => v.stable).map((v: any) => v.version);
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getLoaderVersions(_mcVersion: string): Promise<string[]> {
    try {
      const res = await axios.get('https://meta.fabricmc.net/v2/versions/loader');
      const loaders = res.data;
      return loaders.map((l: any) => l.version);
    } catch (e: any) {
      console.error('Error fetching loader versions:', e.message);
      return [];
    }
  }

  async getDownloadConfig(version: string, loaderVersion?: string): Promise<DownloadConfig> {
    const loader = loaderVersion
      ? loaderVersion.replace(' (Recommended)', '')
      : (await axios.get('https://meta.fabricmc.net/v2/versions/loader')).data.find(
          (v: any) => v.stable
        ).version;
    const installerRes = await axios.get('https://meta.fabricmc.net/v2/versions/installer');
    const installer = installerRes.data.find((v: any) => v.stable).version;
    const downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/${loader}/${installer}/server/jar`;

    return {
      downloadUrl,
      isInstaller: false,
      installerArgs: [],
      buildNumberStr: ''
    };
  }
}

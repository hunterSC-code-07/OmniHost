import axios from 'axios';
import semver from 'semver';
import { IServerDownloaderStrategy, DownloadConfig } from './IServerDownloaderStrategy';

export class PaperStrategy implements IServerDownloaderStrategy {
  async getVersions(): Promise<string[]> {
    try {
      const res = await axios.get('https://fill.papermc.io/v3/projects/paper', {
        headers: { 'User-Agent': 'OmniHost/1.0.0 (contact@example.com)' }
      });
      const versionsObj = res.data.versions;
      let allVersions: string[] = [];
      for (const key of Object.keys(versionsObj)) {
        allVersions = allVersions.concat(versionsObj[key]);
      }
      return allVersions
        .filter((v: string) => {
          const coerced = semver.coerce(v);
          return coerced && semver.gte(coerced, '1.16.0');
        })
        .sort((a, b) => {
          const cA = semver.coerce(a);
          const cB = semver.coerce(b);
          return cA && cB ? semver.rcompare(cA, cB) : 0;
        }); // newest first
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async getDownloadConfig(version: string): Promise<DownloadConfig> {
    const buildsRes = await axios.get(
      `https://fill.papermc.io/v3/projects/paper/versions/${version}`,
      { headers: { 'User-Agent': 'OmniHost/1.0.0 (contact@example.com)' } }
    );
    const build = buildsRes.data.builds[0];
    const buildNumberStr = `-b${build}`;
    const buildData = await axios.get(
      `https://fill.papermc.io/v3/projects/paper/versions/${version}/builds/${build}`,
      { headers: { 'User-Agent': 'OmniHost/1.0.0 (contact@example.com)' } }
    );
    const downloadUrl = buildData.data.downloads['server:default'].url;

    return {
      downloadUrl,
      isInstaller: false,
      installerArgs: [],
      buildNumberStr
    };
  }
}

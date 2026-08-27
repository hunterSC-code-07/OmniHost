export interface DownloadConfig {
  downloadUrl: string;
  isInstaller: boolean;
  installerArgs: string[];
  buildNumberStr: string;
}

export interface IServerDownloaderStrategy {
  getVersions(): Promise<string[]>;
  getLoaderVersions?(mcVersion: string): Promise<string[]>;
  getDownloadConfig(version: string, loaderVersion?: string): Promise<DownloadConfig>;
}

import fsPromises from 'fs/promises'
import semver from 'semver'
import { spawn } from 'child_process'
import { CacheManager } from '../CacheManager'
import { JavaManager } from '../adapters/JavaManager'
import { join } from 'path'
import { app } from 'electron'

import { IServerDownloaderStrategy } from './downloaders/IServerDownloaderStrategy'
import { VanillaStrategy } from './downloaders/VanillaStrategy'
import { PaperStrategy } from './downloaders/PaperStrategy'
import { FabricStrategy } from './downloaders/FabricStrategy'
import { ForgeStrategy } from './downloaders/ForgeStrategy'
import { NeoForgeStrategy } from './downloaders/NeoForgeStrategy'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export class MinecraftDownloader {
  private static strategies: Record<string, IServerDownloaderStrategy> = {
    'Vanilla': new VanillaStrategy(),
    'Paper': new PaperStrategy(),
    'Fabric': new FabricStrategy(),
    'Forge': new ForgeStrategy(),
    'NeoForge': new NeoForgeStrategy()
  };

  static getStrategy(type: string): IServerDownloaderStrategy {
    const strategy = this.strategies[type];
    if (!strategy) throw new Error(`Strategy not found for server type: ${type}`);
    return strategy;
  }

  static async getVanillaVersions() { return this.getStrategy('Vanilla').getVersions(); }
  static async getPaperVersions() { return this.getStrategy('Paper').getVersions(); }
  static async getFabricVersions() { return this.getStrategy('Fabric').getVersions(); }
  static async getForgeVersions() { return this.getStrategy('Forge').getVersions(); }
  static async getNeoForgeVersions() { return this.getStrategy('NeoForge').getVersions(); }

  static async getLoaderVersions(type: string, mcVersion: string) {
    const strategy = this.getStrategy(type);
    if (strategy.getLoaderVersions) {
      return strategy.getLoaderVersions(mcVersion);
    }
    return [];
  }

  static async downloadServerJar(event: any, id: number, type: string, version: string, loaderVersion: string) {
    const serverDir = join(app.getPath('userData'), 'servers', id.toString())
    const jarPath = join(serverDir, 'server.jar')
    const installerPath = join(serverDir, 'installer.jar')

    try {
      const strategy = this.getStrategy(type);
      const config = await strategy.getDownloadConfig(version, loaderVersion);

      if (!config.downloadUrl) throw new Error('Could not resolve download URL');

      const targetPath = config.isInstaller ? installerPath : jarPath;
      const fileName = `${type}-${version}${config.buildNumberStr}${config.isInstaller ? '-installer' : ''}.jar`;

      const cachedFile = await CacheManager.getOrDownload(
        'jars',
        config.downloadUrl,
        fileName,
        (progress, text) => {
          event.sender.send(
            `download-progress-${id}`,
            progress,
            config.isInstaller
              ? text === 'Downloading...'
                ? 'Downloading Installer...'
                : text
              : text === 'Downloading...'
                ? 'Downloading Jar...'
                : text
          )
        }
      );

      await fsPromises.copyFile(cachedFile, targetPath);

      if (config.isInstaller) {
        event.sender.send(`download-progress-${id}`, 100, 'Installing Modloader...')

        let javaRequired: 8 | 16 | 17 | 21 | 25 = 17
        const coerced = semver.coerce(version)
        if (coerced) {
          if (semver.lt(coerced, '1.17.0')) javaRequired = 8
          else if (semver.lt(coerced, '1.18.0')) javaRequired = 16
          else if (semver.lt(coerced, '1.20.5')) javaRequired = 17
          else if (semver.lt(coerced, '26.0.0')) javaRequired = 21
          else javaRequired = 25
        }

        const javaPath = await JavaManager.getJavaPath(javaRequired)

        await new Promise((resolve, reject) => {
          const proc = spawn(javaPath, ['-jar', 'installer.jar', ...config.installerArgs], {
            cwd: serverDir,
            stdio: 'inherit'
          })
          proc.on('close', (code) => {
            if (code === 0) resolve(true)
            else reject(new Error('Installer failed with code ' + code))
          })
          proc.on('error', reject)
        })

        if (await exists(installerPath)) {
          await fsPromises.unlink(installerPath)
        }
      }

      return true
    } catch (e: any) {
      console.error(e)
      throw new Error(e.message)
    }
  }
}

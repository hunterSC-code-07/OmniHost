import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';

export class CacheManager {
  static getCacheDir() {
    return path.join(app.getPath('userData'), 'omnihost-cache');
  }

  static getCategoryDir(category: string) {
    const dir = path.join(this.getCacheDir(), category);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  static getSafeFilename(downloadUrl: string, originalFilename: string) {
    const hash = crypto.createHash('md5').update(downloadUrl).digest('hex').substring(0, 8);
    return `${hash}-${originalFilename}`;
  }

  static getFolderSize(dir: string): number {
    if (!fs.existsSync(dir)) return 0;

    let totalSize = 0;
    const calculateSize = (folderPath: string) => {
      try {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
          try {
            const fullPath = path.join(folderPath, file);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
              calculateSize(fullPath);
            } else {
              totalSize += stats.size;
            }
          } catch (e) {
            console.error(`Failed to stat ${file}:`, e);
          }
        }
      } catch (e) {
        console.error(`Failed to read dir ${folderPath}:`, e);
      }
    };
    calculateSize(dir);
    return totalSize;
  }

  static getCacheSize(): number {
    return this.getFolderSize(this.getCacheDir());
  }

  static clearCache() {
    const dir = this.getCacheDir();
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  /**
   * Downloads a file to the cache if it doesn't exist, then returns the path to the cached file.
   */
  static async getOrDownload(
    category: string,
    downloadUrl: string,
    originalFilename: string,
    onProgress?: (progress: number, text?: string) => void,
    progressText?: string
  ): Promise<string> {
    const categoryDir = this.getCategoryDir(category);
    const safeFilename = this.getSafeFilename(downloadUrl, originalFilename);
    const cachedFilePath = path.join(categoryDir, safeFilename);

    if (fs.existsSync(cachedFilePath)) {
      console.log(`[CacheManager] Cache hit for ${category}/${originalFilename}`);
      if (onProgress) onProgress(100, progressText || 'Copied from cache...');
      return cachedFilePath;
    }

    console.log(`[CacheManager] Cache miss for ${category}/${originalFilename}. Downloading...`);
    if (onProgress) onProgress(0, progressText || 'Downloading...');

    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream'
    });

    const totalLength = response.headers['content-length'] as string;
    let downloaded = 0;

    const writer = fs.createWriteStream(cachedFilePath);

    response.data.on('data', (chunk: Buffer) => {
      downloaded += chunk.length;
      if (totalLength && onProgress) {
        const progress = Math.round((downloaded / parseInt(totalLength)) * 100);
        onProgress(progress, progressText || 'Downloading...');
      }
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(true));
      writer.on('error', (err) => {
        if (fs.existsSync(cachedFilePath)) fs.unlinkSync(cachedFilePath); // Clean up partial download
        reject(err);
      });
    });

    return cachedFilePath;
  }
}

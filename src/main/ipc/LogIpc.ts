import { ipcMain } from 'electron';
import log from '../utils/logger';
import fs from 'fs';

export function registerLogIpc() {
  ipcMain.handle('log-message', (_, level: 'info' | 'warn' | 'error', ...args: any[]) => {
    if (log[level]) {
      log[level](`[Renderer]`, ...args);
    } else {
      log.info(`[Renderer]`, ...args);
    }
  });

  ipcMain.handle('get-logs', () => {
    try {
      const logFile = log.transports.file.getFile();
      if (fs.existsSync(logFile.path)) {
        return fs.readFileSync(logFile.path, 'utf-8');
      }
      return '';
    } catch (e) {
      log.error('Failed to read logs:', e);
      return 'Failed to read log file.';
    }
  });

  ipcMain.handle('get-log-path', () => {
    try {
      const logFile = log.transports.file.getFile();
      return logFile.path;
    } catch (e) {
      return '';
    }
  });
}

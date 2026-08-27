import { app } from 'electron';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { initializeLogger } from '../utils/logger';
import { electronApp } from '@electron-toolkit/utils';

export function setupAppPreload(): void {
  // Set app data to be stored locally in the repo for full portability
  app.setPath('userData', join(process.cwd(), '.omnihost-data'));

  // Initialize centralized logger
  initializeLogger();

  // Load environment variables
  dotenv.config();

  // Fix Windows UI freeze/hang issues with Framer Motion without disabling hardware acceleration entirely
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
}

export function setupAppPostload(): void {
  electronApp.setAppUserModelId('com.electron');
}

import { app } from 'electron'
import { isAbsolute, join, resolve } from 'path'
import * as dotenv from 'dotenv'
import { initializeLogger } from '../utils/logger'
import { electronApp } from '@electron-toolkit/utils'
import { migrateLegacyPortableData } from './dataMigration'

export function setupAppPreload(): void {
  // Load environment variables
  dotenv.config()

  // Portable storage is opt-in. Relative paths are rejected so the data root cannot
  // silently change when the application is launched from another working directory.
  const configuredDataDirectory = process.env.OMNIHOST_DATA_DIR
  if (configuredDataDirectory) {
    if (!isAbsolute(configuredDataDirectory)) {
      throw new Error('OMNIHOST_DATA_DIR must be an absolute path')
    }
    app.setPath('userData', resolve(configuredDataDirectory))
  }

  const migration = migrateLegacyPortableData(
    join(process.cwd(), '.omnihost-data'),
    app.getPath('userData')
  )
  if (migration.migrated) {
    console.info(`Migrated legacy OmniHost data: ${migration.copiedEntries.join(', ')}`)
  }

  // Initialize centralized logger after the final data path and migration are complete.
  initializeLogger()

  // Fix Windows UI freeze/hang issues with Framer Motion without disabling hardware acceleration entirely
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')
}

export function setupAppPostload(): void {
  electronApp.setAppUserModelId('com.electron')
}

import { app, BrowserWindow } from 'electron'
import { setupAppPreload, setupAppPostload } from './setup/app'
import { setupWindowLifecycle } from './setup/window'
import { registerAllIpcs } from './setup/ipc'
import { registerSevenDaysToDieModDownloader } from './7dtd/SevenDaysToDieModDownloader'
import { closeDatabase } from './db'
import path from 'path'

// 1. Initial application setup (paths, logger, env, switches)
setupAppPreload()

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  // Register custom protocol
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('omnihost', process.execPath, [path.resolve(process.argv[1])])
    }
  } else {
    app.setAsDefaultProtocolClient('omnihost')
  }

  app.on('second-instance', (_event, commandLine) => {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      const mainWindow = windows[0]
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
      
      const deepLinkUrl = commandLine.find((arg) => arg.startsWith('omnihost://'))
      if (deepLinkUrl) {
        mainWindow.webContents.send('handle-deep-link', deepLinkUrl)
      }
    }
  })

  app.on('open-url', (event, url) => {
    event.preventDefault()
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      windows[0].webContents.send('handle-deep-link', url)
    }
  })

  // 2. Setup that requires app to be ready
  app.whenReady().then(() => {
    setupAppPostload()

    // Register all IPCs and systems
    registerAllIpcs()
    registerSevenDaysToDieModDownloader()

    // Setup window creation and lifecycle events
    setupWindowLifecycle()

    // Check if opened via deep link on Windows startup
    const deepLinkUrl = process.argv.find((arg) => arg.startsWith('omnihost://'))
    if (deepLinkUrl) {
      // Small delay to ensure renderer is loaded before sending IPC
      setTimeout(() => {
        const windows = BrowserWindow.getAllWindows()
        if (windows.length > 0) {
          windows[0].webContents.send('handle-deep-link', deepLinkUrl)
        }
      }, 1500)
    }
  })

  // 3. Handle app termination
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('will-quit', () => {
    closeDatabase()
  })
}

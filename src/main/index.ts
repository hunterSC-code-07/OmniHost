import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

// Import our custom modules
import { WakeProxy } from './adapters/WakeProxy'
import { FrpAdapter } from './adapters/FrpAdapter'
import { RadminVpnAdapter } from './adapters/RadminVpnAdapter'

import * as dotenv from 'dotenv'
import { registerServerIpc } from './ipc/ServerIpc'
import { registerSteamCMDIpc } from './ipc/SteamCMDIpc'
import { registerSystemIpc } from './ipc/SystemIpc'
import { registerMinecraftIpc } from './ipc/MinecraftIpc'
import { registerPalworldIpc } from './ipc/PalworldIpc'

const dotenvPath = join(__dirname, '../../.env')
const dotenvResult = dotenv.config({ path: dotenvPath })
console.log('[DEBUG] dotenv path:', dotenvPath)
console.log('[DEBUG] dotenv result:', dotenvResult)
console.log('[DEBUG] CURSEFORGE_API_KEY:', process.env.CURSEFORGE_API_KEY)

// Set app data to be stored locally in the repo for full portability
app.setPath('userData', join(process.cwd(), '.omnihost-data'))

// Fix Windows UI freeze/hang issues with Framer Motion without disabling hardware acceleration entirely
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.webContents.on(
    'console-message',
    (event: any, details?: any, legacyMessage?: string) => {
      // Handle both modern `(event)` with properties, `(event, details)`, and legacy `(event, level, message)`
      const msg = event?.message ?? details?.message ?? legacyMessage ?? String(event)

      if (typeof msg === 'string') {
        // Suppress benign network handshakes, font timeouts, and React DevTools noise
        if (
          msg.includes('net_error -100') ||
          msg.includes('fonts.gstatic.com') ||
          msg.includes('React DevTools') ||
          msg.includes('ERR_CONNECTION_CLOSED')
        ) {
          return
        }
      }
      console.log('[Renderer Console]: ' + msg)
    }
  )

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Disable DevTools in production
  if (app.isPackaged) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // --- 1. INITIALIZE SYSTEMS ---
  const activeServers: Record<number, any> = {}
  const activeProxies: Record<number, WakeProxy> = {}
  const tunnelProvider = new FrpAdapter()
  const radminVpnProvider = new RadminVpnAdapter()

  // --- 2. IPC HANDLERS (THE BRIDGE) ---

  // Database
  // Versions & Downloads
  // Server Lifecycle
  // Tunnels
  // Radmin VPN
  // Config Editor
  // Player JSON Editor
  // Live Commands & Inventory
  // --- File Manager ---
  // --- Backups ---
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  registerServerIpc(activeServers, activeProxies)
  registerSteamCMDIpc()
  registerSystemIpc(tunnelProvider, radminVpnProvider, activeServers)
  registerMinecraftIpc()
  registerPalworldIpc()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

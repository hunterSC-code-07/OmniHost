import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initializeLogger } from './utils/logger'

// Set app data to be stored locally in the repo for full portability
app.setPath('userData', join(process.cwd(), '.omnihost-data'))

// Initialize centralized logger
initializeLogger();

// Import our custom modules
import { WakeProxy } from './adapters/WakeProxy'
import { FrpAdapter } from './adapters/FrpAdapter'
import { RadminVpnAdapter } from './adapters/RadminVpnAdapter'


import * as dotenv from 'dotenv'
import { registerServerIpc } from './ipc/ServerIpc'
import { registerSteamCMDIpc } from './ipc/SteamCMDIpc'
import { registerSystemIpc } from './ipc/SystemIpc'
import { registerMinecraftIpc } from './ipc/MinecraftIpc'
import { registerCacheIpc } from './ipc/CacheIpc'
import { getServers } from './db'
import { registerLogIpc } from './ipc/LogIpc'

dotenv.config()

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

  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    console.log('[Renderer Console]: ' + message);
  });

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
  let activeServers: Record<number, any> = {}
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

  // Register IPCs
  registerLogIpc()
  registerServerIpc(activeServers, activeProxies)
  registerSteamCMDIpc()
  registerCacheIpc()
  registerSystemIpc(tunnelProvider, radminVpnProvider, activeServers, getServers)
  registerMinecraftIpc()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

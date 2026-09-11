import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { optimizer, is } from '@electron-toolkit/utils'
import icon from '../../../resources/icon.png?asset'

const ALLOWED_EXTERNAL_HOSTS = new Set([
  '7daystodiemods.com',
  'www.7daystodiemods.com',
  'www.nexusmods.com',
  'next.nexusmods.com',
  'www.curseforge.com',
  'legacy.curseforge.com'
])

function isAllowedExternalUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl)
    return url.protocol === 'https:' && ALLOWED_EXTERNAL_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

export function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#121212',
      symbolColor: '#ffffff',
      height: 32
    },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) void shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    const currentUrl = mainWindow.webContents.getURL()
    try {
      if (new URL(targetUrl).origin === new URL(currentUrl).origin) return
    } catch {
      // Malformed navigation targets are always blocked.
    }
    event.preventDefault()
  })

  mainWindow.webContents.session.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false)
    }
  )

  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    console.log('[Renderer Console]: ' + message)
  })

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

export function setupWindowLifecycle(): void {
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

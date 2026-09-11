import { ipcMain, IpcMainInvokeEvent } from 'electron'

export function assertTrustedIpcSender(event: IpcMainInvokeEvent): void {
  const frame = event.senderFrame
  if (!frame || frame !== event.sender.mainFrame) {
    throw new Error('IPC request rejected: untrusted frame')
  }

  let senderUrl: URL
  try {
    senderUrl = new URL(frame.url)
  } catch {
    throw new Error('IPC request rejected: invalid sender URL')
  }

  const developmentUrl = process.env.ELECTRON_RENDERER_URL
  if (developmentUrl) {
    const developmentOrigin = new URL(developmentUrl).origin
    if (senderUrl.origin === developmentOrigin) return
  }

  if (senderUrl.protocol !== 'file:') {
    throw new Error('IPC request rejected: untrusted origin')
  }
}

export function handleTrusted(
  channel: string,
  listener: Parameters<typeof ipcMain.handle>[1]
): void {
  ipcMain.handle(channel, (event, ...args) => {
    assertTrustedIpcSender(event)
    return listener(event, ...args)
  })
}

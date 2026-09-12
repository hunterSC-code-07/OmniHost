const ELECTRON_IPC_ERROR_PREFIX =
  /^Error invoking remote method '[^']+':\s*(?:[A-Za-z][A-Za-z0-9]*Error:\s*)?/

export function getDisplayErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(ELECTRON_IPC_ERROR_PREFIX, '').trim()
}

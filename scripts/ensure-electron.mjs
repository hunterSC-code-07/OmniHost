import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const requireFromHere = createRequire(import.meta.url)

// This is a standalone Node bootstrap rather than application TypeScript.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function fail(message, error) {
  console.error(`[ensure-electron] ${message}`)
  if (error) {
    console.error(error instanceof Error ? error.stack : error)
  }
  process.exit(1)
}

let installScript

try {
  installScript = requireFromHere.resolve('electron/install.js')
} catch (error) {
  fail('Electron is not installed. Run `npm install` without omitting dev dependencies.', error)
}

// electron-vite reads Electron's generated path.txt directly, so it cannot trigger
// Electron 44+'s lazy binary download itself. The official installer is idempotent:
// it exits immediately when the correct platform binary is already present.
const result = spawnSync(process.execPath, [installScript], {
  env: process.env,
  stdio: 'inherit'
})

if (result.error) {
  fail("Could not start Electron's binary installer.", result.error)
}

if (result.status !== 0) {
  fail(`Electron's binary installer exited with code ${result.status ?? 'unknown'}.`)
}

let electronPath

try {
  electronPath = requireFromHere('electron')
} catch (error) {
  fail('Electron was installed, but its executable could not be resolved.', error)
}

if (typeof electronPath !== 'string' || !existsSync(electronPath)) {
  fail(`Electron's executable is missing at ${String(electronPath)}.`)
}

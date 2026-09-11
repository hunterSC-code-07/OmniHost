import { afterEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { resolveServerPort } from '../../src/main/serverPorts'

const directories: string[] = []

function serverDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'omnihost-port-'))
  directories.push(directory)
  return directory
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe('resolveServerPort', () => {
  it('uses game-specific defaults', () => {
    const directory = serverDirectory()
    expect(resolveServerPort('Palworld', directory)).toBe(8211)
    expect(resolveServerPort('7 Days to Die', directory)).toBe(26900)
    expect(resolveServerPort('Terraria', directory)).toBe(7777)
  })

  it('reads configured Minecraft and Palworld ports', () => {
    const minecraft = serverDirectory()
    writeFileSync(join(minecraft, 'server.properties'), 'server-port=25570\n')
    expect(resolveServerPort('Minecraft (Paper)', minecraft)).toBe(25570)

    const palworld = serverDirectory()
    const configDirectory = join(palworld, 'Pal', 'Saved', 'Config', 'WindowsServer')
    mkdirSync(configDirectory, { recursive: true })
    writeFileSync(join(configDirectory, 'PalWorldSettings.ini'), 'PublicPort=8215')
    expect(resolveServerPort('Palworld', palworld)).toBe(8215)
  })

  it('prefers a valid metadata override', () => {
    expect(resolveServerPort('Minecraft', serverDirectory(), { port: 30000 })).toBe(30000)
  })
})

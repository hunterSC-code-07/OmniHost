const fs = require('fs')
let code = fs.readFileSync('src/main/ipc/MinecraftIpc.ts', 'utf8')
const methods = []

function extract(name, regex) {
  const match = code.match(regex)
  if (match) {
    let body = match[1]
    methods.push(`  static async ${name}() {\n${body}  }`)
  }
}

extract(
  'getVanillaVersions',
  /ipcMain\.handle\('get-vanilla-versions', async \(\) => \{\r?\n([\s\S]*?)\r?\n  \}\)/
)
extract(
  'getPaperVersions',
  /ipcMain\.handle\('get-paper-versions', async \(\) => \{\r?\n([\s\S]*?)\r?\n  \}\)/
)
extract(
  'getFabricVersions',
  /ipcMain\.handle\('get-fabric-versions', async \(\) => \{\r?\n([\s\S]*?)\r?\n  \}\)/
)
extract(
  'getForgeVersions',
  /ipcMain\.handle\('get-forge-versions', async \(\) => \{\r?\n([\s\S]*?)\r?\n  \}\)/
)
extract(
  'getNeoForgeVersions',
  /ipcMain\.handle\('get-neoforge-versions', async \(\) => \{\r?\n([\s\S]*?)\r?\n  \}\)/
)

const loaderMatch = code.match(
  /ipcMain\.handle\('get-loader-versions', async \(_, type: string, mcVersion: string\) => \{\r?\n([\s\S]*?)\r?\n  \}\)/
)
if (loaderMatch)
  methods.push(
    `  static async getLoaderVersions(type: string, mcVersion: string) {\n${loaderMatch[1]}  }`
  )

const searchMatch = code.match(
  /ipcMain\.handle\('search-modpacks', async \(_, query, version, modloader\) => \{\r?\n([\s\S]*?)\r?\n  \}\)/
)
if (searchMatch)
  methods.push(
    `  static async searchModpacks(query: string, version: string, modloader: string) {\n${searchMatch[1]}  }`
  )

const detailsMatch = code.match(
  /ipcMain\.handle\('get-modpack-details', async \(_, modId\) => \{\r?\n([\s\S]*?)\r?\n  \}\)/
)
if (detailsMatch)
  methods.push(`  static async getModpackDetails(modId: string) {\n${detailsMatch[1]}  }`)

const downloadPackMatch = code.match(
  /ipcMain\.handle\('download-modpack', async \(event, id, modpackId, fileId\) => \{\r?\n([\s\S]*?)\r?\n  \}\)/
)
if (downloadPackMatch)
  methods.push(
    `  static async downloadModpack(event: any, id: number, modpackId: string, fileId: string) {\n${downloadPackMatch[1]}  }`
  )

const downloadJarMatch = code.match(
  /ipcMain\.handle\('download-server-jar', async \(event, id, type, version, loaderVersion\) => \{\r?\n([\s\S]*?)\r?\n  \}\)/
)
if (downloadJarMatch)
  methods.push(
    `  static async downloadServerJar(event: any, id: number, type: string, version: string, loaderVersion: string) {\n${downloadJarMatch[1]}  }`
  )

const finalCode = `import fsPromises from 'fs/promises'
import axios from 'axios'
import semver from 'semver'
import extractZip from 'extract-zip'
import { spawn } from 'child_process'
import { CacheManager } from '../CacheManager'
import { JavaManager } from '../adapters/JavaManager'
import { join } from 'path'
import { app } from 'electron'
import { BrowserWindow } from 'electron'
import fs from 'fs'

async function exists(path: string) {
  try {
    await fsPromises.access(path)
    return true
  } catch {
    return false
  }
}

export class MinecraftDownloader {
${methods.join('\n\n')}
}
`

fs.writeFileSync('src/main/minecraft/MinecraftDownloader.ts', finalCode)

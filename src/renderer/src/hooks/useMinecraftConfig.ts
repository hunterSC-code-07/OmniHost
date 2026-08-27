import { useState } from 'react'
import { useToastStore } from '../store/useToastStore'

export const DEFAULT_PROPS: Record<string, string> = {
  'max-players': '20',
  gamemode: 'survival',
  difficulty: 'normal',
  'spawn-monsters': 'true',
  'spawn-animals': 'true',
  'spawn-npcs': 'true',
  pvp: 'true',
  'allow-nether': 'true',
  'view-distance': '10',
  'spawn-protection': '16',
  'online-mode': 'false',
  'white-list': 'false',
  'enable-command-block': 'false',
  'allow-flight': 'false',
  'force-gamemode': 'false',
  'require-resource-pack': 'false',
  'player-idle-timeout': '0'
}

export function useMinecraftConfig(activeServerId: number | null) {
  const [rawConfigText, setRawConfigText] = useState('')
  const [advancedMode, setAdvancedMode] = useState(false)
  const [props, setProps] = useState<Record<string, string>>({ ...DEFAULT_PROPS })
  const { showToast } = useToastStore()

  const loadConfig = async (id: number) => {
    // @ts-ignore
    const data = await window.api.server.readConfig(id)
    setRawConfigText(data)
    const parsed: Record<string, string> = { ...DEFAULT_PROPS }
    data.split('\n').forEach((line: string) => {
      if (line.trim() && !line.startsWith('#')) {
        const [key, ...val] = line.split('=')
        if (key && val) parsed[key.trim()] = val.join('=').trim()
      }
    })
    setProps(parsed)
  }

  const handleSaveConfig = async () => {
    if (activeServerId !== null) {
      let finalData = rawConfigText
      Object.keys(props).forEach((key) => {
        const regex = new RegExp(`^${key}=.*`, 'm')
        if (regex.test(finalData)) {
          finalData = finalData.replace(regex, `${key}=${props[key]}`)
        } else {
          finalData += `\n${key}=${props[key]}`
        }
      })
      // @ts-ignore
      await window.api.server.writeConfig(activeServerId, advancedMode ? rawConfigText : finalData)
      setRawConfigText(advancedMode ? rawConfigText : finalData)

      // Live apply to server if running
      try {
        if (props['difficulty']) {
          // @ts-ignore
          await window.api.server.sendCommand(activeServerId, `difficulty ${props['difficulty']}`)
        }
        if (props['gamemode']) {
          // @ts-ignore
          await window.api.server.sendCommand(
            activeServerId,
            `defaultgamemode ${props['gamemode']}`
          )
        }
        if (props['spawn-monsters'] !== undefined) {
          const enableMonsters = props['spawn-monsters'] === 'true'
          // @ts-ignore
          await window.api.server.sendCommand(
            activeServerId,
            `gamerule doMobSpawning ${enableMonsters}`
          )
          // @ts-ignore
          await window.api.server.sendCommand(
            activeServerId,
            `gamerule doPatrolSpawning ${enableMonsters}`
          )
        }
        if (props['spawn-npcs'] !== undefined) {
          const enableNpcs = props['spawn-npcs'] === 'true'
          // @ts-ignore
          await window.api.server.sendCommand(
            activeServerId,
            `gamerule doTraderSpawning ${enableNpcs}`
          )
        }
        if (props['white-list'] !== undefined) {
          // @ts-ignore
          await window.api.server.sendCommand(
            activeServerId,
            `whitelist ${props['white-list'] === 'true' ? 'on' : 'off'}`
          )
        }
      } catch (e) {}

      showToast('Settings saved! Changes applied to config & active server.')
    }
  }

  return {
    rawConfigText,
    setRawConfigText,
    advancedMode,
    setAdvancedMode,
    props,
    setProps,
    loadConfig,
    handleSaveConfig
  }
}

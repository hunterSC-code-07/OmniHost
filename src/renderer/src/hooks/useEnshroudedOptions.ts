import { useEffect, useState } from 'react'

import { useServerStore } from '../store/useServerStore'
import { useToastStore } from '../store/useToastStore'

interface EnshroudedUserGroup {
  name: string
  password: string
  canKickBan: boolean
  canAccessInventories: boolean
  canEditBase: boolean
  canExtendBase: boolean
  reservedSlots: number
}

export interface EnshroudedConfig {
  name: string
  password?: string
  saveDirectory: string
  logDirectory: string
  ip: string
  gamePort: number
  queryPort: number
  slotCount: number
  userGroups?: EnshroudedUserGroup[]
}

const DEFAULT_CONFIG: EnshroudedConfig = {
  name: 'Enshrouded Server',
  password: '',
  saveDirectory: './savegame',
  logDirectory: './logs',
  ip: '0.0.0.0',
  gamePort: 15636,
  queryPort: 15637,
  slotCount: 16
}

const pendingConfigReads = new Map<number, Promise<string | null>>()

function readEnshroudedConfig(serverId: number): Promise<string | null> {
  const existingRequest = pendingConfigReads.get(serverId)
  if (existingRequest) return existingRequest

  const request = window.api.fs.readFileIfExists(serverId, 'enshrouded_server.json')
  pendingConfigReads.set(serverId, request)
  void request.then(
    () => pendingConfigReads.delete(serverId),
    () => pendingConfigReads.delete(serverId)
  )
  return request
}

export function useEnshroudedOptions() {
  const activeServerId = useServerStore((state) => state.activeServerId)
  const showToast = useToastStore((state) => state.showToast)
  const [config, setConfig] = useState<EnshroudedConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true

    const loadConfig = async () => {
      if (!activeServerId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await readEnshroudedConfig(activeServerId)
        if (data === null) {
          if (isCurrent) setConfig(DEFAULT_CONFIG)
          return
        }

        const parsed = JSON.parse(data) as EnshroudedConfig

        if (parsed.userGroups?.length) {
          parsed.password = parsed.userGroups[0].password || ''
        }

        if (isCurrent) setConfig({ ...DEFAULT_CONFIG, ...parsed })
      } catch (error) {
        console.error('Failed to read the Enshrouded configuration.', error)
        if (isCurrent) setConfig(DEFAULT_CONFIG)
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    void loadConfig()
    return () => {
      isCurrent = false
    }
  }, [activeServerId])

  const handleSave = async (newConfig: EnshroudedConfig): Promise<boolean> => {
    if (!activeServerId) return false

    try {
      const configToSave: EnshroudedConfig = {
        ...newConfig,
        userGroups: [
          {
            name: 'Admin',
            password: newConfig.password || '',
            canKickBan: true,
            canAccessInventories: true,
            canEditBase: true,
            canExtendBase: true,
            reservedSlots: 0
          }
        ]
      }

      delete configToSave.password
      await window.api.fs.writeFile(
        activeServerId,
        'enshrouded_server.json',
        JSON.stringify(configToSave, null, 2)
      )

      setConfig({ ...newConfig, userGroups: configToSave.userGroups })
      showToast('Enshrouded configuration saved.', 'success')
      return true
    } catch (error) {
      console.error('Failed to save Enshrouded configuration', error)
      showToast('Could not save the Enshrouded configuration.', 'error')
      return false
    }
  }

  return { config, loading, handleSave }
}

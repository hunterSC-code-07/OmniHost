import { useState, useEffect } from 'react'
import { useToastStore } from '../store/useToastStore'
import { usePlayerStore } from '../store/usePlayerStore'

export function useMinecraftPlayers(activeServerId: number | null, activeTab: string) {
  const { playerListType, setPlayerListType, selectedPlayer, setSelectedPlayer } = usePlayerStore()
  const [playerData, setPlayerData] = useState<any[]>([])
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [playerInventory, setPlayerInventory] = useState<any[] | null>(null)
  const { showToast } = useToastStore()

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (selectedPlayer && activeServerId !== null) {
      const fetchInv = async () => {
        // @ts-ignore
        const inv = await window.api.server.getInventory(activeServerId, selectedPlayer)
        if (inv !== null && Array.isArray(inv)) {
          setPlayerInventory((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(inv)) return prev
            return inv
          })
        }
      }
      fetchInv()
      if (playerListType === 'live') {
        interval = setInterval(fetchInv, 3000)
      }
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [selectedPlayer, activeServerId, playerListType])

  const loadPlayers = async (id: number, type: string) => {
    if (type === 'live') {
      setPlayerData([])
      return
    }
    if (type === 'history') {
      // @ts-ignore
      const stats = await window.api.server.getPlayerStats(id)
      setPlayerData(stats ? Object.values(stats) : [])
    } else {
      // @ts-ignore
      const data = await window.api.server.readJson(id, type)
      setPlayerData(data || [])
    }
  }

  useEffect(() => {
    if (activeServerId !== null && activeTab === 'players' && playerListType !== 'live') {
      loadPlayers(activeServerId, playerListType)
    }
  }, [activeServerId, activeTab, playerListType])

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !newPlayerName ||
      activeServerId === null ||
      playerListType === 'live' ||
      playerListType === 'history'
    )
      return
    setIsProcessing(true)

    let uuid = '00000000-0000-0000-0000-000000000000'
    let name = newPlayerName.trim()

    if (playerListType !== 'banned-ips') {
      try {
        const res = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`)
        if (res.ok) {
          const profile = await res.json()
          uuid = profile.uuid
          name = profile.username
        }
      } catch (err) {}
    }

    let newEntry: any = { uuid, name }
    if (playerListType === 'ops') newEntry = { uuid, name, level: 4, bypassesPlayerLimit: false }
    else if (playerListType === 'banned-players')
      newEntry = {
        uuid,
        name,
        created: new Date().toISOString(),
        source: 'Server',
        expires: 'forever',
        reason: 'Banned by operator.'
      }
    else if (playerListType === 'banned-ips')
      newEntry = {
        ip: name,
        created: new Date().toISOString(),
        source: 'Server',
        expires: 'forever',
        reason: 'Banned by operator.'
      }

    const exists = playerData.some((p) => p.name === name || p.ip === name)
    if (!exists) {
      const updatedList = [...playerData, newEntry]
      setPlayerData(updatedList)
      // @ts-ignore
      await window.api.server.writeJson(activeServerId, playerListType, updatedList)
      showToast(`Added ${name} to ${playerListType}`)
    }

    setNewPlayerName('')
    setIsProcessing(false)
  }

  const handleRemovePlayer = async (targetName: string) => {
    if (activeServerId === null) return
    const updatedList = playerData.filter((p) => p.name !== targetName && p.ip !== targetName)
    setPlayerData(updatedList)
    // @ts-ignore
    await window.api.server.writeJson(activeServerId, playerListType, updatedList)
    showToast(`Removed ${targetName}`)
  }

  const handleDeleteAllPlayers = async () => {
    if (activeServerId === null) return
    if (!confirm(`Are you sure you want to delete ALL entries in ${playerListType}?`)) return
    setPlayerData([])
    // @ts-ignore
    await window.api.server.writeJson(activeServerId, playerListType, [])
    showToast(`Cleared ${playerListType}`)
  }

  const sendPlayerCommand = async (cmd: string, successMsg: string) => {
    if (activeServerId !== null && selectedPlayer) {
      // @ts-ignore
      await window.api.server.sendCommand(activeServerId, cmd.replace('{player}', selectedPlayer))
      showToast(successMsg.replace('{player}', selectedPlayer))
    }
  }

  const handleUpdatePlayerStats = async (playerName: string, updatedStats: any) => {
    if (activeServerId === null) return
    try {
      // @ts-ignore
      const allStats = (await window.api.server.readJson(activeServerId, 'player-stats')) || {}
      allStats[playerName] = { ...allStats[playerName], ...updatedStats, username: playerName }
      // @ts-ignore
      await window.api.server.writeJson(activeServerId, 'player-stats', allStats)
      setPlayerData(Object.values(allStats))
      showToast(`Updated stats for ${playerName}`)
    } catch (err) {
      showToast(`Failed to update stats: ${err}`)
    }
  }

  const fetchPlayerNbtStats = async (playerName: string) => {
    if (activeServerId === null) return null
    // @ts-ignore
    return await window.api.server.getPlayerNbtStats(activeServerId, playerName)
  }

  const handleUpdatePlayerNbt = async (playerName: string, stats: any) => {
    if (activeServerId === null) return false
    try {
      // @ts-ignore
      const success = await window.api.server.editPlayerNbt(activeServerId, playerName, stats)
      if (success) {
        showToast(`Updated in-game stats for ${playerName}`)
        return true
      }
      showToast(`Failed to update in-game stats. Player might not exist.`)
      return false
    } catch (err) {
      showToast(`Error updating NBT: ${err}`)
      return false
    }
  }

  return {
    playerListType,
    setPlayerListType,
    playerData,
    setPlayerData,
    newPlayerName,
    setNewPlayerName,
    isProcessing,
    setIsProcessing,
    selectedPlayer,
    setSelectedPlayer,
    playerInventory,
    setPlayerInventory,
    handleAddPlayer,
    handleRemovePlayer,
    sendPlayerCommand,
    handleDeleteAllPlayers,
    handleUpdatePlayerStats,
    fetchPlayerNbtStats,
    handleUpdatePlayerNbt
  }
}

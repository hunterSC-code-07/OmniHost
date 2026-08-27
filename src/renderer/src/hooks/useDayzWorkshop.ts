import { useState, useEffect } from 'react'
import { useServerStore } from '../store/useServerStore'
import { useDayzModStore } from '../store/useDayzModStore'

export const useDayzWorkshop = () => {
  const { activeServerId } = useServerStore()
  const { pendingDownloads, addPendingDownload, removePendingDownload } = useDayzModStore()

  const [mods, setMods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingMission, setDownloadingMission] = useState<string | null>(null)

  const [steamCreds, setSteamCreds] = useState(() => {
    try {
      const saved = localStorage.getItem('omnihost_steam_creds')
      return saved ? JSON.parse(atob(saved)) : { username: '', password: '', steamGuard: '' }
    } catch {
      return { username: '', password: '', steamGuard: '' }
    }
  })
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('omnihost_steam_creds'))
  const [showCreds, setShowCreds] = useState(false)

  const [pendingDeps, setPendingDeps] = useState<any[]>([])
  const [installingDep, setInstallingDep] = useState<string | null>(null)
  const [depProgress, setDepProgress] = useState<{ percent: number; msg: string } | null>(null)
  const [checkingDeps, setCheckingDeps] = useState<string | null>(null)
  const [modalState, setModalState] = useState<{ type: string | null; data?: any }>({ type: null })
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [dependencyResult, setDependencyResult] = useState<{
    modTitle: string
    deps: any[]
  } | null>(null)

  const loadInstalledMods = async () => {
    if (!activeServerId) return
    setLoading(true)
    try {
      const basicMods = await window.api.dayz.getInstalledMods(activeServerId)

      const workshopIds = basicMods
        .filter((m: any) => m.id && /^\d+$/.test(m.id) && String(m.id) !== '0')
        .map((m: any) => m.id)

      let detailedMods: any[] = []
      if (workshopIds.length > 0) {
        detailedMods = await window.api.steam.getWorkshopItemDetails(workshopIds)
      }

      const mergedMods = basicMods
        .map((basicMod: any) => {
          const detail = detailedMods.find((d: any) => d.publishedfileid === basicMod.id)
          if (detail) {
            return {
              ...basicMod,
              title: detail.title || basicMod.title,
              preview_url: detail.preview_url,
              file_size: detail.file_size,
              tags: detail.tags,
              description: detail.description
            }
          }
          return basicMod
        })
        .sort((a: any, b: any) => {
          if (a.isDisabled === b.isDisabled) {
            return (a.title || a.folderName || '').localeCompare(
              b.title || b.folderName || '',
              undefined,
              { sensitivity: 'base' }
            )
          }
          return a.isDisabled ? 1 : -1
        })

      setMods(mergedMods)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadInstalledMods()
  }, [activeServerId])

  const handleToggleMap = async (folderName: string, currentIsMap: boolean) => {
    if (!activeServerId) return
    await window.api.dayz.toggleMapMod(activeServerId, folderName, !currentIsMap)
    loadInstalledMods()
  }

  const handleDownloadMission = async (modId: string) => {
    if (downloadingMission || !activeServerId) return
    setDownloadingMission(modId)
    try {
      await window.api.dayz.downloadMission(activeServerId, modId)
    } catch (e: any) {
      console.error(e)
      setModalState({
        type: 'INFO',
        data: { message: 'Failed to download mission files: ' + e.message }
      })
    } finally {
      setDownloadingMission(null)
    }
  }

  const handleExtractLocalMission = async (modId: string, localMissionsPath: string) => {
    if (downloadingMission || !activeServerId) return
    setDownloadingMission(modId)
    try {
      await window.api.dayz.extractLocalMission(activeServerId, localMissionsPath)
      setModalState({
        type: 'INFO',
        data: { message: 'Mission files extracted and applied successfully!' }
      })
    } catch (e: any) {
      console.error(e)
      setModalState({
        type: 'INFO',
        data: { message: 'Failed to extract mission files: ' + e.message }
      })
    } finally {
      setDownloadingMission(null)
    }
  }

  const handleInstallDependencies = async (depsToInstall: any[] = pendingDeps) => {
    if (!activeServerId) return
    setShowCreds(false)

    if (addPendingDownload) {
      depsToInstall.forEach((dep) => {
        addPendingDownload(activeServerId, {
          id: dep.id,
          title: dep.title,
          folderName: `@${dep.title.replace(/[^a-zA-Z0-9]/g, '') || dep.id}`,
          tags: []
        })
      })
    } else {
      setInstallingDep('batch')
      setDepProgress({
        percent: 0,
        msg: `Starting batch download for ${depsToInstall.length} dependencies...`
      })
    }

    try {
      const modsToInstall = depsToInstall.map((m) => ({ modId: m.id, modTitle: m.title }))
      await window.api.dayz.installMods(
        activeServerId,
        modsToInstall,
        steamCreds.username,
        steamCreds.password,
        steamCreds.steamGuard || undefined
      )
    } catch (e: any) {
      if (e.message && e.message.includes('STEAM_GUARD_REQUIRED')) {
        alert(
          'Steam Guard code is required. Please check your email or Steam app for the code and enter it in the credentials box.'
        )
        setShowCreds(true)
        return
      } else if (e.message?.includes('LOGIN_REQUIRED')) {
        alert(`SteamCMD Login Failed:\n${e.message}\n\nPlease check your credentials.`)
        setShowCreds(true)
        return
      } else if (e.message?.includes('ENOSPC')) {
        alert(
          'Installation failed: Your hard drive has run out of space.\n\nDayZ mods require significant storage. Please free up some space on your disk and try again. The installation will instantly resume where it left off!'
        )
        return
      } else {
        alert(`Failed to batch install dependencies: ${e.message}`)
      }
    }

    setSteamCreds((prev) => ({ ...prev, steamGuard: '' }))
    setInstallingDep(null)
    setDepProgress(null)
    setPendingDeps([])
    await loadInstalledMods()
  }

  const executeMissingDepsInstall = (depDetails: any[]) => {
    setModalState({ type: null })
    setPendingDeps(depDetails)
    if (!steamCreds.username || !steamCreds.password) {
      setShowCreds(true)
    } else {
      handleInstallDependencies(depDetails)
    }
  }

  const handleToggleModStatus = async (mod: any) => {
    if (!activeServerId) return
    const isEnabling = mod.isDisabled
    await window.api.dayz.toggleModStatus(activeServerId, mod.folderName, !isEnabling)

    if (isEnabling && mod.id && /^\d+$/.test(mod.id)) {
      try {
        const dependencies = await window.api.steam.getModDependencies(mod.id)
        if (dependencies && dependencies.length > 0) {
          const installedDeps = mods.filter((m) => dependencies.includes(m.id))
          const missingDepIds = dependencies.filter((depId) => !mods.find((m) => m.id === depId))

          let enabledCount = 0
          for (const installedDep of installedDeps) {
            if (installedDep.isDisabled) {
              await window.api.dayz.toggleModStatus(activeServerId, installedDep.folderName, false)
              enabledCount++
            }
          }

          if (missingDepIds.length > 0) {
            const depDetails = await window.api.steam.getWorkshopItemDetails(missingDepIds)
            if (depDetails && depDetails.length > 0) {
              const depNames = depDetails.map((d: any) => d.title).join(', ')
              setModalState({ type: 'MISSING_DEPS', data: { depNames, depDetails } })
              return
            }
          }
        }
      } catch (e: any) {
        setModalState({
          type: 'INFO',
          data: { message: 'Failed to process missing dependencies: ' + e.message }
        })
      }
    }

    loadInstalledMods()
  }

  const handleCheckDependencies = async (mod: any) => {
    setCheckingDeps(mod.id)
    try {
      const depIds = await window.api.steam.getModDependencies(mod.id)
      if (!depIds || depIds.length === 0) {
        setModalState({ type: 'INFO', data: { message: 'No dependencies required for this mod.' } })
        setCheckingDeps(null)
        return
      }

      const details = await window.api.steam.getWorkshopItemDetails(depIds)

      const results = details.map((d: any) => {
        const localMod = mods.find((m) => String(m.id) === String(d.id))
        return {
          id: d.id,
          title: d.title,
          isInstalled: !!localMod,
          isDisabled: localMod ? localMod.isDisabled : false
        }
      })

      setDependencyResult({ modTitle: mod.title, deps: results })
    } catch (e: any) {
      setModalState({
        type: 'INFO',
        data: { message: 'Failed to check dependencies: ' + e.message }
      })
    } finally {
      setCheckingDeps(null)
    }
  }

  const handleUninstall = (modId: string, modName: string) => {
    if (!activeServerId) return
    setModalState({ type: 'UNINSTALL_SINGLE', data: { modId, modName } })
  }

  const executeUninstall = async (modId: string) => {
    try {
      await window.api.dayz.uninstallMod(activeServerId!, modId)
      await loadInstalledMods()
      setModalState({ type: null })
    } catch (e: any) {
      setModalState({ type: 'INFO', data: { message: `Failed to uninstall mod: ${e.message}` } })
    }
  }

  const handleUninstallAll = () => {
    if (mods.length === 0 || !activeServerId) return
    setModalState({ type: 'UNINSTALL_ALL' })
  }

  const executeUninstallAll = async () => {
    setLoading(true)
    setModalState({ type: null })
    try {
      for (const mod of mods) {
        await window.api.dayz.uninstallMod(activeServerId!, mod.folderName || mod.id)
      }
      await loadInstalledMods()
    } catch (e: any) {
      setModalState({
        type: 'INFO',
        data: { message: `Failed to uninstall some mods: ${e.message}` }
      })
      await loadInstalledMods()
    }
    setLoading(false)
  }

  const handleRebuildLoadOrder = () => {
    if (!activeServerId) return
    setModalState({ type: 'REBUILD_CONFIRM' })
  }

  const executeRebuildLoadOrder = async () => {
    setModalState({ type: null })
    setIsRebuilding(true)
    try {
      await window.api.dayz.rebuildModDependencies(activeServerId!)
      setModalState({ type: 'REBUILD_SUCCESS' })
    } catch (e: any) {
      setModalState({
        type: 'INFO',
        data: { message: 'Failed to rebuild load order: ' + e.message }
      })
    }
    setIsRebuilding(false)
  }

  const saveCredentials = () => {
    if (steamCreds.username && steamCreds.password) {
      if (rememberMe) {
        localStorage.setItem(
          'omnihost_steam_creds',
          btoa(
            JSON.stringify({
              username: steamCreds.username,
              password: steamCreds.password,
              steamGuard: ''
            })
          )
        )
      } else {
        localStorage.removeItem('omnihost_steam_creds')
      }
      handleInstallDependencies()
    } else {
      setModalState({ type: 'INFO', data: { message: 'Username and password are required.' } })
    }
  }

  return {
    mods,
    loading,
    downloadingMission,
    steamCreds,
    setSteamCreds,
    rememberMe,
    setRememberMe,
    showCreds,
    setShowCreds,
    installingDep,
    depProgress,
    checkingDeps,
    isRebuilding,
    dependencyResult,
    setDependencyResult,
    handleToggleMap,
    handleDownloadMission,
    handleExtractLocalMission,
    handleToggleModStatus,
    handleCheckDependencies,
    handleUninstall,
    handleUninstallAll,
    executeUninstallAll,
    executeUninstall,
    executeRebuildLoadOrder,
    executeMissingDepsInstall,
    modalState,
    setModalState,
    handleRebuildLoadOrder,
    saveCredentials,
    loadInstalledMods,
    activeServerId,
    pendingDownloads,
    removePendingDownload
  }
}

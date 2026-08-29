import { useState, useEffect, useCallback } from 'react'
import { useServerStore } from '../store/useServerStore'

export function usePalworldMods() {
  const { activeServerId } = useServerStore()
  const [modSearchQuery, setModSearchQuery] = useState('')
  const [modResults, setModResults] = useState<any[]>([])
  const [isSearchingMods, setIsSearchingMods] = useState(false)

  const [installedMods, setInstalledMods] = useState<any[]>([])
  const [installingModId, setInstallingModId] = useState<number | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  const fetchInstalledMods = useCallback(async () => {
    if (!activeServerId) return
    try {
      const mods = await window.api.palworld.getInstalledMods(activeServerId)
      setInstalledMods(mods)
    } catch (e) {
      console.error(e)
    }
  }, [activeServerId])

  const handleSearchMods = useCallback(
    async (e?: React.FormEvent, forceQuery?: string) => {
      if (e) e.preventDefault()
      setIsSearchingMods(true)
      setSearchError(null)
      const query = forceQuery !== undefined ? forceQuery : modSearchQuery
      try {
        const results = await window.api.palworld.searchMods(query || ' ', undefined, 0, 20)
        if (results && results.error) {
          setSearchError(results.error)
          setModResults([])
        } else if (Array.isArray(results)) {
          setModResults(results)
        } else {
          setModResults([])
        }
      } catch (e: any) {
        console.error(e)
        setSearchError(e.message || 'An error occurred while searching for mods.')
        setModResults([])
      }
      setIsSearchingMods(false)
    },
    [modSearchQuery]
  )

  useEffect(() => {
    fetchInstalledMods()
    handleSearchMods(undefined, ' ') // Fetch defaults
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchInstalledMods])

  const handleInstallMod = async (mod: any) => {
    if (!activeServerId) return
    setInstallingModId(mod.id)
    try {
      if (mod.latestFiles && mod.latestFiles.length > 0) {
        const file = mod.latestFiles[0]
        
        // Check for required dependencies
        const reqDeps = file.dependencies?.filter((d: any) => d.relationType === 3) || []
        if (reqDeps.length > 0) {
          const depNames: string[] = []
          const depMods: any[] = []
          
          for (const dep of reqDeps) {
            const depMod = await window.api.palworld.getModDetails(dep.modId)
            if (depMod && !depMod.error) {
              depNames.push(depMod.name)
              depMods.push(depMod)
            }
          }
          
          if (depMods.length > 0) {
            const confirm = window.confirm(`This mod requires the following dependencies:\n${depNames.join(', ')}\n\nWould you like to install them as well?`)
            if (confirm) {
              for (const depMod of depMods) {
                if (depMod.latestFiles && depMod.latestFiles.length > 0) {
                  await window.api.palworld.installMod(activeServerId, depMod.id, depMod.latestFiles[0].id)
                }
              }
            }
          }
        }

        // Install the main mod
        await window.api.palworld.installMod(activeServerId, mod.id, file.id)
        await fetchInstalledMods()
      }
    } catch (e) {
      console.error(e)
    }
    setInstallingModId(null)
  }

  const handleDeleteMod = async (modType: string, modName: string) => {
    if (!activeServerId) return
    try {
      await window.api.palworld.uninstallMod(activeServerId, modType, modName)
      await fetchInstalledMods()
    } catch (e) {
      console.error(e)
    }
  }

  return {
    modSearchQuery,
    setModSearchQuery,
    modResults,
    isSearchingMods,
    handleSearchMods,
    searchError,
    installedMods,
    handleInstallMod,
    installingModId,
    handleDeleteMod
  }
}

import { useState } from 'react'
import { useModalStore } from '../store/useModalStore'

export const useDayzModStatus = (
  activeServerId: number | null,
  mods: any[],
  loadInstalledMods: () => Promise<void>,
  executeMissingDepsInstall: (deps: any[]) => void
) => {
  const { openDayzMissingDepsModal, openDayzInfoModal } = useModalStore.getState()
  const [togglingMap, setTogglingMap] = useState<string | null>(null)

  const handleToggleMap = async (folderName: string, currentIsMap: boolean) => {
    if (!activeServerId || togglingMap) return
    setTogglingMap(folderName)
    try {
      const willBeMap = !currentIsMap
      const res = await window.api.dayz.toggleMapMod(activeServerId, folderName, willBeMap)
      if (willBeMap) {
        if (res?.missionResult?.templates?.length) {
          openDayzInfoModal(
            `Map configured successfully! Mission template(s) [${res.missionResult.templates.join(', ')}] are ready in mpmissions. You can now select this map under Options -> Map (Template).`
          )
        } else {
          openDayzInfoModal(
            `Mod marked as map. You can select its mission template under Options -> Map (Template).`
          )
        }
      }
      await loadInstalledMods()
    } catch (e: any) {
      console.error(e)
      openDayzInfoModal('Failed to update map mod: ' + (e.message || e))
    } finally {
      setTogglingMap(null)
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

          for (const installedDep of installedDeps) {
            if (installedDep.isDisabled) {
              await window.api.dayz.toggleModStatus(activeServerId, installedDep.folderName, false)
            }
          }

          if (missingDepIds.length > 0) {
            const depDetails = await window.api.steam.getWorkshopItemDetails(missingDepIds)
            if (depDetails && depDetails.length > 0) {
              openDayzMissingDepsModal(depDetails, executeMissingDepsInstall)
            }
          }
        }
      } catch (e: any) {
        openDayzInfoModal('Failed to process missing dependencies: ' + e.message)
      }
    }

    loadInstalledMods()
  }

  return {
    handleToggleMap,
    handleToggleModStatus,
    togglingMap
  }
}

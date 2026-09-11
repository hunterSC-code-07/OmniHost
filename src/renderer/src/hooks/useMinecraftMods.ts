import { useState, useEffect } from 'react'
import { useToastStore } from '../store/useToastStore'
import { useUiStore } from '../store/useUiStore'

export function useMinecraftMods(
  activeServerId: number | null,
  serverMeta: any,
  activeTab: string
) {
  const [modSearchQuery, setModSearchQuery] = useState('')
  const [modResults, setModResults] = useState<any[]>([])
  const [isSearchingMods, setIsSearchingMods] = useState(false)
  const [installedMods, setInstalledMods] = useState<any[]>([])
  const [installingModId, setInstallingModId] = useState<number | null>(null)
  const [installProgressText, setInstallProgressText] = useState<string>('')
  const [modViewType, setModViewType] = useState<
    'browse' | 'installed' | 'dependencies' | 'modpacks' | 'shaders' | 'resourcepacks'
  >('browse')
  const [activeClassId, setActiveClassId] = useState<number>(6)
  const [activeSortField, setActiveSortField] = useState<number>(2)
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(false)
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const [totalModCount, setTotalModCount] = useState<number>(0)

  // Dependencies
  const [_modDependencies, _setModDependencies] = useState<any[]>([])
  const [_isLoadingDependencies, _setIsLoadingDependencies] = useState(false)
  const [_isInstallingAllDeps, _setIsInstallingAllDeps] = useState(false)
  const [_installAllProgress, _setInstallAllProgress] = useState({ current: 0, total: 0, text: '' })
  const fetchModDependencies = async () => {
    showToast('Dependency scanning is unavailable for this server type.', 'error')
  }
  const handleInstallMissingDependency = async (_id: string) => {
    showToast('Dependency scanning is unavailable for this server type.', 'error')
  }
  const handleInstallAllMissingDependencies = async () => {
    showToast('Dependency scanning is unavailable for this server type.', 'error')
  }

  // Modpacks
  const [modpackSearchQuery, setModpackSearchQuery] = useState('')
  const [modpackResults, setModpackResults] = useState<any[]>([])
  const [isSearchingModpacks, setIsSearchingModpacks] = useState(false)
  const [installingModpackId, setInstallingModpackId] = useState<number | null>(null)
  const [modpackProgressText, setModpackProgressText] = useState<string>('')
  const handleSearchModpacks = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!serverMeta) return
    setIsSearchingModpacks(true)
    try {
      const results = await window.api.minecraft.searchModpacks(
        modpackSearchQuery,
        serverMeta.version,
        serverMeta.type
      )
      setModpackResults(results ?? [])
    } catch (error: any) {
      showToast(`Could not search modpacks: ${error.message}`, 'error')
    } finally {
      setIsSearchingModpacks(false)
    }
  }
  const handleInstallModpack = async (pack: any) => {
    if (activeServerId === null || !serverMeta || installingModpackId !== null) return
    setInstallingModpackId(pack.id)
    setModpackProgressText('Downloading modpack...')
    try {
      const result = await window.api.minecraft.installCurseforgeModpack(
        activeServerId,
        pack.id,
        serverMeta.version
      )
      if (result?.isClientPack) {
        setModpackProgressText('Installing server software...')
        await window.api.minecraft.downloadServerJar(
          activeServerId,
          result.modloader,
          result.version,
          result.loaderVersion
        )
        await window.api.minecraft.changeServerSoftware(
          activeServerId,
          result.modloader,
          result.version,
          result.loaderVersion
        )
      }
      showToast(`Installed ${pack.name}`)
      await fetchMods()
    } catch (error: any) {
      showToast(`Could not install modpack: ${error.message}`, 'error')
    } finally {
      setInstallingModpackId(null)
      setModpackProgressText('')
    }
  }

  // Shaders
  const [shaderSearchQuery, setShaderSearchQuery] = useState('')
  const [shaderResults, setShaderResults] = useState<any[]>([])
  const [isSearchingShaders, setIsSearchingShaders] = useState(false)
  const handleSearchShaders = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!serverMeta) return
    setIsSearchingShaders(true)
    setActiveClassId(6552)
    try {
      const results = await window.api.minecraft.searchCurseforgeMods(
        shaderSearchQuery,
        serverMeta.type,
        serverMeta.version,
        0,
        6552,
        activeSortField
      )
      setShaderResults(results ?? [])
    } catch (error: any) {
      showToast(`Could not search shaders: ${error.message}`, 'error')
    } finally {
      setIsSearchingShaders(false)
    }
  }

  // Resource Packs
  const [resourcePackSearchQuery, setResourcePackSearchQuery] = useState('')
  const [resourcePackResults, setResourcePackResults] = useState<any[]>([])
  const [isSearchingResourcePacks, setIsSearchingResourcePacks] = useState(false)
  const handleSearchResourcePacks = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!serverMeta) return
    setIsSearchingResourcePacks(true)
    setActiveClassId(12)
    try {
      const results = await window.api.minecraft.searchCurseforgeMods(
        resourcePackSearchQuery,
        serverMeta.type,
        serverMeta.version,
        0,
        12,
        activeSortField
      )
      setResourcePackResults(results ?? [])
    } catch (error: any) {
      showToast(`Could not search resource packs: ${error.message}`, 'error')
    } finally {
      setIsSearchingResourcePacks(false)
    }
  }

  const { showToast } = useToastStore()
  const { setCacheSizes } = useUiStore()

  const fetchMods = async () => {
    if (activeServerId === null || !serverMeta) return

    let defaultClassId = 6 // Mods
    if (modViewType === 'shaders') defaultClassId = 6552
    else if (modViewType === 'resourcepacks') defaultClassId = 12
    else if (serverMeta.type === 'Paper')
      defaultClassId = 5 // Bukkit Plugins
    else if (serverMeta.type === 'Vanilla') defaultClassId = 6945 // Data Packs

    setActiveClassId(defaultClassId)
    const installed = await window.api.minecraft.getInstalledMods(activeServerId, defaultClassId)
    setInstalledMods(installed)

    setIsSearchingMods(true)
    // @ts-ignore
    const results = await window.api.minecraft.searchCurseforgeMods(
      '',
      serverMeta.type,
      serverMeta.version,
      0,
      defaultClassId,
      activeSortField
    )
    setModResults(results)
    setTotalModCount(results?.length > 0 ? 10000 : 0)
    setIsSearchingMods(false)
  }

  useEffect(() => {
    if (
      activeServerId !== null &&
      serverMeta &&
      (activeTab === 'mods' || activeTab === 'software')
    ) {
      fetchMods()
    }
  }, [activeServerId, activeTab, modViewType, serverMeta])

  useEffect(() => {
    if (activeTab === 'mods' && serverMeta && !isSearchingMods) {
      handleSearchMods(undefined, activeClassId, activeSortField)
    }
  }, [activeClassId, activeSortField])

  const handleSearchMods = async (e?: React.FormEvent, cId?: number, sField?: number) => {
    if (e) e.preventDefault()
    if (!serverMeta) return
    setIsSearchingMods(true)
    const targetClassId = cId !== undefined ? cId : activeClassId
    const targetSortField = sField !== undefined ? sField : activeSortField
    try {
      // @ts-ignore
      const results = await window.api.minecraft.searchCurseforgeMods(
        modSearchQuery,
        serverMeta.type,
        serverMeta.version,
        0,
        targetClassId,
        targetSortField
      )
      setModResults(results)
      setTotalModCount(results?.length > 0 ? 10000 : 0)
    } catch (error) {
      console.error('[ERROR] handleSearchMods failed', error)
    }
    setIsSearchingMods(false)
  }

  const handleInstallMod = async (mod: any) => {
    if (activeServerId === null || !serverMeta) return
    if (installingModId !== null) return

    setInstallingModId(mod.id)
    setInstallProgressText('Resolving dependencies...')

    const installWithDeps = async (targetMod: any, depth = 0) => {
      let targetFile = targetMod.latestFiles?.find((f: any) =>
        f.gameVersions?.includes(serverMeta.version)
      )

      if (!targetFile && targetMod.latestFilesIndexes) {
        let expectedModLoader = 0
        if (serverMeta.type === 'Forge') expectedModLoader = 1
        else if (serverMeta.type === 'Fabric') expectedModLoader = 4
        else if (serverMeta.type === 'NeoForge') expectedModLoader = 6

        const fileIndex = targetMod.latestFilesIndexes.find(
          (idx: any) =>
            idx.gameVersion === serverMeta.version &&
            (expectedModLoader === 0 || idx.modLoader === expectedModLoader || idx.modLoader === 0)
        )
        if (fileIndex) {
          setInstallProgressText(`Fetching file details for ${serverMeta.version}...`)
          // @ts-ignore
          targetFile = await window.api.minecraft.getCurseforgeFile(targetMod.id, fileIndex.fileId)
        }
      }

      if (!targetFile && targetMod.latestFiles?.length > 0) targetFile = targetMod.latestFiles[0]

      if (!targetFile || !targetFile.downloadUrl) {
        if (depth === 0) showToast(`Failed to find compatible file for ${targetMod.name}`)
        return
      }

      const isAlreadyInstalled = installedMods.some((m) =>
        m.name
          .toLowerCase()
          .includes(
            targetMod.slug?.replace(/-/g, '') || targetMod.name.toLowerCase().replace(/ /g, '')
          )
      )
      if (isAlreadyInstalled) return

      if (targetFile.dependencies && targetFile.dependencies.length > 0) {
        const requiredDeps = targetFile.dependencies.filter((d: any) => d.relationType === 3)
        for (const dep of requiredDeps) {
          setInstallProgressText(`Installing Dependency (ID: ${dep.modId})...`)
          // @ts-ignore
          const depMod = await window.api.minecraft.getCurseforgeMod(dep.modId)
          if (depMod) {
            setInstallProgressText(`Installing ${depMod.name}...`)
            await installWithDeps(depMod, depth + 1)
          }
        }
      }

      setInstallProgressText(`Downloading ${targetMod.name}...`)
      // @ts-ignore
      await window.api.minecraft.installCurseforgeMod(
        activeServerId,
        targetFile.downloadUrl,
        targetFile.fileName,
        activeClassId
      )
    }

    try {
      await installWithDeps(mod)
      showToast(`Installed ${mod.name} and dependencies!`)
      await fetchMods()
      window.api.system.getDetailedCacheInfo().then((sizes) => setCacheSizes(sizes))
    } catch (error: any) {
      showToast(`Could not install ${mod.name}: ${error.message}`, 'error')
    } finally {
      setInstallingModId(null)
      setInstallProgressText('')
    }
  }

  const handleDeleteMod = async (fileName: string) => {
    if (activeServerId === null) return
    await window.api.minecraft.deleteMod(activeServerId, fileName, activeClassId)
    fetchMods()
  }

  const handleDeleteAllMods = async () => {
    if (activeServerId === null) return
    await window.api.minecraft.deleteAllMods(activeServerId, activeClassId)
    fetchMods()
  }

  return {
    modSearchQuery,
    setModSearchQuery,
    modResults,
    setModResults,
    isSearchingMods,
    setIsSearchingMods,
    installedMods,
    setInstalledMods,
    installingModId,
    setInstallingModId,
    installProgressText,
    setInstallProgressText,
    modViewType,
    setModViewType,
    activeClassId,
    setActiveClassId,
    activeSortField,
    setActiveSortField,
    isClassMenuOpen,
    setIsClassMenuOpen,
    isSortMenuOpen,
    setIsSortMenuOpen,
    totalModCount,
    setTotalModCount,
    handleSearchMods,
    handleInstallMod,
    handleDeleteMod,
    handleDeleteAllMods,

    modDependencies: _modDependencies,
    isLoadingDependencies: _isLoadingDependencies,
    fetchModDependencies,
    handleInstallMissingDependency,
    isInstallingAllDeps: _isInstallingAllDeps,
    installAllProgress: _installAllProgress,
    handleInstallAllMissingDependencies,

    modpackSearchQuery,
    setModpackSearchQuery,
    modpackResults,
    setModpackResults,
    isSearchingModpacks,
    setIsSearchingModpacks,
    installingModpackId,
    setInstallingModpackId,
    modpackProgressText,
    setModpackProgressText,
    handleSearchModpacks,
    handleInstallModpack,

    shaderSearchQuery,
    setShaderSearchQuery,
    shaderResults,
    setShaderResults,
    isSearchingShaders,
    setIsSearchingShaders,
    handleSearchShaders,

    resourcePackSearchQuery,
    setResourcePackSearchQuery,
    resourcePackResults,
    setResourcePackResults,
    isSearchingResourcePacks,
    setIsSearchingResourcePacks,
    handleSearchResourcePacks
  }
}

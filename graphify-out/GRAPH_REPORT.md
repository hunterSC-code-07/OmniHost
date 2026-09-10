# Graph Report - D:\\github\\OmniHost  (2026-08-28)

## Corpus Check
- 187 files · ~82,493 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 651 nodes · 1026 edges · 166 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Structure Signals
- Entity graph basis: 471 non-file, non-concept node(s)
- Weakly connected components: 146
- Singleton components: 68
- Isolated nodes: 68
- Largest component: 20 node(s) (4% of the entity graph basis)
- Low-cohesion communities: 0
- Largest low-cohesion community: none on the entity graph basis

## Workspace Bridges
1. `DayzInstalledModsGridPanel\(\)` - connects `Renderer Use Dayz Missions`, `Renderer Use Dayz Mod Status`, `Renderer Use Dayz Mod Uninstall`; home: `Renderer Dayz Installed Mods Grid Panel`; degree 5; score 1681.25
  source files: `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/components/DayzInstalledModsGridPanel.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzInstalledModsTab.tsx`, `D:/github/OmniHost/src/renderer/src/hooks/useDayzMissions.ts`, `D:/github/OmniHost/src/renderer/src/hooks/useDayzModStatus.ts`, `D:/github/OmniHost/src/renderer/src/hooks/useDayzModUninstall.ts`
2. `RadminVpnAdapter` - connects `Main Radmin Vpn Adapter — Install`, `Main Radmin Vpn Adapter — Installed`; home: `Main Radmin Vpn Adapter`; degree 7; score 4055
  source files: `D:/github/OmniHost/src/main/adapters/RadminVpnAdapter.ts`
3. `useMinecraftMods\(\)` - connects `Renderer Use Minecraft Mods — Delete`, `Renderer Use Minecraft Mods — Install`; home: `Renderer Use Minecraft Mods`; degree 4; score 2904
  source files: `D:/github/OmniHost/src/renderer/src/hooks/useMinecraftMods.ts`
4. `DayzMissionManager` - connects `Main Dayz Mission Manager`, `Main Dayz Mission Manager — Dayz`; home: `Main Steam Web API`; degree 2; score 1363.07
  source files: `D:/github/OmniHost/src/main/dayz/DayzMissionManager.ts`
5. `DayzInstalledModsHeaderPanel\(\)` - connects `Renderer Use Dayz Mod Rebuild`, `Renderer Use Dayz Mod Uninstall`; home: `Renderer Dayz Installed Mods Grid Panel`; degree 3; score 1256.51
  source files: `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/components/DayzInstalledModsHeaderPanel.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzInstalledModsTab.tsx`, `D:/github/OmniHost/src/renderer/src/hooks/useDayzModRebuild.ts`, `D:/github/OmniHost/src/renderer/src/hooks/useDayzModUninstall.ts`
6. `useDayzMods\(\)` - connects `Renderer Dayz Mods Tab`, `Renderer Use Dayz Mod Search`; home: `Renderer Use Dayz Mod Import`; degree 4; score 652.67
  source files: `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzModsTab.tsx`, `D:/github/OmniHost/src/renderer/src/hooks/useDayzModImport.ts`, `D:/github/OmniHost/src/renderer/src/hooks/useDayzMods.ts`, `D:/github/OmniHost/src/renderer/src/hooks/useDayzModSearch.ts`

## God Nodes
1. `SatisfactoryProcessManager` - 10 edges
2. `CacheManager` - 9 edges
3. `FileTailer` - 9 edges
4. `MinecraftDownloader` - 9 edges
5. `MinecraftPlayerManager` - 9 edges
6. `MinecraftProcessManager` - 9 edges
7. `RadminVpnAdapter` - 9 edges
8. `SevenDaysToDieProcessManager` - 9 edges
9. `useDayzFileNavigation\(\)` - 9 edges
10. `useDayzModUninstall\(\)` - 9 edges

## Surprising Connections
- `setupAppPreload\(\)` --calls--> `initializeLogger\(\)`  [EXTRACTED]
  D:/github/OmniHost/src/main/setup/app.ts → D:/github/OmniHost/src/main/utils/logger.ts  _bridges separate communities_
- `DayzVppSuperAdminsPanel\(\)` --calls--> `useDayzVppAdmins\(\)`  [EXTRACTED]
  D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/components/DayzVppSuperAdminsPanel.tsx → D:/github/OmniHost/src/renderer/src/hooks/useDayzVppAdmins.ts  _bridges separate communities_
- `DayzHubContent\(\)` --renders--> `DayzHubHeader\(\)`  [EXTRACTED]
  D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx → D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHubHeader.tsx  _bridges separate communities_
- `DayzHubTabContent\(\)` --renders--> `DayzFilesTab\(\)`  [EXTRACTED]
  D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHubTabContent.tsx → D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzFilesTab.tsx  _bridges separate communities_
- `MinecraftHubContent\(\)` --renders--> `MinecraftHubHeader\(\)`  [EXTRACTED]
  D:/github/OmniHost/src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx → D:/github/OmniHost/src/renderer/src/components/hubs/MinecraftHub/MinecraftHubHeader.tsx  _bridges separate communities_

## Semantic Anomalies
- **[HIGH] Bridge node** - ErrorBoundary bridges Renderer Error Boundary and Renderer Error Boundary — Boundary, Main TSX, Renderer Hub Registry.
  _High betweenness centrality \(43711.000\) across 4 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - RadminVpnAdapter bridges Main Radmin Vpn Adapter and Main I Vpn Adapter, Main Radmin Vpn Adapter — Install, Main Radmin Vpn Adapter — Installed, Main System Ipc.
  _High betweenness centrality \(4028.000\) across 5 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - MinecraftProcessManager bridges Main Minecraft Process Manager and Main Minecraft Config Manager, Main Minecraft Process Manager — Send, Main Dayz Adapter, Main Db.
  _High betweenness centrality \(3456.500\) across 5 communities makes this node a likely dependency chokepoint._
- **[HIGH] Cross-boundary edge** - DayzHubContent\(\) → DayzHubHeader\(\) crosses graph boundaries in an unexpected way.
  _bridges separate communities_
- **[HIGH] Cross-boundary edge** - DayzHubTabContent\(\) → DayzFilesTab\(\) crosses graph boundaries in an unexpected way.
  _bridges separate communities_

## Communities

### Community 0 - "Renderer Use Dayz File Editor"
Cohesion (entity basis within full-graph community): 0.14
Nodes (16): DayzFileBrowserHeader\(\), DayzFileEditorModal\(\), DayzFileGrid\(\), DayzFilesTab\(\), formatSize\(\), useDayzFileEditor\(\), handleFileClick\(\), handleSaveFile\(\) (+8 more)

### Community 1 - "Main System Ipc"
Cohesion (entity basis within full-graph community): 0.21
Nodes (8): registerAllIpcs\(\), registerLogIpc\(\), setupMinecraftEventCoordinator\(\), registerMinecraftIpc\(\), registerNetworkIpc\(\), registerSteamCMDIpc\(\), exists\(\), registerSystemIpc\(\)

### Community 2 - "Renderer Minecraft Hub"
Cohesion (entity basis within full-graph community): 0.3
Nodes (5): MinecraftHubContent\(\), MinecraftHubNavigation\(\), MinecraftHubTabContent\(\), MinecraftModpackPrompt\(\), MinecraftHubState

### Community 3 - "Main Steam Web API"
Cohesion (entity basis within full-graph community): 0.17
Nodes (4): exists\(\), DayzMissionManager, SteamWebAPI, .getModDependencies\(\)

### Community 4 - "Main Minecraft Downloader"
Cohesion (entity basis within full-graph community): 0.36
Nodes (10): exists\(\), MinecraftDownloader, .downloadServerJar\(\), .getFabricVersions\(\), .getForgeVersions\(\), .getLoaderVersions\(\), .getNeoForgeVersions\(\), .getPaperVersions\(\) (+2 more)

### Community 5 - "Main Cache Manager"
Cohesion (entity basis within full-graph community): 0.39
Nodes (9): CacheManager, .clearCache\(\), .getCacheDir\(\), .getCacheSize\(\), .getCategoryDir\(\), .getFolderSize\(\), calculateSize\(\), .getOrDownload\(\) (+1 more)

### Community 6 - "Renderer Hub Registry"
Cohesion (entity basis within full-graph community): 0
Nodes (3): GameHubConfig, getGameImageUrl\(\), isGameSupported\(\)

### Community 7 - "Main I Server Downloader Strategy"
Cohesion (entity basis within full-graph community): 0
Nodes (2): DownloadConfig, IServerDownloaderStrategy

### Community 8 - "Main Satisfactory Process Manager"
Cohesion (entity basis within full-graph community): 0.42
Nodes (9): SatisfactoryProcessManager, .constructor\(\), .loadToken\(\), .sendCommand\(\), .sendLog\(\), .sendPlayerUpdate\(\), .start\(\), .startPolling\(\) (+1 more)

### Community 9 - "Renderer Dayz Hub"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): DayzHubContent\(\), DayzHubNavigation\(\), DayzHubTabContent\(\), useDayzModDownloader\(\)

### Community 10 - "Main Db"
Cohesion (entity basis within full-graph community): 0.27
Nodes (6): createServer\(\), deleteServer\(\), getServers\(\), exists\(\), ServerLifecycleController, .register\(\)

### Community 11 - "Main Seven Days To Die Process Manager"
Cohesion (entity basis within full-graph community): 0.43
Nodes (8): SevenDaysToDieProcessManager, .constructor\(\), .parseLogLine\(\), .sendCommand\(\), .sendLog\(\), .sendPlayerUpdate\(\), .start\(\), .stop\(\)

### Community 12 - "Main Dayz Mod Installer"
Cohesion (entity basis within full-graph community): 0.43
Nodes (7): DayzModInstaller, .importLocalWorkshop\(\), .installMod\(\), .installMods\(\), .selectWorkshopFolder\(\), .uninstallMod\(\), exists\(\)

### Community 13 - "Renderer Dayz Mods Tab"
Cohesion (entity basis within full-graph community): 0.3
Nodes (5): DayzModsTab\(\), handleClickOutside\(\), DayzModsTabProps, useDayzModInstallation\(\), handleUninstall\(\)

### Community 14 - "Main Dayz Process Manager"
Cohesion (entity basis within full-graph community): 0.48
Nodes (7): DayzProcessManager, .constructor\(\), .sendCommand\(\), .sendLog\(\), .sendPlayerUpdate\(\), .start\(\), .stop\(\)

### Community 15 - "Main Minecraft Mod Manager"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): MinecraftModManager, .deleteMod\(\), .getInstalledMods\(\), .installCurseforgeMod\(\), .installCurseforgeModpack\(\)

### Community 16 - "Renderer Use Dayz Mod Import"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): useDayzModImport\(\), handleBrowseWorkshop\(\), handleImportWorkshop\(\), useDayzMods\(\), loadInstalledMods\(\)

### Community 17 - "Main Dayz Adapter"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): DayzAdapter, .constructor\(\), .start\(\), .stop\(\)

### Community 18 - "Renderer Backups Tab"
Cohesion (entity basis within full-graph community): 0.47
Nodes (6): BackupsTab\(\), fetchBackups\(\), formatBytes\(\), handleCreate\(\), handleDelete\(\), handleRestore\(\)

### Community 19 - "Renderer Create Server Modal"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): CreateServerModal\(\), fetchLoaderVersions\(\), fetchModpacks\(\), fetchVersions\(\), handleCreateServer\(\)

### Community 20 - "Renderer Dayz Options Tab"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): CustomNumberInput\(\), CustomSelect\(\), handleClickOutside\(\), DayzOptionsTab\(\)

### Community 21 - "Main File Tailer"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): FileTailer, .constructor\(\), .stop\(\), IFileTailer

### Community 22 - "Renderer Error Boundary"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): Component, ErrorBoundary, .componentDidCatch\(\), .getDerivedStateFromError\(\), .handleReset\(\), .render\(\)

### Community 23 - "Main Frp Adapter"
Cohesion (entity basis within full-graph community): 0.6
Nodes (5): FrpAdapter, .constructor\(\), .sendLog\(\), .start\(\), .stop\(\)

### Community 24 - "Renderer Minecraft Hub Header"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): MinecraftHubHeader\(\), handleTunnel\(\), TunnelModal\(\)

### Community 25 - "Main Minecraft Player Manager"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): MinecraftPlayerManager, .constructor\(\), .getOnlinePlayers\(\), .handlePlayerJoin\(\), .handlePlayerLeave\(\), .sendPlayerUpdate\(\)

### Community 26 - "Main Playit Adapter"
Cohesion (entity basis within full-graph community): 0.6
Nodes (5): PlayitAdapter, .constructor\(\), .sendLog\(\), .start\(\), .stop\(\)

### Community 27 - "Renderer Use Minecraft Software"
Cohesion (entity basis within full-graph community): 0.33
Nodes (4): SoftwareTabProps, useMinecraftSoftware\(\), fetchLoaderVersions\(\), fetchVersions\(\)

### Community 28 - "Main Steam Auth"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): SteamAuth, .getLoginArgs\(\), .isAccountLogonDenied\(\), .isInvalidPassword\(\), .isMobileAuthRequested\(\), .isSteamGuardPrompt\(\)

### Community 29 - "Main Steam Cache"
Cohesion (entity basis within full-graph community): 0.6
Nodes (6): SteamCache, .copyFromCache\(\), .deleteCache\(\), .getCacheDir\(\), .isCached\(\), .sendLog\(\)

### Community 30 - "Renderer Use Minecraft Players"
Cohesion (entity basis within full-graph community): 0.33
Nodes (6): useMinecraftPlayers\(\), fetchInv\(\), handleAddPlayer\(\), handleRemovePlayer\(\), loadPlayers\(\), sendPlayerCommand\(\)

### Community 31 - "Main Dayz Config Manager"
Cohesion (entity basis within full-graph community): 0.6
Nodes (5): DayzConfigManager, .ensureDefaultConfig\(\), .exists\(\), .readConfig\(\), .writeConfig\(\)

### Community 32 - "Renderer Use Log Store"
Cohesion (entity basis within full-graph community): 0
Nodes (2): LogMessage, LogStore

### Community 33 - "Renderer Dayz Pending Download Card"
Cohesion (entity basis within full-graph community): 0
Nodes (3): DayzInstalledModsGridPanelProps, DayzPendingDownloadCard\(\), DayzPendingDownloadCardProps

### Community 34 - "Renderer Dayz Installed Mods Grid Panel"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): DayzInstalledModsGridPanel\(\), openWorkshopPage\(\), DayzInstalledModsHeaderPanel\(\), DayzInstalledModsTab\(\)

### Community 35 - "Main Dayz Log Parser"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): DayzLogParser, .cleanup\(\), .constructor\(\), .parseLogLine\(\), .setupLogWatcher\(\)

### Community 36 - "Renderer Delete Confirmation Modal"
Cohesion (entity basis within full-graph community): 0.33
Nodes (3): DeleteConfirmationModal\(\), confirmDeleteServer\(\), GlobalModalManager\(\)

### Community 37 - "Main Fabric Strategy"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): FabricStrategy, .getDownloadConfig\(\), .getLoaderVersions\(\), .getVersions\(\), IServerDownloaderStrategy

### Community 38 - "Main Forge Strategy"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): ForgeStrategy, .getDownloadConfig\(\), .getLoaderVersions\(\), .getVersions\(\), IServerDownloaderStrategy

### Community 39 - "Main Neo Forge Strategy"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): IServerDownloaderStrategy, NeoForgeStrategy, .getDownloadConfig\(\), .getLoaderVersions\(\), .getVersions\(\)

### Community 40 - "Renderer Players Tab"
Cohesion (entity basis within full-graph community): 0
Nodes (2): PlayersTabProps, PlayerStore

### Community 41 - "Main Seven Days To Die Adapter"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): IServerAdapter, SevenDaysToDieAdapter, .constructor\(\), .start\(\), .stop\(\)

### Community 42 - "Main Steam Cmd Setup"
Cohesion (entity basis within full-graph community): 0.8
Nodes (5): SteamCMDSetup, .ensureInstalled\(\), .getExePath\(\), .getSteamCMDDir\(\), .sendLog\(\)

### Community 43 - "Renderer Use Create Server Data"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): useCreateServerData\(\), fetchLoaderVersions\(\), fetchModpacks\(\), fetchVersions\(\)

### Community 44 - "Renderer Use Dayz Mod Uninstall"
Cohesion (entity basis within full-graph community): 0.4
Nodes (5): useDayzModUninstall\(\), executeUninstall\(\), executeUninstallAll\(\), handleUninstall\(\), handleUninstallAll\(\)

### Community 45 - "Renderer Use Dayz Vpp Admins"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): useDayzVppAdmins\(\), handleAddAdmin\(\), handleRemoveAdmin\(\), loadAdmins\(\)

### Community 46 - "Main Wake Proxy"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): WakeProxy, .constructor\(\), .startListening\(\), .stopListening\(\)

### Community 47 - "Renderer Main Layout"
Cohesion (entity basis within full-graph community): 0
Nodes (2): MainLayout\(\), MainLayoutProps

### Community 48 - "Renderer Dayz Dependency Result Modal"
Cohesion (entity basis within full-graph community): 1
Nodes (2): DayzDependencyResultModal\(\), DayzModals\(\)

### Community 49 - "Main Dayz Economy Manager"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): DayzEconomyManager, .getEconomy\(\), .updateEconomy\(\), .wipeLoot\(\)

### Community 50 - "Main Dayz Mod Graph"
Cohesion (entity basis within full-graph community): 1
Nodes (2): DayzModGraph, .resolveMods\(\)

### Community 51 - "Renderer Dayz Vpp Admin Tab"
Cohesion (entity basis within full-graph community): 1
Nodes (2): DayzVppAdminTab\(\), useDayzInstalledMods\(\)

### Community 52 - "Renderer Files Tab"
Cohesion (entity basis within full-graph community): 0
Nodes (3): FileInfo, FilesTabProps, formatSize\(\)

### Community 53 - "Main Window"
Cohesion (entity basis within full-graph community): 1
Nodes (2): createWindow\(\), setupWindowLifecycle\(\)

### Community 54 - "Main I Vpn Adapter"
Cohesion (entity basis within full-graph community): 1
Nodes (1): IVpnAdapter

### Community 55 - "Main Java Manager"
Cohesion (entity basis within full-graph community): 0.83
Nodes (4): JavaManager, .downloadAndExtractJava\(\), .findJavaExecutable\(\), .getJavaPath\(\)

### Community 56 - "Main Minecraft Config Manager"
Cohesion (entity basis within full-graph community): 1
Nodes (2): MinecraftConfigManager, .init\(\)

### Community 57 - "Main Minecraft Controller"
Cohesion (entity basis within full-graph community): 0
Nodes (2): MinecraftController, registerServerIpc\(\)

### Community 58 - "Main Minecraft Event Bus"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): EventEmitter, MinecraftEventBus, .emit\(\), .on\(\)

### Community 59 - "Main Minecraft Stats Service"
Cohesion (entity basis within full-graph community): 1
Nodes (2): MinecraftStatsService, .updatePlayerStats\(\)

### Community 60 - "Main Minecraft Process Manager"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): MinecraftProcessManager, .constructor\(\), .getActualPid\(\), .stop\(\)

### Community 61 - "Main Paper Strategy"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): IServerDownloaderStrategy, PaperStrategy, .getDownloadConfig\(\), .getVersions\(\)

### Community 62 - "Main Radmin Vpn Adapter"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): IVpnAdapter, RadminVpnAdapter, .constructor\(\), .getIp\(\)

### Community 63 - "Main Satisfactory Adapter"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): SatisfactoryAdapter, .constructor\(\), .start\(\), .stop\(\)

### Community 64 - "Renderer Settings Modal"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): SettingsModal\(\), copyToClipboard\(\), loadLogs\(\)

### Community 65 - "Renderer Steam Login Modal"
Cohesion (entity basis within full-graph community): 1
Nodes (3): SteamLoginModal\(\), handleUpdateSteamCache\(\), saveCredsBeforeAction\(\)

### Community 66 - "Main Steam Workshop Downloader"
Cohesion (entity basis within full-graph community): 0.67
Nodes (4): SteamWorkshopDownloader, .downloadWorkshopItem\(\), .downloadWorkshopItems\(\), .sendInput\(\)

### Community 67 - "Renderer Top Navbar"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): formatBytes\(\), getGameThemeColor\(\), TopNavbar\(\)

### Community 68 - "Renderer Use Dayz Economy"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): useDayzEconomy\(\), handleMultiplierChange\(\), handleSave\(\), loadEconomy\(\)

### Community 69 - "Renderer Use Dayz Missions"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): useDayzMissions\(\), handleDownloadMission\(\), handleExtractLocalMission\(\)

### Community 70 - "Renderer Use Dayz Mod Rebuild"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): useDayzModRebuild\(\), executeRebuildLoadOrder\(\), handleRebuildLoadOrder\(\)

### Community 71 - "Renderer Use Dayz Mod Search"
Cohesion (entity basis within full-graph community): 0.67
Nodes (4): useDayzModSearch\(\), handleCategoryChange\(\), handleSearch\(\), stripBBCode\(\)

### Community 72 - "Renderer Use Dayz Mod Status"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): useDayzModStatus\(\), handleToggleMap\(\), handleToggleModStatus\(\)

### Community 73 - "Renderer Use Dayz Vpp Config"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): useDayzVppConfig\(\), handleToggleDisablePassword\(\), loadConfig\(\)

### Community 74 - "Main Vanilla Strategy"
Cohesion (entity basis within full-graph community): 0.5
Nodes (4): IServerDownloaderStrategy, VanillaStrategy, .getDownloadConfig\(\), .getVersions\(\)

### Community 75 - "Main Adapter Registry"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): AdapterRegistry, .getAdapter\(\), .register\(\)

### Community 76 - "Main App"
Cohesion (entity basis within full-graph community): 0
Nodes (2): setupAppPostload\(\), setupAppPreload\(\)

### Community 77 - "Renderer Background Worker"
Cohesion (entity basis within full-graph community): 0
Nodes (2): compileShader\(\), render\(\)

### Community 78 - "Main Cache Ipc"
Cohesion (entity basis within full-graph community): 1
Nodes (1): registerCacheIpc\(\)

### Community 79 - "Main Curse Forge API Client"
Cohesion (entity basis within full-graph community): 1
Nodes (2): CurseForgeApiClient, .getCurseforgeFile\(\)

### Community 80 - "Renderer Dashboard Hub"
Cohesion (entity basis within full-graph community): 1
Nodes (2): DashboardHub\(\), DayzModStatus\(\)

### Community 81 - "Renderer Dayz Hub Header"
Cohesion (entity basis within full-graph community): 1
Nodes (2): DayzHubHeader\(\), handleRadminClick\(\)

### Community 82 - "Renderer Dayz Installed Mod Card"
Cohesion (entity basis within full-graph community): 0
Nodes (2): DayzInstalledModCard\(\), DayzInstalledModCardProps

### Community 83 - "Renderer Dayz Installed Mods Header Panel"
Cohesion (entity basis within full-graph community): 1
Nodes (1): DayzInstalledModsHeaderPanelProps

### Community 84 - "Main Dayz Mod Status Manager"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): DayzModStatusManager, .rebuildModDependencies\(\), .toggleModStatus\(\)

### Community 85 - "Main Dayz Mod Status Manager — Exists"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): .getInstalledMods\(\), .toggleMapMod\(\), exists\(\)

### Community 86 - "Renderer Dayz Vpp Super Admins Panel"
Cohesion (entity basis within full-graph community): 0
Nodes (2): DayzVppSuperAdminsPanel\(\), DayzVppSuperAdminsPanelProps

### Community 87 - "Renderer Error Boundary — Boundary"
Cohesion (entity basis within full-graph community): 0
Nodes (2): Props, State

### Community 88 - "Main File System Controller"
Cohesion (entity basis within full-graph community): 0
Nodes (2): exists\(\), getServerPath\(\)

### Community 89 - "Main File Tailer — File"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): .pollForFile\(\), checkFile\(\), .start\(\)

### Community 90 - "Main Java Manager — TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 91 - "Renderer List View Icon"
Cohesion (entity basis within full-graph community): 0
Nodes (2): ListViewIcon\(\), ListViewIconProps

### Community 92 - "Main Minecraft Command Builder"
Cohesion (entity basis within full-graph community): 1
Nodes (3): MinecraftCommandBuilder, .buildCommand\(\), .parseRunBat\(\)

### Community 93 - "Main Minecraft Event Bus — Minecraft"
Cohesion (entity basis within full-graph community): 1
Nodes (1): MinecraftEventMap

### Community 94 - "Main Minecraft Process Manager — Send"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): .sendCommand\(\), .sendLog\(\), .start\(\)

### Community 95 - "Renderer Motion Faqs Accordion"
Cohesion (entity basis within full-graph community): 0
Nodes (2): MotionAccordionItem, MotionAccordionProps

### Community 96 - "Renderer Motion Faqs Accordion — Accordion"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): AccordionItem\(\), MotionAccordion\(\), toggle\(\)

### Community 97 - "Renderer Options Tab"
Cohesion (entity basis within full-graph community): 1
Nodes (1): OptionsTabProps

### Community 98 - "Renderer Satisfactory Animated Background"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 99 - "Renderer Satisfactory Players Tab"
Cohesion (entity basis within full-graph community): 1
Nodes (2): SatisfactoryPlayersTab\(\), saveToken\(\)

### Community 100 - "Renderer Setup Tests"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 101 - "Main Steam Downloader"
Cohesion (entity basis within full-graph community): 1
Nodes (3): SteamDownloader, .installApp\(\), .updateCache\(\)

### Community 102 - "Renderer Use Dayz Mod Dependencies"
Cohesion (entity basis within full-graph community): 1
Nodes (2): useDayzModDependencies\(\), handleCheckDependencies\(\)

### Community 103 - "Renderer Use Modal Store"
Cohesion (entity basis within full-graph community): 0
Nodes (2): handleInstall\(\), ModalStore

### Community 104 - "Renderer Use Dayz Mod Store"
Cohesion (entity basis within full-graph community): 0
Nodes (2): DayzModStore, PendingDownload

### Community 105 - "Renderer Use Dayz Options"
Cohesion (entity basis within full-graph community): 1
Nodes (2): useDayzOptions\(\), loadConfig\(\)

### Community 106 - "Renderer Use Dayz Options — Replace"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): handleSave\(\), replaceNumber\(\), replaceString\(\)

### Community 107 - "Renderer Use Dayz Options — Extract"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): parseConfig\(\), extractNumber\(\), extractString\(\)

### Community 108 - "Renderer Use Ipc Listeners"
Cohesion (entity basis within full-graph community): 1
Nodes (2): useIpcListeners\(\), fetchServers\(\)

### Community 109 - "Renderer Use Minecraft Config"
Cohesion (entity basis within full-graph community): 0.67
Nodes (3): useMinecraftConfig\(\), handleSaveConfig\(\), loadConfig\(\)

### Community 110 - "Renderer Use Minecraft Mods"
Cohesion (entity basis within full-graph community): 1
Nodes (2): useMinecraftMods\(\), handleSearchMods\(\)

### Community 111 - "Renderer Use Server Store"
Cohesion (entity basis within full-graph community): 0
Nodes (2): Server, ServerStore

### Community 112 - "Renderer Use Stats Store"
Cohesion (entity basis within full-graph community): 0
Nodes (2): StatPoint, StatsStore

### Community 113 - "Renderer Use Toast Store"
Cohesion (entity basis within full-graph community): 0
Nodes (2): Toast, ToastStore

### Community 114 - "Renderer App"
Cohesion (entity basis within full-graph community): 1
Nodes (2): App\(\), checkCache\(\)

### Community 115 - "Renderer Backups Tab — Backups"
Cohesion (entity basis within full-graph community): 1
Nodes (1): BackupsTabProps

### Community 116 - "Renderer Console Tab"
Cohesion (entity basis within full-graph community): 1
Nodes (1): ConsoleTabProps

### Community 117 - "Main Curse Forge API Client — Curseforge"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .getCurseforgeMod\(\), .getModpackDetails\(\)

### Community 118 - "Main Curse Forge API Client — Search"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .searchCurseforgeMods\(\), .searchModpacks\(\)

### Community 119 - "Main Dayz Config Manager — Dayz"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 120 - "Main Dayz Controller"
Cohesion (entity basis within full-graph community): 1
Nodes (2): DayzController, .register\(\)

### Community 121 - "Renderer Dayz Economy Tab"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 122 - "Renderer Dayz Economy Tab — Dayz"
Cohesion (entity basis within full-graph community): 1
Nodes (2): DayzEconomyTab\(\), renderSlider\(\)

### Community 123 - "Main Dayz Mission Manager"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .extractLocalMission\(\), exists\(\)

### Community 124 - "Main Dayz Mission Manager — Dayz"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .fetchDayzMission\(\), findFolder\(\)

### Community 125 - "Main Db — Register"
Cohesion (entity basis within full-graph community): 1
Nodes (2): updateServerSoftware\(\), .register\(\)

### Community 126 - "Main File System Controller — Controller"
Cohesion (entity basis within full-graph community): 1
Nodes (2): FileSystemController, .register\(\)

### Community 127 - "Main File Tailer — File \(2\)"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .readNewLogs\(\), .tailLogFile\(\)

### Community 128 - "Renderer Game Backgrounds"
Cohesion (entity basis within full-graph community): 1
Nodes (1): GameBackgrounds\(\)

### Community 129 - "Renderer Hub Router"
Cohesion (entity basis within full-graph community): 1
Nodes (2): HubLoader\(\), HubRouter\(\)

### Community 130 - "Preload Index D"
Cohesion (entity basis within full-graph community): 1
Nodes (1): Window

### Community 131 - "Main Logger"
Cohesion (entity basis within full-graph community): 1
Nodes (1): initializeLogger\(\)

### Community 132 - "Main Minecraft Player Manager — Clear"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .clearOnlinePlayers\(\), .handleServerStop\(\)

### Community 133 - "Renderer Mods Tab"
Cohesion (entity basis within full-graph community): 1
Nodes (1): ModsTabProps

### Community 134 - "Renderer Overview Tab"
Cohesion (entity basis within full-graph community): 1
Nodes (1): OverviewTabProps

### Community 135 - "Main Radmin Vpn Adapter — Install"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .install\(\), .sendLog\(\)

### Community 136 - "Main Radmin Vpn Adapter — Installed"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .isInstalled\(\), .open\(\)

### Community 137 - "Refactor Minecraft"
Cohesion (entity basis within full-graph community): 1
Nodes (1): extract\(\)

### Community 138 - "Renderer Renderer Logger"
Cohesion (entity basis within full-graph community): 1
Nodes (1): setupRendererLogger\(\)

### Community 139 - "Main Satisfactory Adapter — Satisfactory"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 140 - "Main Satisfactory Controller"
Cohesion (entity basis within full-graph community): 1
Nodes (1): exists\(\)

### Community 141 - "Main Satisfactory Controller — Controller"
Cohesion (entity basis within full-graph community): 1
Nodes (2): SatisfactoryController, .register\(\)

### Community 142 - "Renderer Satisfactory Hub"
Cohesion (entity basis within full-graph community): 1
Nodes (2): SatisfactoryHub\(\), handleTunnel\(\)

### Community 143 - "Main Seven Days To Die Adapter — Days"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 144 - "Renderer Seven Days To Die Hub"
Cohesion (entity basis within full-graph community): 1
Nodes (2): SevenDaysToDieHub\(\), handleTunnel\(\)

### Community 145 - "Main Steam Auth — Steam"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 146 - "Main Steam Cache — Steam"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 147 - "Shared Steam Games"
Cohesion (entity basis within full-graph community): 1
Nodes (1): SteamGameConfig

### Community 148 - "Main Steam Web API — Workshop"
Cohesion (entity basis within full-graph community): 1
Nodes (2): .getWorkshopItemDetails\(\), .searchWorkshop\(\)

### Community 149 - "Renderer Top Navbar — Cache"
Cohesion (entity basis within full-graph community): 1
Nodes (2): fetchCacheSizes\(\), handleClearSpecificCache\(\)

### Community 150 - "Renderer Use Dayz Hub Store"
Cohesion (entity basis within full-graph community): 1
Nodes (1): DayzHubState

### Community 151 - "Renderer Use Dayz Mod Dependencies — Install"
Cohesion (entity basis within full-graph community): 1
Nodes (2): executeMissingDepsInstall\(\), handleInstallDependencies\(\)

### Community 152 - "Renderer Use Minecraft Mods — Delete"
Cohesion (entity basis within full-graph community): 1
Nodes (2): fetchMods\(\), handleDeleteMod\(\)

### Community 153 - "Renderer Use Minecraft Mods — Install"
Cohesion (entity basis within full-graph community): 1
Nodes (2): handleInstallMod\(\), installWithDeps\(\)

### Community 154 - "Renderer Use UI Store"
Cohesion (entity basis within full-graph community): 1
Nodes (1): UiStore

### Community 155 - "Renderer Versions"
Cohesion (entity basis within full-graph community): 1
Nodes (1): Versions\(\)

### Community 156 - "Electron Vite Config TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 157 - "Env D TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 158 - "File Tailer Test TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 159 - "Main TSX"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 160 - "Minecraft SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 161 - "Postcss Config Js"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 162 - "Tailwind Config Js"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 163 - "Vitest Config TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 164 - "Vitest Workspace TypeScript"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

### Community 165 - "Wavy Lines SVG"
Cohesion (entity basis within full-graph community): n/a
Nodes (0): 

## Knowledge Gaps
- **270 weakly connected node(s):** `.constructor\(\)`, `.getModDependencies\(\)`, `Window`, `Versions\(\)`, `ListViewIconProps` (+265 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Renderer App`** (2 nodes): `App\(\)`, `checkCache\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Backups Tab — Backups`** (2 nodes): `BackupsTab.tsx`, `BackupsTabProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Console Tab`** (2 nodes): `ConsoleTab.tsx`, `ConsoleTabProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Curse Forge API Client — Curseforge`** (2 nodes): `.getCurseforgeMod\(\)`, `.getModpackDetails\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Curse Forge API Client — Search`** (2 nodes): `.searchCurseforgeMods\(\)`, `.searchModpacks\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Dayz Config Manager — Dayz`** (2 nodes): `DayzConfigManager.ts`, `DayzEconomyManager.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Dayz Controller`** (2 nodes): `DayzController`, `.register\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Dayz Economy Tab`** (2 nodes): `DayzEconomyTab.tsx`, `useDayzEconomy.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Dayz Economy Tab — Dayz`** (2 nodes): `DayzEconomyTab\(\)`, `renderSlider\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Dayz Mission Manager`** (2 nodes): `.extractLocalMission\(\)`, `exists\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Dayz Mission Manager — Dayz`** (2 nodes): `.fetchDayzMission\(\)`, `findFolder\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Db — Register`** (2 nodes): `updateServerSoftware\(\)`, `.register\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main File System Controller — Controller`** (2 nodes): `FileSystemController`, `.register\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main File Tailer — File \(2\)`** (2 nodes): `.readNewLogs\(\)`, `.tailLogFile\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Game Backgrounds`** (2 nodes): `GameBackgrounds.tsx`, `GameBackgrounds\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Hub Router`** (2 nodes): `HubLoader\(\)`, `HubRouter\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Preload Index D`** (2 nodes): `index.d.ts`, `Window`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Logger`** (2 nodes): `logger.ts`, `initializeLogger\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Minecraft Player Manager — Clear`** (2 nodes): `.clearOnlinePlayers\(\)`, `.handleServerStop\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Mods Tab`** (2 nodes): `ModsTab.tsx`, `ModsTabProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Overview Tab`** (2 nodes): `OverviewTab.tsx`, `OverviewTabProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Radmin Vpn Adapter — Install`** (2 nodes): `.install\(\)`, `.sendLog\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Radmin Vpn Adapter — Installed`** (2 nodes): `.isInstalled\(\)`, `.open\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Refactor Minecraft`** (2 nodes): `refactor\_minecraft.js`, `extract\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Renderer Logger`** (2 nodes): `rendererLogger.ts`, `setupRendererLogger\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Satisfactory Adapter — Satisfactory`** (2 nodes): `SatisfactoryAdapter.ts`, `SatisfactoryProcessManager.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Satisfactory Controller`** (2 nodes): `SatisfactoryController.ts`, `exists\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Satisfactory Controller — Controller`** (2 nodes): `SatisfactoryController`, `.register\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Satisfactory Hub`** (2 nodes): `SatisfactoryHub\(\)`, `handleTunnel\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Seven Days To Die Adapter — Days`** (2 nodes): `SevenDaysToDieAdapter.ts`, `SevenDaysToDieProcessManager.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Seven Days To Die Hub`** (2 nodes): `SevenDaysToDieHub\(\)`, `handleTunnel\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Steam Auth — Steam`** (2 nodes): `SteamAuth.ts`, `SteamWorkshopDownloader.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Steam Cache — Steam`** (2 nodes): `SteamCache.ts`, `SteamDownloader.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Shared Steam Games`** (2 nodes): `SteamGames.ts`, `SteamGameConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main Steam Web API — Workshop`** (2 nodes): `.getWorkshopItemDetails\(\)`, `.searchWorkshop\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Top Navbar — Cache`** (2 nodes): `fetchCacheSizes\(\)`, `handleClearSpecificCache\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Use Dayz Hub Store`** (2 nodes): `useDayzHubStore.ts`, `DayzHubState`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Use Dayz Mod Dependencies — Install`** (2 nodes): `executeMissingDepsInstall\(\)`, `handleInstallDependencies\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Use Minecraft Mods — Delete`** (2 nodes): `fetchMods\(\)`, `handleDeleteMod\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Use Minecraft Mods — Install`** (2 nodes): `handleInstallMod\(\)`, `installWithDeps\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Use UI Store`** (2 nodes): `useUiStore.ts`, `UiStore`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Renderer Versions`** (2 nodes): `Versions.tsx`, `Versions\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Electron Vite Config TypeScript`** (1 nodes): `electron.vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Env D TypeScript`** (1 nodes): `env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File Tailer Test TypeScript`** (1 nodes): `FileTailer.test.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Main TSX`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Minecraft SVG`** (1 nodes): `minecraft.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Postcss Config Js`** (1 nodes): `postcss.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Config Js`** (1 nodes): `tailwind.config.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Config TypeScript`** (1 nodes): `vitest.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vitest Workspace TypeScript`** (1 nodes): `vitest.workspace.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Wavy Lines SVG`** (1 nodes): `wavy-lines.svg`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does \`ErrorBoundary\` connect \`Renderer Error Boundary\` to \`Renderer Error Boundary — Boundary\`, \`Main TSX\`, \`Renderer Hub Registry\`?**
  _High betweenness centrality \(43711.000\) - this node is a cross-community bridge._
- **Why does \`SatisfactoryProcessManager\` connect \`Main Satisfactory Process Manager\` to \`Main Satisfactory Adapter — Satisfactory\`?**
  _High betweenness centrality \(4593.000\) - this node is a cross-community bridge._
- **Why does \`CacheManager\` connect \`Main Cache Manager\` to \`Main Cache Ipc\`?**
  _High betweenness centrality \(4592.500\) - this node is a cross-community bridge._
- **What connects \`.constructor\(\)\`, \`.getModDependencies\(\)\`, \`Window\` to the rest of the system?**
  _270 weakly-connected nodes found - possible documentation gaps or missing edges._

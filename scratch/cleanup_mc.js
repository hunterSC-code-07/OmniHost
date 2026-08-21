const fs = require('fs');
let content = fs.readFileSync('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx', 'utf8');

// Remove duplicate state declarations (they are passed as props now)
content = content.replace(/const \[servers, setServers\] = useState[^\n]+\n/, '');
content = content.replace(/const \[tunnelStatus, setTunnelStatus\] = useState[^\n]+\n/, '');
content = content.replace(/const \[tunnelIp, setTunnelIp\] = useState[^\n]+\n/, '');
content = content.replace(/const \[showTunnelModal, setShowTunnelModal\] = useState[^\n]+\n/, '');
content = content.replace(/const \[tempTunnelIp, setTempTunnelIp\] = useState[^\n]+\n/, '');
content = content.replace(/const \[radminIp, setRadminIp\] = useState[^\n]+\n/, '');
content = content.replace(/const activeServer = [^\n]+\n/, '');

// Remove unused state declarations
content = content.replace(/const \[activeGameHub, setActiveGameHub\] = useState[^\n]+\n/, '');
content = content.replace(/const \[hoveredGame, setHoveredGame\] = useState[^\n]+\n/, '');
content = content.replace(/const \[toasts, setToasts\] = useState[^\n]+\n/, '');

// Create Server unused variables
content = content.replace(/const \[showCreateModal, setShowCreateModal\] = useState[^\n]+\n/, '');
content = content.replace(/const \[newServerName, setNewServerName\] = useState[^\n]+\n/, '');
content = content.replace(/const \[newServerType, setNewServerType\] = useState[^\n]+\n/, '');
content = content.replace(/const \[newServerVersion, setNewServerVersion\] = useState[^\n]+\n/, '');
content = content.replace(/const \[availableVersions, setAvailableVersions\] = useState[^\n]+\n/, '');
content = content.replace(/const \[newServerLoaderVersion, setNewServerLoaderVersion\] = useState[^\n]+\n/, '');
content = content.replace(/const \[availableLoaderVersions, setAvailableLoaderVersions\] = useState[^\n]+\n/, '');
content = content.replace(/const \[isNewServerTypeMenuOpen, setIsNewServerTypeMenuOpen\] = useState[^\n]+\n/, '');
content = content.replace(/const \[isNewServerVersionMenuOpen, setIsNewServerVersionMenuOpen\] = useState[^\n]+\n/, '');
content = content.replace(/const \[isNewServerLoaderMenuOpen, setIsNewServerLoaderMenuOpen\] = useState[^\n]+\n/, '');
content = content.replace(/const \[isCreatingServer, setIsCreatingServer\] = useState[^\n]+\n/, '');
content = content.replace(/const \[downloadProgress, setDownloadProgress\] = useState[^\n]+\n/, '');
content = content.replace(/const \[downloadText, setDownloadText\] = useState[^\n]+\n/, '');

// SteamCMD unused
content = content.replace(/const \[showSteamLoginModal, setShowSteamLoginModal\] = useState[^\n]+\n/, '');
content = content.replace(/const \[steamLoginAction, setSteamLoginAction\] = useState[^\n]+\n/, '');
content = content.replace(/const \[steamUsername, setSteamUsername\] = useState[^\n]+\n/, '');
content = content.replace(/const \[steamPassword, setSteamPassword\] = useState[^\n]+\n/, '');
content = content.replace(/const \[steamGuardCode, setSteamGuardCode\] = useState[^\n]+\n/, '');
content = content.replace(/const \[isSteamGuardRequired, setIsSteamGuardRequired\] = useState[^\n]+\n/, '');
content = content.replace(/const \[isDayzCached, setIsDayzCached\] = useState[^\n]+\n/, '');

// Modpack unused
content = content.replace(/const \[modpackSearch, setModpackSearch\] = useState[^\n]+\n/, '');
content = content.replace(/const \[modpackVersionFilter, setModpackVersionFilter\] = useState[^\n]+\n/, '');
content = content.replace(/const \[modpackLoaderFilter, setModpackLoaderFilter\] = useState[^\n]+\n/, '');
content = content.replace(/const \[isModpackVersionMenuOpen, setIsModpackVersionMenuOpen\] = useState[^\n]+\n/, '');
content = content.replace(/const \[isModpackLoaderMenuOpen, setIsModpackLoaderMenuOpen\] = useState[^\n]+\n/, '');
content = content.replace(/const \[modpacks, setModpacks\] = useState[^\n]+\n/, '');
content = content.replace(/const \[selectedModpack, setSelectedModpack\] = useState[^\n]+\n/, '');
content = content.replace(/const \[isSearchingPacks, setIsSearchingPacks\] = useState[^\n]+\n/, '');
content = content.replace(/const \[installedModpacks, setInstalledModpacks\] = useState[^\n]+\n/, '');
content = content.replace(/const \[isInstallingModpack, setIsInstallingModpack\] = useState[^\n]+\n/, '');

// Remove handler functions that are passed as props
content = content.replace(/const handleTunnel = async \(\) => \{[\s\S]*?^  \};\n/m, '');
content = content.replace(/const handleStart = async \(id: number\) => \{[\s\S]*?^  \};\n/m, '');
content = content.replace(/const handleStop = async \(id: number\) => \{[\s\S]*?^  \};\n/m, '');
content = content.replace(/const handleRestart = async \(id: number\) => \{[\s\S]*?^  \};\n/m, '');
content = content.replace(/const handleDelete = async \(id: number\) => \{[\s\S]*?^  \};\n/m, '');

// Also unused function handleCreateServer, confirmDeleteServer, handleClearCache, formatBytes
content = content.replace(/const handleCreateServer = async \(\) => \{[\s\S]*?^  \};\n/m, '');
content = content.replace(/const confirmDeleteServer = async \(\) => \{[\s\S]*?^  \};\n/m, '');
content = content.replace(/const handleClearCache = async \(\) => \{[\s\S]*?^  \};\n/m, '');
content = content.replace(/const formatBytes = \(bytes: number, decimals = 2\) => \{[\s\S]*?^  \};\n/m, '');
content = content.replace(/const handleUpdateSteamCache = async \(\) => \{[\s\S]*?^  \};\n/m, '');

fs.writeFileSync('src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx', content);
console.log('Cleaned up MinecraftHub.tsx');

# OmniHost Codebase Architecture (Brain)

Welcome to the OmniHost codebase! This document provides a high-level overview of the project's structure, technologies, and core architecture to help you navigate and understand how everything fits together.

## 🛠️ Tech Stack

- **Framework**: Electron (packaged via `electron-vite`)
- **Frontend**: React 19, TypeScript, Tailwind CSS, Framer Motion (for animations)
- **Backend (Main Process)**: Node.js, TypeScript
- **Database**: `better-sqlite3` for local persistence
- **Networking**: `frp` (Fast Reverse Proxy), Radmin VPN for tunneling and port forwarding
- **Game Server Integration**: SteamCMD (for DayZ and other Steam games), custom Java fetcher for Minecraft

## 📂 Folder Structure

The repository follows a standard `electron-vite` layout:

```text
OmniHost/
├── .omnihost-data/        # Application runtime data (portable userData directory)
│   ├── db.sqlite          # SQLite database
│   ├── servers/           # Downloaded server files
│   └── steamcmd/          # SteamCMD installation and workshop downloads
├── src/
│   ├── main/              # Backend Electron processes (Node.js)
│   ├── preload/           # Context bridge between main and renderer
│   └── renderer/          # Frontend React application
└── package.json           # Project dependencies and scripts
```

## 🧠 Main Process Architecture (`src/main`)

The backend is responsible for spawning and managing heavy child processes (like game servers, steamcmd, and VPN tunnels), reading/writing files, and interacting with the local SQLite database.

### Core Modules

- **`index.ts`**: The main entry point. Sets up the Electron window, initializes networking providers (`FrpAdapter`, `RadminVpnAdapter`), and registers all IPC handlers.
- **`db.ts`**: Initializes `better-sqlite3` and exports the database instance.
- **`adapters/`**: Classes that encapsulate complex external integrations.
  - `DayzAdapter.ts`: Bootstraps and manages DayZ server setups.
  - `JavaManager.ts`: Automatically downloads and manages portable Java Runtimes (JREs).
  - `FrpAdapter.ts`, `PlayitAdapter.ts`, `RadminVpnAdapter.ts`: Manages network tunneling to expose local servers to the internet securely.
  - `WakeProxy.ts`: A custom TCP proxy that intercepts connections to wake sleeping servers.
- **`dayz/`**: Dedicated backend module for DayZ server management.
  - Includes `DayzProcessManager`, `DayzModInstaller`, `DayzEconomyManager`, and `DayzConfigManager` to handle all DayZ-specific workflows.
- **`minecraft/`**: Dedicated backend module for Minecraft specifics.
  - `MinecraftProcessManager.ts`: Handles lifecycle monitoring, resource polling (CPU/RAM), and process termination.
  - `MinecraftCommandBuilder.ts`: Assembles complex JVM startup arguments and parses `run.bat` scripts for Forge/NeoForge servers.
  - Includes managers for downloading jars (`MinecraftDownloader`), mods (`MinecraftModManager`), and players (`MinecraftPlayerManager`).
- **`steam/`**: Dedicated backend module for SteamCMD and Steam Workshop interactions.
  - Includes `SteamCMDSetup`, `SteamDownloader`, and `SteamWorkshopDownloader` for fetching games and mods directly from Steam.
- **`ipc/`**: The bridges that listen for requests from the frontend UI.
  - `SystemIpc.ts`: System-level tasks (creating servers, deleting servers, VPN toggles).
  - `ServerIpc.ts`: Generic server operations (start/stop, file management, config reading).
  - `MinecraftIpc.ts`: Minecraft-specific features (player inventory management, RCON commands).
  - `SteamCMDIpc.ts`: Dedicated handlers for SteamCMD tasks (installing mods).

## 🌉 Preload & IPC Bridge (`src/preload`)

To maintain security, the frontend cannot access Node.js directly. The `preload/index.ts` script uses `contextBridge` to expose a `window.api` object to the frontend.

Every time the frontend needs to read a file or start a server, it calls a function on `window.api`, which fires an `ipcRenderer.invoke` event that is caught by the handlers in `src/main/ipc`.

## 🎨 Renderer Process Architecture (`src/renderer/src`)

The frontend is a modern React application utilizing Tailwind CSS for styling and Framer Motion for smooth micro-animations.

### Core Components

- **`App.tsx`**: The root component. Handles routing between different views using a simple state-based router (`activeTab`).
- **`components/hubs/`**: The primary views of the application.
  - `DashboardHub`: The main screen where users see all their installed servers, create new ones, and manage global settings.
  - `DayzHub`: The management interface for a specific DayZ server.
  - `MinecraftHub`: The management interface for a specific Minecraft server.
- **Hub Tabs**: Inside each game hub, functionality is split into tabs:
  - `*ConsoleTab.tsx`: Shows real-time stdout/stderr from the running server process.
  - `*OptionsTab.tsx`: Provides a user-friendly UI for editing game-specific configuration files (like `serverDZ.cfg` or `server.properties`).
  - `*ModsTab.tsx`: Interfaces with Steam Workshop or Modrinth to search for, install, and manage mods. (Note: Mod operations and searches are encapsulated into cohesive hooks like `useDayzModSearch` and `useDayzModImport`).
  - `*FilesTab.tsx`: A built-in file explorer to browse, delete, and edit raw server files.
  - **Helper Components**: Complex tabs often delegate rendering to sub-components (e.g., `DayzModModals.tsx`) to avoid bloated React components.
- **`components/unlumen-ui/`**: Reusable, highly stylized UI components (buttons, modals, inputs) that give OmniHost its premium aesthetic.

## 🔄 Core Workflows

### 1. Creating a Server
1. User clicks "Create Server" in `DashboardHub`.
2. Frontend calls `window.api.createServer(type, name)`.
3. Backend (`SystemIpc.ts`) inserts a new row into the SQLite `servers` table and returns the new Server ID.

### 2. Downloading & Starting (e.g., DayZ)
1. User clicks "Start Server" in `DayzHub`.
2. Frontend calls `window.api.startServer(serverId)`.
3. Backend (`ServerIpc.ts`) looks up the server type.
4. `DayzAdapter` takes over:
   - Uses `SteamCMDManager` to download/update the base game files if missing.
   - Generates necessary startup parameters (e.g., loading installed mods).
   - Spawns the `DayZServer_x64.exe` process.
   - Pipes `stdout` to the frontend via webContents IPC so the `ConsoleTab` updates in real-time.

### 3. Networking & Tunnels
If the user enables a "Tunnel" in the UI, the `FrpAdapter` starts a background `frpc` process that forwards the server's local port to a public remote proxy, allowing external players to connect without manual router port-forwarding.

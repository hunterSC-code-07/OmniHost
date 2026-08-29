# OmniHost Game Integration Guide

> [!IMPORTANT]
> **To the AI Agent reading this prompt:** Your task is to add a new Steam game server integration to the OmniHost application. OmniHost relies on a strictly decoupled, dynamic plugin architecture. Under no circumstances should you create "God Nodes" or hardcode game-specific logic into central routing files. You must isolate your code into specific frontend and backend game folders.

## Codebase Architecture Overview

OmniHost is an Electron-based React application designed to host a wide variety of game servers. It uses a **Dynamic Registry Architecture** powered by Vite's `import.meta.glob`. 

- **Frontend (React)**: All game hubs are located in `src/renderer/src/components/hubs/`. The application automatically discovers supported games by scanning for `*.config.ts` files inside these hub folders.
- **Backend (Node.js)**: Server lifecycle adapters are located in `src/main/adapters/`. The backend dynamically registers adapters using `*.config.ts` files.

There is **NO central `SteamGames.ts` list**. You do not need to edit `DashboardHub.tsx`, `HubRouter.tsx`, or `ServerLifecycleController.ts` to register a new game. 

---

## Step-by-Step Implementation Guide

Follow these exact steps to add a new game (e.g., "Ark: Survival Evolved"):

### Part 1: Backend Implementation

The backend is responsible for defining the server's lifecycle (start, stop) and its Steam configuration.

1. **Create the Adapter Config**
   - Create a file: `src/main/adapters/[GameName].config.ts`
   - Example (`Ark.config.ts`):
   ```typescript
   import { GameHubConfig } from './AdapterRegistry';

   export const config: GameHubConfig = {
     id: 'ark',
     name: 'Ark: Survival Evolved',
     steamAppId: 376030, // The SteamCMD App ID for the dedicated server
     executable: 'ShooterGame/Binaries/Win64/ShooterGameServer.exe',
     // Factory method to return the server adapter class
     factory: async (serverId) => {
       const { ArkAdapter } = await import('../ark/ArkAdapter');
       return new ArkAdapter(serverId);
     }
   };
   ```

2. **Create the Process Manager & Adapter**
   - Create a dedicated folder for backend logic: `src/main/[gameName]/`
   - Implement `[GameName]ProcessManager.ts`: This class should use `spawn` to start the server executable, tail standard output to the central `logStore`, and monitor regex patterns for events like players joining/leaving.
   - Implement `[GameName]Adapter.ts`: This class must implement the `IServerAdapter` interface (having `start()`, `stop()`, and `get process()` methods) and wrap your Process Manager.

### Part 2: Frontend Implementation

The frontend is responsible for the Hub UI, which includes tabs for the console, options, and files.

1. **Create the Hub Directory**
   - Create a dedicated folder: `src/renderer/src/components/hubs/[GameName]Hub/`

2. **Create the Hub Config**
   - Create a file: `src/renderer/src/components/hubs/[GameName]Hub/[GameName]Hub.config.ts`
   - This file allows the Dashboard and Create Server modals to automatically display your game.
   - Example (`ArkHub.config.ts`):
   ```typescript
   export const config = {
     id: 'ark',
     name: 'Ark: Survival Evolved',
     steamAppId: 376030,
     bgGradient: 'from-green-900/40 to-black', // Used for dynamic theming
     // Lazy load the React component
     component: () => import('./ArkHub').then(m => m.ArkHub)
   };
   ```

3. **Build the Hub Component (`[GameName]Hub.tsx`)**
   - Your hub should define the UI layout for the game server.
   - You can copy the layout from an existing hub (like `SevenDaysToDieHub.tsx` or `DayzHub.tsx`) which standardizes the Top Bar (Start, Stop, Restart, Tunnel buttons) and the Tab Navigation.
   - Ensure the component fetches the `activeServer` from `useServerStore()` and renders tabs conditionally.

4. **Implement Hub Tabs (`tabs/`)**
   - Create a `tabs` subdirectory within your Hub folder.
   - **Console Tab**: Implement a console output viewer connecting to `window.api.server.onConsoleLog`.
   - **Options Tab**: If the game uses an XML, JSON, or INI config file, implement a `use[GameName]Options.ts` hook using `window.api.fs.readFile()` to parse and edit the file natively from the frontend. Expose these settings visually in an `[GameName]OptionsTab.tsx`.
   - **Files Tab**: You can simply import and reuse the generic files tab component from another hub, or build a specialized one.
   - **Live Players Tab**: For viewing connected players and performing basic player management (if supported).
   - **Server Overview Tab**: For starting/stopping the server and viewing high-level status.

**UI & Tabs Pattern Requirement:** When creating a new game integration, by default every new base game hub MUST include the **Server Overview Tab**, **Options Tab**, and **Live Players Tab**. Do not omit these unless requested. Keep styling consistent using the existing `surface-container` and `material-symbols-outlined` Tailwind design system.

---

## FRP Tunneling Architecture

FRP Tunneling relies on a decoupled registry pattern:
1. **Base Adapter**: `BaseFrpAdapter.ts` provides the foundational logic for generating the `frpc.toml` config, managing the sub-process, and passing logs through IPC.
2. **Game-Specific Adapters**: Individual games implement their own `FrpAdapter[GAME].ts` extending `BaseFrpAdapter`. They override `getProxyConfig(localIp: string): string` to return their specific game's `[[proxies]]` TOML string for TCP/UDP ports.
3. **Registration**: These adapters are instantiated and registered dynamically in `NetworkIpc.ts` via the `tunnelProviders` map. 

Do not bundle proxy configurations into a monolithic FRP adapter; always subclass `BaseFrpAdapter`.

## Configuration Pathing

If a game uses a configuration file located in standard OS directories (e.g., `AppData/LocalLow/` instead of the local server folder), the read/write logic must be securely routed. This is handled by overriding path behavior in `SystemIpc.ts`'s `read-config` and `write-config` channels. Always use standard IPC calls for file manipulation on the frontend instead of raw `fs` modules to maintain Electron security.

---

## Critical Rules to Remember

1. **NO God Nodes**: Do NOT modify `src/renderer/src/components/layout/HubRegistry.ts` or `src/main/adapters/AdapterRegistry.ts` to import your files. The `import.meta.glob` handles it automatically.
2. **Dashboard Visibility**: By providing a valid `[GameName]Hub.config.ts` with an `id`, `name`, and `component`, the application will automatically render a card for your game on the Dashboard and in the Create Server Modals.
3. **Decoupled Architecture**: All game-specific logic MUST reside in the game's specific frontend and backend directories. Never pollute generic controllers with game-specific `if/else` checks.

---

## Agent Pro-Tips & Common Pitfalls

If you are an AI agent integrating a new Steam game, watch out for these common issues:

1. **SteamCMD App ID vs. Game App ID**: The `steamAppId` you define in the config must be the ID for the **Dedicated Server Tool**, which is usually different from the base game's App ID. Always verify the correct server ID.
2. **UDP is King**: Most Steam games rely heavily on UDP for server discovery and gameplay (e.g., RakNet, Steam query protocols). When subclassing `BaseFrpAdapter`, ensure you map BOTH `tcp` and `udp` proxies for the required game ports.
3. **Log Tailing Quirks**: Some game servers do not write to standard output natively. You may need to pass specific launch arguments (like `-log` or `-batchmode`) to capture logs in your `spawn` process. If the game rigidly writes to a file instead, you must implement a file watcher in your Process Manager to stream it to the console.
4. **Obscure Config Paths**: Not all games keep their config files in their local installation folder. Many Unity and Unreal Engine games store configs in `AppData/LocalLow/...` or `Saved/Config/WindowsServer/`. Find the exact absolute path before building your Options tab.
5. **Steam Server Login Tokens (GSLTs)**: Many modern Steam games refuse to list the server publicly unless a GSLT is provided in the configuration. Always add a UI field in the Options Tab for the user to provide this token if the game requires it.

> [!TIP]
> After creating your files, restart the Vite dev server to ensure `import.meta.glob` picks up your new `*.config.ts` files!

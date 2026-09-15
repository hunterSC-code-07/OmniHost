<div align="center">
  <h1>OmniHost</h1>
  <p><strong>The Ultimate, All-In-One Local Game Server Manager</strong></p>

  <p>
    <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
    <img alt="Platform" src="https://img.shields.io/badge/platform-Windows-lightgrey.svg" />
  </p>

  <p>
    OmniHost is a modern, high-performance desktop application built with Electron, React, and TypeScript. It is designed to provide a seamless, beautiful, and robust experience for deploying, configuring, and managing dedicated servers for your favorite multiplayer games—all from your local machine, while bypassing the headaches of traditional port-forwarding.
  </p>
</div>

---

## 🚀 Supported Games

OmniHost has evolved far beyond Minecraft. Launch and manage servers for the hottest multiplayer titles with a single click:
- **Minecraft** (Vanilla, Paper, Fabric, Forge, NeoForge)
- **Palworld**
- **Enshrouded**
- **Satisfactory**
- **DayZ**
- **Terraria**
- **7 Days to Die**
- **The Forest** & **Sons of the Forest**

## ✨ Core Features

### 🎮 One-Click Server Deployments
Say goodbye to complex command-line setups. OmniHost automatically fetches the required server files (via SteamCMD or native APIs), installs them, and sets up the server directories for you.

### 🌐 Hassle-Free Networking (No Port Forwarding!)
OmniHost integrates multiple tunneling solutions so your friends can join instantly:
- **Cloud Tunneling (`frp`)**: Expose your servers globally via a secure proxy.
- **Radmin VPN Integration**: Easily host virtual LAN networks.
- **Auto-Port Detection**: OmniHost intelligently detects and displays the required ports for the game you are hosting.

### 🤖 Integrated Discord "Self-Service" Bot
Allow your friends to manage the server themselves! OmniHost includes a built-in Discord bot that can be linked to your server. Players can use Discord slash commands (`/start`, `/stop`, `/status`) to control the server, so you don't have to keep your PC running 24/7.

### 📦 Seamless Mod & Modpack Management
- **Minecraft**: Browse, search, install, and update CurseForge mods and modpacks directly inside the app.
- **DayZ & Others**: Integrated Steam Workshop support allowing you to search and sync mods with your dedicated servers.

### 🧠 Smart Auto-Start, Stop & WakeProxy
Save your system resources. OmniHost features an inactivity monitor that shuts down the server when empty, and a lightweight **WakeProxy** that listens on the game's port and instantly spins up the heavy server process the moment a player attempts to connect.

### 🎛️ Dynamic Hardware & Settings Allocation
Scale your server's max RAM, tweak CPU priorities, and edit crucial game settings (like server name, passwords, and world configurations) using clean, intuitive visual sliders and toggles.

### 🎨 Stunning Visual Hubs
Every game has its own uniquely themed, animated hub. OmniHost uses a sleek dark mode aesthetic with vibrant colors, glassmorphism, and smooth micro-animations for a premium UX.

### 🎵 Custom Boot Sounds
Personalize your experience by adding your own custom boot audio (`.mp3`, `.wav`, `.flac`) that plays when OmniHost launches.

---

## 🛠️ Tech Stack

OmniHost is built using the latest web and desktop technologies:
- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Backend / Desktop**: Node.js, Electron (IPC Main)
- **Database / Storage**: SQLite (`better-sqlite3`), Local JSON Configs
- **Network / Tooling**: SteamCMD, Fast Reverse Proxy (FRP)

---

## ⚙️ Installation & Setup

### Prerequisites

- **OS**: Windows 10/11 (OmniHost relies on Windows-specific scripts and paths).
- **Node.js**: v18.0.0 or newer.
- **Git**

### Running Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hunterSC-code-07/OmniHost.git
   cd OmniHost
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   This will launch the Electron app with live-reloading enabled for both the main and renderer processes.

### Building for Production

To package OmniHost into a standalone Windows executable for distribution, run:

```bash
npm run build:win
```
The compiled binaries and setup installers will be output to the `dist` directory.

---

## ☁️ Free-Tier Cloud Tunneling Setup

OmniHost includes a built-in tunneling system (using Fast Reverse Proxy) to share your server globally without opening ports on your home router. You can host the central tunnel endpoint completely for **free** using Google Cloud Platform (GCP).

<details>
<summary><b>Click here to view the GCP Setup Guide</b></summary>

### 1. Create a Free GCP Instance
1. Sign up for Google Cloud Platform and go to **Compute Engine** -> **VM Instances**.
2. Click **Create Instance**.
3. Select an `e2-micro` machine type (part of the "Always Free" tier).
4. Choose an OS (e.g., Ubuntu 22.04 LTS) and check "Allow HTTP/HTTPS traffic". Click **Create**.

### 2. Configure Firewall Rules
1. Navigate to **VPC Network** -> **Firewall**.
2. Click **Create Firewall Rule**, name it `omnihost-frp`.
3. Set **Targets** to `All instances in the network`, and **Source IPv4 ranges** to `0.0.0.0/0`.
4. Under Protocols and Ports, select **tcp** and enter `7000, 25565` (or whatever game ports you need).

### 3. Install FRP on your Cloud VM
SSH into your new VM and run:
```bash
wget https://github.com/fatedier/frp/releases/download/v0.58.0/frp_0.58.0_linux_amd64.tar.gz
tar -zxvf frp_0.58.0_linux_amd64.tar.gz
cd frp_0.58.0_linux_amd64/

cat <<EOF > frps.toml
bindPort = 7000
EOF

nohup ./frps -c ./frps.toml &
```

### 4. Connect OmniHost
1. Copy the **External IP** of your Google Cloud VM.
2. In OmniHost, navigate to the Network settings of your server.
3. Enter your GCP External IP into the tunneling configuration.
4. Enable the tunnel, and players can now connect to your server using `YOUR_GCP_IP:PORT`!

</details>

---

## 📁 Project Architecture

Following a recent structural cleanup, the codebase is modular and highly organized:

- `src/main/`: Electron backend logic.
  - `storage/`: SQLite database configurations and local caching logic.
  - `network/`: Port mapping, proxies, and networking integrations.
  - `discord/`: The integrated Discord bot logic.
  - `[game_name]/`: Dedicated logic for specific game servers (e.g., `minecraft`, `dayz`, `palworld`).
- `src/renderer/`: The React frontend interface.
  - `components/hubs/`: Modular UI dashboards customized for each specific game.
  - `components/common/`: Shared UI components, animated backgrounds, and layouts.
- `src/preload/`: The secure bridge exposing native Node functionalities to the React renderer.

---

## 🤝 Contributing

We welcome contributions, issues, and feature requests!
If you find a bug or have an idea to improve the app, please open an issue or submit a Pull Request.

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

<div align="center">
  <sub>Built with ❤️ for gamers.</sub>
</div>

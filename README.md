# OmniHost

OmniHost is a modern, high-performance Minecraft server management application built with Electron, React, and TypeScript. It is designed to provide a seamless, all-in-one desktop experience for deploying, configuring, and running Minecraft servers locally, while bypassing the headaches of traditional port-forwarding.

![OmniHost UI Preview](https://via.placeholder.com/1200x600.png?text=OmniHost+Dashboard)

## 🚀 Features

- **Multi-Loader Support**: Create Vanilla, Paper, Fabric, Forge, and NeoForge servers with a single click.
- **Integrated Mod Management**: Browse, search, install, and update mods and modpacks directly from CurseForge within the app.
- **Auto-Java Management**: Automatically downloads and maps the correct Java version (Java 8, 16, 17, 21, or 25) depending on your selected Minecraft version.
- **Dynamic Hardware Allocation**: Easily scale your server's maximum RAM usage and CPU core limits using visual sliders.
- **Cloud Tunneling (`frp`)**: Expose your local servers to the internet using a secure cloud tunnel—no router port-forwarding required.
- **Smart Auto-Start & Auto-Stop**: Save system resources with an inactivity monitor that shuts down the server when empty, and a WakeProxy that instantly spins the server up the moment a player attempts to connect.
- **Built-in File Manager**: A rich visual file explorer for modifying server properties, exploring worlds, and editing configurations without leaving the app.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js, Electron (IPC Main)
- **Build Tool**: Vite (`electron-vite`)

---

## ⚙️ Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v16.14.0 or newer)
- Git

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

To package OmniHost into a standalone executable for distribution, run the build command matching your OS:

- **Windows:**
  ```bash
  npm run build:win
  ```
- **macOS:**
  ```bash
  npm run build:mac
  ```
- **Linux:**
  ```bash
  npm run build:linux
  ```

The compiled binaries and installers will be output to the `dist` directory.

## ☁️ Google Cloud Free-Tier Tunnel Setup (FRP)

OmniHost includes a built-in tunneling system (using Fast Reverse Proxy) to share your server globally without opening ports on your home router.

You can host the central tunnel endpoint completely for **free** using Google Cloud Platform (GCP).

### 1. Create a Free GCP Instance

1. Sign up for Google Cloud Platform and go to **Compute Engine** -> **VM Instances**.
2. Click **Create Instance**.
3. Select an `e2-micro` machine type (this is part of the "Always Free" tier).
4. Choose an OS (e.g., Ubuntu 22.04 LTS).
5. In the Firewall section, check "Allow HTTP/HTTPS traffic". Click **Create**.

### 2. Configure Firewall Rules

1. In the GCP search bar, search for **VPC Network** -> **Firewall**.
2. Click **Create Firewall Rule**.
3. Name it `omnihost-frp`.
4. Set **Targets** to `All instances in the network`.
5. Set **Source IPv4 ranges** to `0.0.0.0/0`.
6. Under Protocols and Ports, select **Specified protocols and ports**. Check **tcp** and enter `7000, 25565`.
7. Click **Create**.

### 3. Install FRP on your Cloud VM

SSH into your new VM using the GCP console and run the following commands to install and start the FRP Server:

```bash
# Download and extract the latest frp release
wget https://github.com/fatedier/frp/releases/download/v0.58.0/frp_0.58.0_linux_amd64.tar.gz
tar -zxvf frp_0.58.0_linux_amd64.tar.gz
cd frp_0.58.0_linux_amd64/

# Create the server configuration file
cat <<EOF > frps.toml
bindPort = 7000
EOF

# Start the server in the background
nohup ./frps -c ./frps.toml &
```

### 4. Connect OmniHost

1. Copy the **External IP** of your Google Cloud VM from the Compute Engine dashboard.
2. In OmniHost, navigate to the `FrpAdapter.ts` (or the tunneling options tab when configuring).
3. Ensure the target IP matches your new GCP External IP.
4. When you start your OmniHost server and enable the tunnel, players can now connect to your server using `YOUR_GCP_IP:25565`!

---

## 📁 Project Structure

- `src/main/`: Electron backend logic. Handles server processes, proxies, Java management, IPC events, and API interactions.
  - `adapters/`: Contains integration logic for Minecraft servers, CurseForge, Java parsing, and FRP tunneling.
- `src/renderer/`: The React frontend interface.
  - `components/tabs/`: Contains the modular UI tabs (Console, Options, File Manager, Mod Browser).
- `src/preload/`: The secure bridge exposing native Node functionalities to the React renderer.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
If you find a bug or have an idea, please open an issue or submit a Pull Request.

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

import { app } from 'electron'
import { join } from 'path'
import fsPromises from 'fs/promises'
import fs from 'fs'

export class DayzConfigManager {
  static async exists(path: string) {
    try {
      await fsPromises.access(path)
      return true
    } catch {
      return false
    }
  }

  static async ensureDefaultConfig(serverDir: string) {
    if (!fs.existsSync(serverDir)) fs.mkdirSync(serverDir, { recursive: true })

    const cfgPath = join(serverDir, 'serverDZ.cfg')
    if (!fs.existsSync(cfgPath)) {
      const defaultCfg = `BattlEye = 0;               // Disable BattlEye for proxy/FRP compatibility
steamQueryPort = 27016;     // Explicitly set Steam Query Port for FRP Tunnel
hostname = "OmniHost DayZ Server";  // Server name
password = "";              // Password to connect to the server
passwordAdmin = "";         // Password to become a server admin
maxPlayers = 60;            // Maximum amount of players
verifySignatures = 2;       // Verifies .pbos against .bisign files. (only 2 is supported)
forceSameBuild = 1;         // When enabled, the server will allow the connection only to clients with same the .exe revision as the server (value 0-1)
disableVoN = 0;             // Enable/disable voice over network (value 0-1)
vonCodecQuality = 20;       // Voice over network codec quality, the higher the better (values 0-30)
disable3rdPerson=0;         // Toggles the 3rd person view for players (value 0-1)
disableCrosshair=0;         // Toggles the cross-hair (value 0-1)
serverTime="SystemTime";    // Initial in-game time of the server. "SystemTime" means the local time of the machine. Another possibility is to set the time to some value in "YYYY/MM/DD/HH/MM" format, f.e. "2015/4/8/17/23"
serverTimeAcceleration=1;   // Accelerated Time (value 0-24)
serverNightTimeAcceleration=1; // Accelerated Nigh Time
serverTimePersistent=0;     // Persistent Time
guaranteedUpdates=1;        // Communication protocol used with game server (use only number 1)
loginQueueConcurrentPlayers=5; // The number of players concurrently processed during the login process.
loginQueueMaxPlayers=500;   // The maximum number of players that can wait in login queue
instanceId = 1;             // DayZ server instance id, to identify the number of instances per box and their storage folders with persistence files
storeHouseStateDisabled = false;// Disable houses/doors persistence (value true/false), usable in case of problems with persistence
storageAutoFix = 1;         // Checks if the persistence files are corrupted and replaces corrupted ones with empty ones (value 0-1)

class Missions
{
    class DayZ
    {
        template="dayzOffline.chernarusplus"; // Mission to load on server startup.
    };
};
`
      fs.writeFileSync(cfgPath, defaultCfg)
    }
  }

  static async readConfig(serverId: number) {
    if (serverId == null) return null
    const serverDir = join(app.getPath('userData'), 'servers', serverId.toString())
    const cfgPath = join(serverDir, 'serverDZ.cfg')
    if (await this.exists(cfgPath)) {
      return await fsPromises.readFile(cfgPath, 'utf-8')
    }
    return null
  }

  static async writeConfig(serverId: number, content: string) {
    if (serverId == null) return false
    const serverDir = join(app.getPath('userData'), 'servers', serverId.toString())
    const cfgPath = join(serverDir, 'serverDZ.cfg')
    if (await this.exists(cfgPath)) {
      await fsPromises.writeFile(cfgPath, content)
      return true
    }
    return false
  }
}

export interface SteamGameConfig {
  appId: number;
  executable: string;
}

export const STEAM_GAMES: Record<string, SteamGameConfig> = {
  DayZ: {
    appId: 223350,
    executable: 'DayZServer_x64.exe'
  },
  Satisfactory: {
    appId: 1690800,
    executable: 'FactoryServer.exe'
  }
};

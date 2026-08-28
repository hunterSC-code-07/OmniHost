import { MinecraftProcessManager } from '../minecraft/MinecraftProcessManager';

export type IServerAdapter = {
  serverId: number;
  start(): Promise<void>;
  stop(): void;
  process?: any;
  logHistory?: string[];
  onlinePlayers?: string[];
  sendCommand?: (cmd: string) => void;
};

export interface AdapterConfig {
  gameName: string;
  steamAppId?: number;
  executable?: string;
  factory: (id: number) => IServerAdapter;
}

const configModules = import.meta.glob('./*.config.ts', { eager: true });

export class AdapterRegistry {
  private static registry: Record<string, (id: number) => IServerAdapter> = {};
  private static steamConfigs: Record<string, { appId: number, executable?: string }> = {};

  static {
    for (const path in configModules) {
      const mod = configModules[path] as { config: AdapterConfig };
      if (mod && mod.config && mod.config.gameName) {
        AdapterRegistry.register(mod.config.gameName, mod.config.factory);
        if (mod.config.steamAppId) {
          AdapterRegistry.steamConfigs[mod.config.gameName] = {
            appId: mod.config.steamAppId,
            executable: mod.config.executable
          };
        }
      }
    }
  }

  static register(game: string, factory: (id: number) => IServerAdapter) {
    this.registry[game] = factory;
  }

  static getAdapter(game: string, id: number): IServerAdapter {
    const factory = this.registry[game];
    if (factory) {
      return factory(id);
    }
    // Fallback to Minecraft
    return new MinecraftProcessManager(id) as unknown as IServerAdapter;
  }

  static getSteamGameConfigs(): Record<string, { appId: number, executable?: string }> {
    return this.steamConfigs;
  }
}

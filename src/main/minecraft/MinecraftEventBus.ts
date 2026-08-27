import { EventEmitter } from 'events';

export interface MinecraftEventMap {
  'server-started': (serverId: number) => void;
  'server-stopped': (serverId: number) => void;
  'player-joined': (serverId: number, serverDir: string, username: string) => void;
  'player-left': (serverId: number, serverDir: string, username: string) => void;
  'console-log': (serverId: number, msg: string) => void;
  'server-stats': (serverId: number, cpu: number, ram: number) => void;
}

class MinecraftEventBus extends EventEmitter {
  on<K extends keyof MinecraftEventMap>(eventName: K, listener: MinecraftEventMap[K]): this {
    return super.on(eventName, listener);
  }
  emit<K extends keyof MinecraftEventMap>(eventName: K, ...args: Parameters<MinecraftEventMap[K]>): boolean {
    return super.emit(eventName, ...args);
  }
}

export const minecraftEventBus = new MinecraftEventBus();

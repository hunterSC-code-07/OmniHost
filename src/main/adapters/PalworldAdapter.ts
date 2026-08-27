import { PalworldProcessManager } from '../palworld/PalworldProcessManager';

export class PalworldAdapter {
  serverId: number;
  private processManager: PalworldProcessManager;

  constructor(serverId: number) {
    this.serverId = serverId;
    this.processManager = new PalworldProcessManager(serverId);
  }

  async start() {
    await this.processManager.start();
  }

  stop() {
    this.processManager.stop();
  }

  sendCommand(cmd: string) {
    this.processManager.sendCommand(cmd);
  }

  get process() {
    return this.processManager.process;
  }

  get logHistory() {
    return this.processManager.logHistory;
  }

  get onlinePlayers() {
    return this.processManager.onlinePlayers;
  }

  get omnihostMeta() {
    return this.processManager.omnihostMeta;
  }

  set omnihostMeta(meta: any) {
    this.processManager.omnihostMeta = meta;
  }
}

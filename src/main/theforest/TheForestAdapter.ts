import { TheForestProcessManager } from './TheForestProcessManager';
import { IServerAdapter } from '../adapters/AdapterRegistry';

export class TheForestAdapter implements IServerAdapter {
  serverId: number;
  private processManager: TheForestProcessManager;

  constructor(serverId: number) {
    this.serverId = serverId;
    this.processManager = new TheForestProcessManager(serverId);
  }

  async start() {
    await this.processManager.start();
  }

  stop() {
    this.processManager.stop();
  }

  get process() {
    return this.processManager.process;
  }

  get onlinePlayers() {
    return this.processManager.onlinePlayers;
  }

  get logHistory() {
    return this.processManager.logHistory;
  }

  sendCommand(cmd: string) {
    this.processManager.sendCommand(cmd);
  }
}

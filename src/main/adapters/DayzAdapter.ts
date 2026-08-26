import { DayzProcessManager } from '../dayz/DayzProcessManager';

export class DayzAdapter {
  serverId: number;
  private processManager: DayzProcessManager;

  constructor(serverId: number) {
    this.serverId = serverId;
    this.processManager = new DayzProcessManager(serverId);
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
}

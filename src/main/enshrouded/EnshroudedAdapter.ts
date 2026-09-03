import { EnshroudedProcessManager } from './EnshroudedProcessManager';

export class EnshroudedAdapter {
  serverId: number;
  private processManager: EnshroudedProcessManager;

  constructor(serverId: number) {
    this.serverId = serverId;
    this.processManager = new EnshroudedProcessManager(serverId);
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

import { SatisfactoryProcessManager } from '../satisfactory/SatisfactoryProcessManager';

export class SatisfactoryAdapter {
  serverId: number;
  private processManager: SatisfactoryProcessManager;

  constructor(serverId: number) {
    this.serverId = serverId;
    this.processManager = new SatisfactoryProcessManager(serverId);
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

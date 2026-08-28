import { SevenDaysToDieProcessManager } from './SevenDaysToDieProcessManager';
import { IServerAdapter } from '../adapters/AdapterRegistry';

export class SevenDaysToDieAdapter implements IServerAdapter {
  serverId: number;
  private processManager: SevenDaysToDieProcessManager;

  constructor(serverId: number) {
    this.serverId = serverId;
    this.processManager = new SevenDaysToDieProcessManager(serverId);
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

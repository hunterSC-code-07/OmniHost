export interface IVpnAdapter {
  isInstalled(): boolean;
  install(): void;
  open(): Promise<boolean>;
  getIp(): Promise<string | null>;
}

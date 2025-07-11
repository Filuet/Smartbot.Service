import { ElectronBridgeAPI } from './../shared/sharedTypes';

declare global {
  interface Window {
    electron: ElectronBridgeAPI;
  }
}

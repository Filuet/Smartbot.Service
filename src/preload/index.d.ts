import { ElectronBridgeAPI } from 'src/shared/sharedTypes';

declare global {
  interface Window {
    electron: ElectronBridgeAPI;
  }
}

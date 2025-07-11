import type { ElectronAPI } from '@electron-toolkit/preload';

export interface ElectronBridgeAPI extends ElectronAPI {
  windowMoveResize: {
    moveWindow(x: number, y: number): void;
    getPosition(): Promise<[number, number]>;
    setWindowSize(width: number, height: number): void;
  };
  restartAppUtils: {
    restartApp(): Promise<void>;
  };
}

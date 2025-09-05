import type { ElectronAPI } from '@electron-toolkit/preload';

export interface ElectronBridgeAPI extends ElectronAPI {
  windowMoveResize: {
    moveWindow: (x: number, y: number) => void;
    getPosition: () => Promise<[number, number]>;
    setWindowSize: (width: number, height: number, positionX?: number, positionY?: number) => void;
  };
  restartAppUtils: {
    restartApp: () => Promise<void>;
    onProgressUpdate: (callback: (progress: number, message: string) => void) => void;
    onRestartDone: (callback: (isRestarted: boolean) => void) => void;
    removeRestartListeners: () => void;
    removeProgressListeners: () => void;
  };
}

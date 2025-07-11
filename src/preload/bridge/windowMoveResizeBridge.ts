import { IPC_CHANNELS } from '../../shared/ipcChannels';

export function createWindowMoveResizeBridge(ipcRenderer: Electron.IpcRenderer): {
  moveWindow: (x: number, y: number) => void;
  getPosition: () => Promise<[number, number]>;
  setWindowSize: (width: number, height: number) => void;
} {
  return {
    moveWindow: (x: number, y: number) => {
      ipcRenderer.send(IPC_CHANNELS.MOVE_WINDOW, x, y);
    },
    getPosition: async (): Promise<[number, number]> => {
      const pos = await ipcRenderer.invoke(IPC_CHANNELS.GET_POSITION);
      return [pos.x, pos.y];
    },
    setWindowSize: (width: number, height: number) => {
      ipcRenderer.send(IPC_CHANNELS.SET_WINDOW_SIZE, width, height);
    }
  };
}

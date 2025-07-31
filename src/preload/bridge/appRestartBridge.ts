import { IPC_CHANNELS } from '../../shared/ipcChannels';

export function createAppRestartBridge(ipc: Electron.IpcRenderer): {
  restartApp: () => Promise<void>;
  onProgressUpdate: (callback: (progress: number, message: string) => void) => void;
  onRestartDone: (callback: (isRestarted: boolean) => void) => void;
  removeRestartListeners: () => void;
  removeProgressListeners: () => void;
} {
  return {
    restartApp: (): Promise<void> => ipc.invoke(IPC_CHANNELS.RESTART_APP),
    onProgressUpdate: (callback) => {
      ipc.removeAllListeners(IPC_CHANNELS.RESTART_PROGRESS_UPDATE);
      ipc.on(IPC_CHANNELS.RESTART_PROGRESS_UPDATE, (_, { progress, message }) => {
        callback(progress, message);
      });
    },
    onRestartDone: (callback) => {
      ipc.removeAllListeners(IPC_CHANNELS.IS_RESTART_DONE);
      ipc.on(IPC_CHANNELS.IS_RESTART_DONE, (_, isRestarted) => {
        callback(isRestarted);
      });
    },
    removeRestartListeners: (): void => {
      ipc.removeAllListeners(IPC_CHANNELS.IS_RESTART_DONE);
    },
    removeProgressListeners: (): void => {
      ipc.removeAllListeners(IPC_CHANNELS.RESTART_PROGRESS_UPDATE);
    }
  };
}

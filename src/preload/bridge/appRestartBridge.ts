import { IPC_CHANNELS } from '../../shared/ipcChannels';

export function createAppRestartBridge(ipc: Electron.IpcRenderer): {
  restartApp: () => Promise<void>;
} {
  return {
    restartApp: (): Promise<void> => ipc.invoke(IPC_CHANNELS.RESTART_APP)
  };
}

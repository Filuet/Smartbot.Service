import { IPC_CHANNELS } from '../../shared/ipcChannels';

export function createAppRestartBridge(ipc: Electron.IpcRenderer): {
  restartApp: () => Promise<void>;
} {
  return {
    restartApp: () => ipc.invoke(IPC_CHANNELS.RESTART_APP)
  };
}

import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import { ElectronBridgeAPI } from '../shared/sharedTypes';
import { createWindowMoveResizeBridge } from './bridge/windowMoveResizeBridge';
import { createAppRestartBridge } from './bridge/appRestartBridge';

const api: ElectronBridgeAPI = {
  ...electronAPI,
  windowMoveResize: createWindowMoveResizeBridge(ipcRenderer),
  restartAppUtils: createAppRestartBridge(ipcRenderer)
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    // First expose electronAPI (from @electron-toolkit/preload)
    contextBridge.exposeInMainWorld('electron', api);
  } catch (error) {
    console.error('Failed to expose electron API:', error);
  }
}
// else {
//   // Fallback for non-isolated context
//   // @ts-ignore (define in dts)
//   window.electron = electronAPI;
// }

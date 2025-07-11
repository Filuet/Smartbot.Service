import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI as toolkitAPI } from '@electron-toolkit/preload';
import { ElectronBridgeAPI } from '../shared/sharedTypes';
import { createWindowMoveResizeBridge } from './bridge/windowMoveResizeBridge';
import { createAppRestartBridge } from './bridge/appRestartBridge';

const electronAPI: ElectronBridgeAPI = {
  ...toolkitAPI,
  windowMoveResize: createWindowMoveResizeBridge(ipcRenderer),
  restartAppUtils: createAppRestartBridge(ipcRenderer)
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    // First expose electronAPI (from @electron-toolkit/preload)
    contextBridge.exposeInMainWorld('electron', electronAPI);
  } catch (error) {
    console.error('Failed to expose electron API:', error);
  }
} else {
  // Fallback for non-isolated context
  // @ts-ignore (define in dts)
  window.electron = toolkitAPI;
}

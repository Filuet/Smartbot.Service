import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
// Custom APIs for renderer
const api = {
  moveWindow: (x: number, y: number) => ipcRenderer.send('move-window', x, y),
  getPosition: () => ipcRenderer.invoke('get-position'),
  getRunningApps: () => ipcRenderer.invoke('get-running-apps'),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  setWindowSize: (width: number, height: number) =>
    ipcRenderer.send('set-window-size', width, height)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    // First expose electronAPI (from @electron-toolkit/preload)
    contextBridge.exposeInMainWorld('electron', {
      ...electronAPI, // Spread in the toolkit APIs
      ...api // Add your custom APIs
    })
  } catch (error) {
    console.error('Failed to expose electron API:', error)
  }
}

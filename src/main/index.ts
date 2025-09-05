import { app, BrowserWindow } from 'electron';
// import { exec } from 'child_process'
import { electronApp, optimizer } from '@electron-toolkit/utils';
import { mainWindowObject } from './windows/mainWindowObject';
import registerAllIpcHandler from './ipcHandlers/registerAllIpcHandlers';

let mainWindow: BrowserWindow | null = null;
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.whenReady().then(async () => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron');

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });
    mainWindow = mainWindowObject();

    registerAllIpcHandler(mainWindow);

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = mainWindowObject();
      }
    });
  });
}
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

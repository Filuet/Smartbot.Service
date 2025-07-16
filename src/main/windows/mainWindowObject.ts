import { is } from '@electron-toolkit/utils';
import { BrowserWindow } from 'electron';
import { resolve } from 'path';

export const mainWindowObject = (): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    transparent: true, // Required for non-rectangular windows
    frame: false, // Remove window chrome
    resizable: false,
    // alwaysOnTop: true,
    skipTaskbar: true,
    movable: true,
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF', // Transparent background
    title: '',
    webPreferences: {
      preload: resolve(__dirname, '../../out/preload/index.js'),
      sandbox: false, // Enable sandbox mode
      contextIsolation: true, // Isolate context of renderer
      nodeIntegration: false // Enable Node.js in renderer
    },
    minimizable: false
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.setFullScreenable(false);
  mainWindow.setBackgroundColor('#00FFFFFF');
  mainWindow.setOpacity(1);
  mainWindow.on('blur', () => {
    mainWindow.setBackgroundColor('#00FFFFFF');
    mainWindow.setOpacity(1);
  });
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });
  // if (is.dev) {
  //   mainWindow.webContents.openDevTools();
  // }
  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(resolve(__dirname, '../renderer/index.html'));
  }
  return mainWindow;
};

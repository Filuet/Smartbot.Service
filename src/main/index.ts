import { app, BrowserWindow, ipcMain, screen } from 'electron';
// import { exec } from 'child_process'
import { ProcessConfig, processManager } from './processManager';
import { is, electronApp, optimizer } from '@electron-toolkit/utils';
import { join } from 'path';
import { exec } from 'child_process';

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    transparent: true, // Required for non-rectangular windows
    frame: false, // Remove window chrome
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    movable: true,
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF', // Transparent background
    title: '',
    webPreferences: {
      nodeIntegration: true,
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true
    }
  });
  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.setFullScreenable(false);
  ipcMain.on('move-window', (_, x, y) => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const boundedX = Math.max(0, Math.min(x, width - mainWindow.getSize()[0]));
    const boundedY = Math.max(0, Math.min(y, height - mainWindow.getSize()[1]));
    mainWindow.setPosition(boundedX, boundedY);
  });
  ipcMain.handle('get-position', () => mainWindow.getPosition());
  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });
  ipcMain.handle('get-running-apps', async () => {
    return new Promise((resolve) => {
      if (process.platform === 'win32') {
        exec('tasklist', (_error, stdout) => {
          const apps = stdout
            .split('\n')
            .map((line) => line.split(' ')[0])
            .filter((app) => app && app.endsWith('.exe'))
            .map((app) => app.replace('.exe', ''));
          resolve(apps);
        });
      } else if (process.platform === 'darwin') {
        exec('ps -A -o comm=', (_error, stdout) => {
          const apps = stdout
            .split('\n')
            .map((app) => app.trim())
            .filter((app) => app && !app.startsWith('('));
          resolve(apps);
        });
      } else {
        // Linux implementation
        exec('ps -e -o comm=', (_error, stdout) => {
          const apps = stdout.split('\n').map((app) => app.trim());
          resolve(apps);
        });
      }
    });
  });

  ipcMain.on('set-window-size', (_, width, height) => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      const { workArea } = screen.getPrimaryDisplay();
      const newX = workArea.x + workArea.width - width - 10;
      const newY = workArea.y + workArea.height - height - 10;
      const boundedX = Math.max(workArea.x, Math.min(newX, workArea.x + workArea.width - width));
      const boundedY = Math.max(workArea.y, Math.min(newY, workArea.y + workArea.height - height));

      win.setBounds({
        x: boundedX,
        y: boundedY,
        width: width,
        height: height
      });
    }
  });
  ipcMain.handle('restart-app', async () => {
    const processes: ProcessConfig[] = [
      {
        name: 'Filuet.PosAgent',
        command: 'C:\\Filuet\\Filuet.Pos.Agent\\Filuet.PosAgent.exe',
        killOnExit: true
      },
      {
        name: 'Filuet.ASC.Kiosk',
        command: 'C:\\Filuet\\Filuet.ASC.Kiosk\\Filuet.ASC.Kiosk.exe',
        killOnExit: true
      },
      {
        name: 'chrome',
        command: 'chrome',
        args: [
          '--incognito',
          '--kiosk',
          '--disable-pinch',
          '--overscroll-history-navigation=0',
          'http://localhost:5000'
        ],
        delay: 12000, // 12 seconds
        killOnExit: true
      }
    ];

    await Promise.all(processes.map((config) => processManager.launchProcess(config)));
  });
  mainWindow.setBackgroundColor('#00FFFFFF');
  mainWindow.setOpacity(1);
  mainWindow.on('blur', () => {
    mainWindow.setBackgroundColor('#00FFFFFF');
    mainWindow.setOpacity(1);
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}
// ipcMain.on('restart-app', (_, appName: string) => {
//   if (process.platform === 'win32') {
//     exec(`taskkill /IM ${appName}.exe /F && start ${appName}`, (err) => {
//       if (err) console.error('Failed to restart app:', err)
//     })
//   } else if (process.platform === 'darwin') {
//     exec(`pkill -f ${appName} && open -a "${appName}"`, (err) => {
//       if (err) console.error('Failed to restart app:', err)
//     })
//   }
// })

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron');

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

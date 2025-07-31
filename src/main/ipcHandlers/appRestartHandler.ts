import { BrowserWindow, ipcMain } from 'electron';
import { getKioskName, ProcessConfig, processManager } from '../utils/processManager';
import { IPC_CHANNELS } from '../../shared/ipcChannels';
import { AppLogger } from '../utils/appLogger';
import { emailService } from '../utils/emailService';
import axios from 'axios';

const appRestartHandler = (mainWindow: BrowserWindow): void => {
  const sendProgressUpdate = (progress: number, message: string): void => {
    if (!mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.RESTART_PROGRESS_UPDATE, {
        progress,
        message
      });
    }
  };
  const setRestart = (isRestarted: boolean): void => {
    if (!mainWindow.webContents.isDestroyed()) {
      mainWindow.webContents.send(IPC_CHANNELS.IS_RESTART_DONE, isRestarted);
    }
  };
  const IsWebsiteLoaded = async (): Promise<boolean> => {
    const res = await axios.get('http://localhost:9222/json');
    const tabs = res.data;

    if (tabs.length === 0) {
      console.log('No tabs open');
      return false;
    }
    const isOpen: boolean = tabs.some((tab) => tab.url && tab.url.includes('localhost:5000'));
    return isOpen;
  };
  ipcMain.handle(IPC_CHANNELS.RESTART_APP, async () => {
    setRestart(true);
    const processesToKill: string[] = ['Filuet.PosAgent', 'Filuet.ASC.Kiosk', 'chrome'];

    const processesToLaunch: ProcessConfig[] = [
      {
        name: 'Filuet.PosAgent',
        command: 'C:\\Filuet\\Filuet.Pos.Agent\\Filuet.PosAgent.exe',
        killOnExit: false
      },
      {
        name: 'Filuet.ASC.Kiosk',
        command: 'C:\\Filuet\\Filuet.ASC.Kiosk\\Filuet.ASC.Kiosk.exe',
        killOnExit: false
      },
      {
        name: 'chrome',
        command: 'chrome',
        args: [
          '--incognito',
          '--kiosk',
          '--disable-pinch',
          '--overscroll-history-navigation=0',
          '--remote-debugging-port=9222',
          'http://localhost:5000'
        ],
        delay: 12000, // 12 seconds
        killOnExit: false
      }
    ];
    const screenshotPath = await AppLogger.captureScreenshot();
    const logPath = await AppLogger.saveDiagnosticLogs();
    const kioskName = await getKioskName();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await emailService.sendEmail({
      to: 'minal.kose@filuet.com;shashank.sood@filuet.com;ankit.s@filuet.com',
      subject: `${kioskName}: Application Restarted`,
      text: 'The application was restarted. Please find attached logs and screenshot.',
      attachments: [
        {
          filename: `screenshot-${timestamp}.png`,
          path: screenshotPath
        },
        {
          filename: `pos-${timestamp}.log`,
          path: logPath ? logPath[0] : null
        },
        {
          filename: `ui-${timestamp}.log`,
          path: logPath ? logPath[1] : null
        }
      ]
    });
    console.log('Application restart initiated');
    sendProgressUpdate(10, 'Preparing to restart...');
    try {
      await Promise.all(
        processesToKill.map(async (processName) => {
          console.log(`Killing process: ${processName}`);
          await processManager.killProcess(processName);
        })
      );
      sendProgressUpdate(20, `processes killed`);
      await Promise.all(
        processesToLaunch.map(async (config, index) => {
          console.log(`Restarting process: ${config.name}`);
          await processManager.launchProcess(config);
          const progress = 10 + (index + 1) * (60 / processesToKill.length);
          sendProgressUpdate(progress, `${config.name} restarted`);
        })
      );
      const isWebsiteLoaded = await IsWebsiteLoaded();
      if (isWebsiteLoaded) {
        sendProgressUpdate(100, 'Application restarted successfully');
        console.log('Application restarted successfully');
      } else {
        sendProgressUpdate(-1, 'Website did not load after restart');
        console.error('Website did not load after restart');
      }
    } catch (error: Error | unknown) {
      sendProgressUpdate(-1, `Restart failed: ${(error as Error).message}`);
      console.error('Error during application restart:', error);
    } finally {
      setRestart(false);
    }
  });
};
export default appRestartHandler;

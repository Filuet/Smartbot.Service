import { BrowserWindow, ipcMain } from 'electron';
import { getKioskName, ProcessConfig, processManager } from '../utils/processManager';
import { IPC_CHANNELS } from '../../shared/ipcChannels';
import { AppLogger } from '../utils/appLogger';
import { emailService } from '../utils/emailService';
import axios from 'axios';
import { logger } from '../utils/logger';
import { RESTART_STATUS } from '../../shared/restartStatus';

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
    try {
      logger.log('Checking if website is loaded...');
      const res = await axios.get('http://localhost:9222/json');
      logger.log('Response from localhost:9222/json:', res.data);
      const tabs = res.data;

      if (tabs.length === 0) {
        logger.log('No tabs open');
        return false;
      }
      const isOpen: boolean = tabs.some((tab) => tab.url && tab.url.includes('localhost:5000'));
      return isOpen;
    } catch (error) {
      logger.error('-4 Error checking website load status:', error);
      return false;
    }
  };
  ipcMain.handle(IPC_CHANNELS.RESTART_APP, async () => {
    const screenshotPath = await AppLogger.captureScreenshot();
    setRestart(true);
    const processesToKill: string[] = ['Filuet.PosAgent', 'Filuet.ASC.Kiosk', 'chrome'];
    const processesToLaunch: ProcessConfig[] = [
      // {
      //   name: 'Filuet.PosAgent',
      //   command: 'C:\\Filuet\\Filuet.Pos.Agent\\Filuet.PosAgent.exe',
      //   killOnExit: false
      // },
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
          '--user-data-dir=C:\\temp\\chrome-remote-profile', // Add this line
          'http://localhost:5000'
        ],
        delay: 8000, // 12 seconds
        killOnExit: false
      }
    ];
    const logPath = await AppLogger.saveDiagnosticLogs();
    const kioskName = await getKioskName();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await emailService.sendEmail({
      to: 'minal.kose@filuet.com;shashank.sood@filuet.com;mugdha.deshmukh@filuet.com',
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
    logger.log('Application restart initiated');
    sendProgressUpdate(10, RESTART_STATUS.RestartStarted);
    try {
      await Promise.all(
        processesToKill.map(async (processName) => {
          logger.log(`Killing process: ${processName}`);
          await processManager.killProcess(processName);
        })
      );
      sendProgressUpdate(20, RESTART_STATUS.ProcessesKilled);
      let currentProgress = 20;
      const progressIncrement = 70 / processesToLaunch.length;
      for (const config of processesToLaunch) {
        try {
          logger.log(`Launching process: ${config.name}`);
          await processManager.launchProcess(config);
          currentProgress += progressIncrement;
          sendProgressUpdate(
            Math.round(currentProgress),
            `${config.name}` + RESTART_STATUS.ProcessLaunched
          );
        } catch (error) {
          logger.error(`Failed to launch process ${config.name}:`, error);
          sendProgressUpdate(-1, RESTART_STATUS.RestartFailed);
          return;
        }
      }

      sendProgressUpdate(95, RESTART_STATUS.WebsiteToLoad);
      let isWebsiteLoaded = false;
      await new Promise((resolve) => setTimeout(resolve, 5000));
      for (let attempt = 0; attempt < 6; attempt++) {
        isWebsiteLoaded = await IsWebsiteLoaded();
        if (isWebsiteLoaded) {
          break;
        }
        if (attempt < 5) {
          sendProgressUpdate(95, RESTART_STATUS.Retrying + ` ${attempt + 1}`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      if (isWebsiteLoaded) {
        sendProgressUpdate(100, RESTART_STATUS.RestartSuccessful);
        setRestart(false);
        logger.log('Application restarted successfully');
      } else {
        sendProgressUpdate(-1, RESTART_STATUS.WebsiteDidNotLoad);
        await emailService.sendEmail({
          to: 'minal.kose@filuet.com;shashank.sood@filuet.com;ankit.s@filuet.com',
          subject: `${kioskName}: Website Did Not Load After Restart`,
          text: 'The application did not restart successfully. Please check the kiosk.'
        });
        logger.error('Website did not load after restart, sending email alert');
      }
    } catch (error: Error | unknown) {
      sendProgressUpdate(-1, RESTART_STATUS.RestartFailed);
      await emailService.sendEmail({
        to: 'minal.kose@filuet.com;shashank.sood@filuet.com;ankit.s@filuet.com',
        subject: `${kioskName}: Application Did Not Restart`,
        text: `The application did not restart successfully. Please check the kiosk. Error details: ${error} `
      });
      logger.error(`Error during application restart:${error}`);
    }
  });
};
export default appRestartHandler;

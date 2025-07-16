import { ipcMain } from 'electron';
import { ProcessConfig, processManager } from '../utils/processManager';
import { IPC_CHANNELS } from '../../shared/ipcChannels';
import { AppLogger } from '../utils/appLogger';

const appRestartHandler = (): void => {
  ipcMain.handle(IPC_CHANNELS.RESTART_APP, async () => {
    const processes: ProcessConfig[] = [
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
          'http://localhost:5000'
        ],
        delay: 12000, // 12 seconds
        killOnExit: false
      }
    ];
    await AppLogger.captureScreenshot();
    await AppLogger.saveDiagnosticLogs();
    await Promise.all(processes.map((config) => processManager.launchProcess(config)));
  });
};
export default appRestartHandler;

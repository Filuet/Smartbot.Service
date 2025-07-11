import { BrowserWindow } from 'electron';
import windowMoveResizeIpc from './windowMoveResizeIpc';
import appRestartHandler from './appRestartHandler';

const registerAllIpcHandlers = (mainWindow: BrowserWindow): void => {
  windowMoveResizeIpc(mainWindow);
  appRestartHandler();
};
export default registerAllIpcHandlers;

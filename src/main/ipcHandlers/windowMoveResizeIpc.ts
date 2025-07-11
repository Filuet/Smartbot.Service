import { BrowserWindow, ipcMain, screen } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels';

const windowMoveResizeIpc = (mainWindow: BrowserWindow): void => {
  ipcMain.on(IPC_CHANNELS.MOVE_WINDOW, (_, x, y) => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const boundedX = Math.max(0, Math.min(x, width - mainWindow.getSize()[0]));
    const boundedY = Math.max(0, Math.min(y, height - mainWindow.getSize()[1]));
    mainWindow.setPosition(boundedX, boundedY);
  });
  ipcMain.handle(IPC_CHANNELS.GET_POSITION, () => mainWindow.getPosition());

  ipcMain.on(IPC_CHANNELS.SET_WINDOW_SIZE, (_, width, height) => {
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
};
export default windowMoveResizeIpc;

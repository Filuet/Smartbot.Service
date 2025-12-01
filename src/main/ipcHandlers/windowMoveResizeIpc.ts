import { BrowserWindow, ipcMain, screen } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels';

const windowMoveResizeIpc = (mainWindow: BrowserWindow): void => {
  ipcMain.on(IPC_CHANNELS.MOVE_WINDOW, (_, x: number, y: number) => {
    // Ensure window is not in fullscreen or kiosk mode for dragging
    if (mainWindow.isFullScreen()) {
      return;
    }

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const boundedX = Math.max(0, Math.min(x, width - mainWindow.getSize()[0]));
    const boundedY = Math.max(0, Math.min(y, height - mainWindow.getSize()[1]));
    mainWindow.setPosition(boundedX, boundedY);
  });

  ipcMain.handle(IPC_CHANNELS.GET_POSITION, () => {
    const [x, y] = mainWindow.getPosition();
    return { x, y };
  });

  ipcMain.on(
    IPC_CHANNELS.SET_WINDOW_SIZE,
    (_, width: number, height: number, positionX?: number, positionY?: number) => {
      const win = mainWindow;
      if (win) {
        const { workArea, bounds } = screen.getPrimaryDisplay();

        // Check if this is a fullscreen loader UI (768x1366 at 0,0)
        const isFullscreenLoader =
          width === 768 && height === 1366 && positionX === 0 && positionY === 0;

        if (isFullscreenLoader) {
          // For fullscreen loading UI, use setFullScreen instead of resizing
          // This prevents taskbar from being visible on any edge
          win.setFullScreen(true);
          win.setBounds({
            x: 0,
            y: 0,
            width: bounds.width,
            height: bounds.height
          });
          win.show();
          win.focus();
          win.setKiosk(true);
        } else {
          // For small icon window, exit fullscreen and kiosk mode
          if (win.isFullScreen()) {
            win.setFullScreen(false);
          }

          // Disable kiosk mode for icon to allow smooth dragging
          win.setKiosk(false);

          // Hide window temporarily to avoid visual glitches
          win.hide();

          let finalX: number;
          let finalY: number;

          // Check if custom position is provided (including 0,0)
          if (typeof positionX === 'number' && typeof positionY === 'number') {
            // Use custom position (center the window at the specified position)
            finalX = workArea.x + Math.floor((workArea.width - width) / 2);
            finalY = workArea.y + Math.floor((workArea.height - height) / 2);
          } else {
            // No custom position provided - position at bottom-right corner
            const newX = workArea.x + workArea.width - width - 10;
            const newY = workArea.y + workArea.height - height - 10;
            finalX = Math.max(workArea.x, Math.min(newX, workArea.x + workArea.width - width));
            finalY = Math.max(workArea.y, Math.min(newY, workArea.y + workArea.height - height));
          }

          // Set the bounds in one operation
          win.setBounds({
            x: finalX,
            y: finalY,
            width: width,
            height: height
          });
          win.setSkipTaskbar(true);
          // Show window and ensure proper state
          win.show();
          win.focus();
        }

        // Force a complete repaint and window update
        setTimeout(() => {
          win.webContents.executeJavaScript('window.dispatchEvent(new Event("resize"))');
        }, 100);
      }
    }
  );
};

export default windowMoveResizeIpc;

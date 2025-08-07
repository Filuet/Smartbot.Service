import { useRef, useState, useEffect } from 'react';
import { RestartAlt, Close } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import botLogo from './assets/herbalife.png';
import { appStyles } from './components/appStyles';
import { Button, Dialog, DialogActions, DialogContent, Typography, useTheme } from '@mui/material';
import { Box } from '@mui/system';
import LoaderUtil from './components/LoaderUtil/LoaderUtil';

function App(): React.JSX.Element {
  const theme = useTheme();
  const styles = appStyles();
  const iconRef = useRef<HTMLDivElement>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showMenuDialog, setShowMenuDialog] = useState<boolean>(false);
  const [restart, setRestart] = useState<boolean>(false);
  const toggleMenu = (e: React.MouseEvent | React.TouchEvent): void => {
    e.stopPropagation();
    setShowMenuDialog(!showMenuDialog);
  };
  useEffect(() => {
    const updateRestartState = (isRestarted: boolean): void => {
      console.log(`Restart state updated: ${isRestarted}`);
      setRestart(isRestarted);

      if (!isRestarted) {
        window.electron.windowMoveResize.setWindowSize(50, 50);
      }
      console.log(`Restart state: ${restart}`);
      console.log(`showMenuDialog: ${showMenuDialog}`);
    };
    window.electron.restartAppUtils.onRestartDone(updateRestartState);
    return () => {
      window.electron.restartAppUtils.removeRestartListeners();
    };
  }, []);

  const restartApp = async (): Promise<void> => {
    await window.electron.restartAppUtils.restartApp();
  };

  const handleMouseDown = (e: React.MouseEvent): void => {
    dragStartPosition.current = { x: e.screenX, y: e.screenY };
    isDraggingRef.current = false;
    startDrag(e.screenX, e.screenY);
    e.preventDefault();
  };

  const onTouchStart = (e: React.TouchEvent): void => {
    const touch = e.touches[0];
    dragStartPosition.current = { x: touch.screenX, y: touch.screenY };
    isDraggingRef.current = false;

    // Set a timer to distinguish between tap and drag
    touchTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true;
    }, 100);

    startDrag(touch.screenX, touch.screenY);
    e.preventDefault();
  };

  const onIconClick = (e: React.MouseEvent): void => {
    if (isDraggingRef.current) {
      e.preventDefault();
      return;
    }
    toggleMenu(e);
  };

  const onTouchEnd = (e: React.TouchEvent): void => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    if (!isDraggingRef.current) {
      toggleMenu(e);
    }
    isDraggingRef.current = false;
  };

  const startDrag = async (startX: number, startY: number): Promise<void> => {
    const startPos = await window.electron.windowMoveResize.getPosition();

    const moveHandler = (e: MouseEvent | TouchEvent): void => {
      let clientX: number, clientY: number;
      if (e instanceof MouseEvent) {
        clientX = e.screenX;
        clientY = e.screenY;
      } else {
        clientX = e.touches[0].screenX;
        clientY = e.touches[0].screenY;
      }

      const dx = Math.abs(clientX - dragStartPosition.current.x);
      const dy = Math.abs(clientY - dragStartPosition.current.y);
      if (dx > 5 || dy > 5) {
        isDraggingRef.current = true;
      }

      window.electron.windowMoveResize.moveWindow(
        startPos[0] + (clientX - startX),
        startPos[1] + (clientY - startY)
      );
    };

    const cleanup = (): void => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('mouseup', cleanup);
      document.removeEventListener('touchend', cleanup);

      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
      }
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('mouseup', cleanup, { once: true });
    document.addEventListener('touchend', cleanup, { once: true });
  };
  useEffect(() => {
    console.log(`Restart state: ${restart}`);
    console.log(`showMenuDialog: ${showMenuDialog}`);
    if (restart && !showMenuDialog) {
      console.log('Setting window size to 1920x1080 at position 300,300');
      window.electron.windowMoveResize.setWindowSize(768, 1366, 0, 0);
    }
    if (showMenuDialog && !restart) {
      console.log('Setting window size to 692x429 at position 300,300');
      window.electron.windowMoveResize.setWindowSize(692, 429, 300, 300);
    } else if (!showMenuDialog && !restart) {
      console.log('Setting window size to 50x50');
      window.electron.windowMoveResize.setWindowSize(50, 50);
    }
  }, [showMenuDialog, restart]);
  return (
    <>
      {restart && !showMenuDialog && <LoaderUtil />}
      {!showMenuDialog && !restart && (
        <div
          ref={iconRef}
          style={styles.imageDivContainer}
          onMouseDown={handleMouseDown}
          onTouchStart={onTouchStart}
          onClick={onIconClick}
          onTouchEnd={onTouchEnd}
        >
          <img src={botLogo} alt="Bot" style={styles.botImageStyles} />
        </div>
      )}
      <Dialog open={showMenuDialog} onClose={() => setShowMenuDialog(false)} fullScreen>
        <Box
          sx={{
            width: '98%',
            height: '50px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', margin: 'auto' }}>
            <InfoIcon
              style={{ color: theme.palette.primary.main, fontSize: '31px', marginRight: '0.2rem' }}
            />
            <Typography
              variant="body1"
              sx={{ color: theme.palette.primary.main, fontWeight: 300, fontSize: '23.6px' }}
            >
              Request assistance
            </Typography>
          </Box>

          <Close
            onClick={() => setShowMenuDialog(false)}
            style={{ color: theme.palette.text.primary, fontSize: '1rem', cursor: 'pointer' }}
          />
        </Box>
        <DialogContent dividers>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              gap: '3rem'
            }}
          >
            <RestartAlt
              style={{ fontSize: '63px', color: theme.palette.primary.main, marginBottom: '20px' }}
            />

            <Typography
              variant="body1"
              style={{
                color: theme.palette.text.primary,
                fontSize: '31.5px',
                fontWeight: '400',
                lineHeight: 1.5
              }}
            >
              Do you want to restart the application?
            </Typography>
            <Box sx={{ display: 'flex', gap: '15px' }}></Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setShowMenuDialog(false)}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              setShowMenuDialog(false);
              setRestart(true);
              restartApp();
            }}
          >
            Restart
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default App;

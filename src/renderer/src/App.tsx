import { useRef, useState, useEffect } from 'react';
import { RestartAlt, Close } from '@mui/icons-material';
import InfoIcon from '@mui/icons-material/Info';
import restartLogo from './assets/restart.png';
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

  const pointerIdRef = useRef<number | null>(null);
  const startWindowPosRef = useRef<[number, number] | null>(null);
  const startPointerRef = useRef({ x: 0, y: 0 });
  const currentWindowPosRef = useRef<[number, number] | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const [showMenuDialog, setShowMenuDialog] = useState<boolean>(false);
  const [restart, setRestart] = useState<boolean>(false);

  const toggleMenu = (e?: Event | React.SyntheticEvent): void => {
    try {
      e?.stopPropagation?.();
    } catch (err) {
      void err;
    }
    setShowMenuDialog((s) => !s);
  };

  useEffect(() => {
    const updateRestartState = (isRestarted: boolean): void => {
      setRestart(isRestarted);
      if (isRestarted) {
        window.electron.windowMoveResize.setWindowSize(768, 1366, 0, 0);
      }
      console.log(`Restart state: ${isRestarted}`);
    };
    window.electron.restartAppUtils.onRestartDone(updateRestartState);
    return () => {
      window.electron.restartAppUtils.removeRestartListeners();
    };
  }, []);

  const restartApp = async (): Promise<void> => {
    await window.electron.restartAppUtils.restartApp();
  };

  // Pointer handlers (works for mouse, touch, pen)
  const onPointerDown = async (e: React.PointerEvent): Promise<void> => {
    console.log('onPointerDown', {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      clientX: e.clientX,
      clientY: e.clientY
    });

    if (showMenuDialog || restart) {
      e.preventDefault();
      return;
    }

    // Capture pointer on the target element
    const target = e.currentTarget as Element;
    target.setPointerCapture(e.pointerId);

    pointerIdRef.current = e.pointerId;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    dragStartPosition.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;

    // Get current window position
    const windowPos = await window.electron.windowMoveResize.getPosition();
    startWindowPosRef.current = windowPos;
    currentWindowPosRef.current = windowPos;

    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent): void => {
    if (pointerIdRef.current === null || e.pointerId !== pointerIdRef.current) {
      return;
    }
    if (showMenuDialog || restart) {
      return;
    }

    const dx = Math.abs(e.clientX - dragStartPosition.current.x);
    const dy = Math.abs(e.clientY - dragStartPosition.current.y);

    // Lower threshold for touch to make it more responsive
    if (dx > 3 || dy > 3) {
      if (!isDraggingRef.current) {
        console.log('✓ Drag threshold exceeded - starting drag');
      }
      isDraggingRef.current = true;
    }

    if (!isDraggingRef.current) return;

    // Throttle moves to prevent flooding
    const now = Date.now();
    if (now - lastMoveTimeRef.current < 16) {
      // Skip this move, too soon (less than ~60fps)
      return;
    }
    lastMoveTimeRef.current = now;

    const deltaX = e.clientX - startPointerRef.current.x;
    const deltaY = e.clientY - startPointerRef.current.y;

    if (!startWindowPosRef.current || !currentWindowPosRef.current) return;

    const targetX = startWindowPosRef.current[0] + deltaX;
    const targetY = startWindowPosRef.current[1] + deltaY;

    console.log('Moving', {
      clientX: e.clientX,
      clientY: e.clientY,
      deltaX,
      deltaY,
      targetX,
      targetY
    });

    currentWindowPosRef.current = [targetX, targetY];
    window.electron.windowMoveResize.moveWindow(targetX, targetY);

    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerUp = (e: React.PointerEvent): void => {
    if (pointerIdRef.current === null || e.pointerId !== pointerIdRef.current) {
      return;
    }

    const target = e.currentTarget as Element;
    try {
      target.releasePointerCapture(e.pointerId);
      console.log('✓ Released pointer capture');
    } catch (err) {
      console.error('Failed to release pointer capture:', err);
    }

    console.log('onPointerUp', {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      isDragging: isDraggingRef.current
    });

    const wasDragging = isDraggingRef.current;

    // Clean up first
    pointerIdRef.current = null;
    isDraggingRef.current = false;
    startWindowPosRef.current = null;
    currentWindowPosRef.current = null;

    // Then handle click if not dragging
    if (!wasDragging) {
      console.log('Click detected - opening menu');
      toggleMenu(e as unknown as Event);
    } else {
      console.log('Drag completed');
    }

    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    console.log(`Restart state: ${restart}`);
    console.log(`showMenuDialog: ${showMenuDialog}`);
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
          style={{
            ...styles.imageDivContainer,
            touchAction: 'none', // Critical for smooth touch handling
            userSelect: 'none',
            WebkitUserSelect: 'none',
            cursor: 'grab'
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="button"
          tabIndex={0}
        >
          <img
            src={restartLogo}
            alt="Bot"
            style={{
              ...styles.botImageStyles,
              pointerEvents: 'none', // Prevent image from interfering with pointer events
              userSelect: 'none'
            }}
          />
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

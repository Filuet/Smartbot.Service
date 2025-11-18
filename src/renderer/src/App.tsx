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
  const rafRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
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
      screenX: e.screenX,
      screenY: e.screenY
    });

    if (showMenuDialog || restart) {
      e.preventDefault();
      return;
    }

    // Capture pointer on the target element
    const target = e.currentTarget as Element;
    target.setPointerCapture(e.pointerId);

    pointerIdRef.current = e.pointerId;
    startPointerRef.current = { x: e.screenX, y: e.screenY };
    dragStartPosition.current = { x: e.screenX, y: e.screenY };
    isDraggingRef.current = false;

    // Get current window position only once
    startWindowPosRef.current = await window.electron.windowMoveResize.getPosition();

    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent): void => {
    if (pointerIdRef.current === null || e.pointerId !== pointerIdRef.current) {
      console.log('onPointerMove: Ignoring - pointer mismatch', {
        currentId: pointerIdRef.current,
        eventId: e.pointerId
      });
      return;
    }
    if (showMenuDialog || restart) {
      console.log('onPointerMove: Ignoring - dialog/restart active', { showMenuDialog, restart });
      return;
    }

    const dx = Math.abs(e.screenX - dragStartPosition.current.x);
    const dy = Math.abs(e.screenY - dragStartPosition.current.y);

    console.log('onPointerMove', {
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      screenX: e.screenX,
      screenY: e.screenY,
      dx,
      dy,
      isDragging: isDraggingRef.current
    });

    // Lower threshold for touch to make it more responsive
    if (dx > 3 || dy > 3) {
      if (!isDraggingRef.current) {
        console.log('✓ Drag threshold exceeded - starting drag');
      }
      isDraggingRef.current = true;
    }

    if (!isDraggingRef.current) return;

    pendingPointerRef.current = { x: e.screenX, y: e.screenY };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(processPendingMove);
      console.log('Scheduling processPendingMove via rAF');
    }

    e.preventDefault();
    e.stopPropagation();
  };

  const onPointerUp = (e: React.PointerEvent): void => {
    if (pointerIdRef.current === null || e.pointerId !== pointerIdRef.current) {
      console.log('onPointerUp: Ignoring - pointer mismatch', {
        currentId: pointerIdRef.current,
        eventId: e.pointerId
      });
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
      isDragging: isDraggingRef.current,
      screenX: e.screenX,
      screenY: e.screenY
    });

    if (!isDraggingRef.current) {
      console.log('Click detected - opening menu');
      toggleMenu(e as unknown as Event);
    } else {
      console.log('Drag completed');
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      console.log('Cancelled pending rAF');
      rafRef.current = null;
    }

    console.log('Cleaning up refs');
    pendingPointerRef.current = null;
    pointerIdRef.current = null;
    isDraggingRef.current = false;
    startWindowPosRef.current = null;

    e.preventDefault();
    e.stopPropagation();
  };

  // Called on rAF to batch IPC calls
  const processPendingMove = (): void => {
    rafRef.current = null;
    const pending = pendingPointerRef.current;
    const startWindowPos = startWindowPosRef.current;

    if (!pending || !startWindowPos) {
      console.warn('processPendingMove: Missing data', {
        hasPending: !!pending,
        hasStartPos: !!startWindowPos
      });
      return;
    }

    const deltaX = pending.x - startPointerRef.current.x;
    const deltaY = pending.y - startPointerRef.current.y;
    const targetX = startWindowPos[0] + deltaX;
    const targetY = startWindowPos[1] + deltaY;

    console.log('processPendingMove: Moving window', {
      startPos: startWindowPos,
      delta: { x: deltaX, y: deltaY },
      target: { x: targetX, y: targetY }
    });

    window.electron.windowMoveResize.moveWindow(targetX, targetY);
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

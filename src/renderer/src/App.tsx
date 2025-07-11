import { useRef, useState, useEffect } from 'react';
import botLogo from './assets/bot.png';
import { appStyles } from './components/appStyles';

function App(): React.JSX.Element {
  const [showMenu, setShowMenu] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const styles = appStyles();
  useEffect(() => {
    if (showMenu) {
      window.electron.windowMoveResize.setWindowSize(240, 155);
    } else {
      window.electron.windowMoveResize.setWindowSize(40, 40);
    }
  }, [showMenu]);

  const toggleMenu = (e: React.MouseEvent | React.TouchEvent): void => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const restartApp = async (): Promise<void> => {
    await window.electron.restartAppUtils.restartApp();
    setShowMenu(false);
  };

  const handleMouseDown = (e: React.MouseEvent): void => {
    dragStartPosition.current = { x: e.screenX, y: e.screenY };
    isDraggingRef.current = false;
    startDrag(e.screenX, e.screenY);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent): void => {
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

  const handleClick = (e: React.MouseEvent): void => {
    if (isDraggingRef.current) {
      e.preventDefault();
      return;
    }
    toggleMenu(e);
  };

  const handleTouchEnd = (e: React.TouchEvent): void => {
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
      let clientX, clientY;
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

  return (
    <div style={styles.mainDivContainer}>
      {showMenu && (
        <div style={styles.menuContainer} onClick={(e) => e.stopPropagation()}>
          <h3 style={styles.textStyles}>Do you want to restart the application?</h3>
          <div style={styles.buttonContainer}>
            <button
              style={styles.restartButtonStyles}
              onClick={() => {
                restartApp();
                setShowMenu(false);
              }}
            >
              Restart
            </button>

            <button style={styles.cancelButtonStyles} onClick={() => setShowMenu(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <div
        ref={iconRef}
        style={styles.imageDivContainer}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
      >
        <img src={botLogo} alt="Bot" style={styles.botImageStyles} />
      </div>
    </div>
  );
}

export default App;

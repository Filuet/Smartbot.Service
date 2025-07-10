import { useRef, useState, useEffect } from 'react'
import botLogo from './assets/bot.png'

function App(): React.JSX.Element {
  const [showMenu, setShowMenu] = useState(false)
  // const [setRunningApps] = useState<string[]>([])
  const iconRef = useRef<HTMLDivElement>(null)
  const dragStartPosition = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // window.electron.getRunningApps().then((apps) => {
    //   setRunningApps(apps)
    // })

    if (showMenu) {
      window.electron.setWindowSize(240, 155)
    } else {
      window.electron.setWindowSize(40, 40)
    }
  }, [showMenu])

  const toggleMenu = (e: React.MouseEvent | React.TouchEvent): void => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const restartApp = async (): Promise<void> => {
    await window.electron.restartApp()
    setShowMenu(false)
  }

  const handleMouseDown = (e: React.MouseEvent): void => {
    dragStartPosition.current = { x: e.screenX, y: e.screenY }
    isDraggingRef.current = false
    startDrag(e.screenX, e.screenY)
    e.preventDefault()
  }

  const handleTouchStart = (e: React.TouchEvent): void => {
    const touch = e.touches[0]
    dragStartPosition.current = { x: touch.screenX, y: touch.screenY }
    isDraggingRef.current = false

    // Set a timer to distinguish between tap and drag
    touchTimerRef.current = setTimeout(() => {
      isDraggingRef.current = true
    }, 100)

    startDrag(touch.screenX, touch.screenY)
    e.preventDefault()
  }

  const handleClick = (e: React.MouseEvent): void => {
    if (isDraggingRef.current) {
      e.preventDefault()
      return
    }
    toggleMenu(e)
  }

  const handleTouchEnd = (e: React.TouchEvent): void => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current)
      touchTimerRef.current = null
    }

    if (!isDraggingRef.current) {
      toggleMenu(e)
    }
    isDraggingRef.current = false
  }

  const startDrag = async (startX: number, startY: number): Promise<void> => {
    const startPos = await window.electron.getPosition()

    const moveHandler = (e: MouseEvent | TouchEvent): void => {
      let clientX, clientY
      if (e instanceof MouseEvent) {
        clientX = e.screenX
        clientY = e.screenY
      } else {
        clientX = e.touches[0].screenX
        clientY = e.touches[0].screenY
      }

      const dx = Math.abs(clientX - dragStartPosition.current.x)
      const dy = Math.abs(clientY - dragStartPosition.current.y)
      if (dx > 5 || dy > 5) {
        isDraggingRef.current = true
      }

      window.electron.moveWindow(startPos[0] + (clientX - startX), startPos[1] + (clientY - startY))
    }

    const cleanup = (): void => {
      document.removeEventListener('mousemove', moveHandler)
      document.removeEventListener('touchmove', moveHandler)
      document.removeEventListener('mouseup', cleanup)
      document.removeEventListener('touchend', cleanup)

      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current)
        touchTimerRef.current = null
      }
    }

    document.addEventListener('mousemove', moveHandler)
    document.addEventListener('touchmove', moveHandler, { passive: false })
    document.addEventListener('mouseup', cleanup, { once: true })
    document.addEventListener('touchend', cleanup, { once: true })
  }

  return (
    <div
      style={{
        bottom: 0,
        right: 0,
        position: 'fixed',
        zIndex: 9999
      }}
    >
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderTopLeftRadius: '5px',
            borderTopRightRadius: '5px',
            borderBottomRightRadius: '20px',
            borderBottomLeftRadius: '5px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: '16px',
            bottom: 0,
            right: 0,
            minWidth: '200px',
            touchAction: 'none',
            backdropFilter: 'blur(10px)',
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3
            style={{
              margin: '0 0 0 5px',
              fontSize: '16px',
              color: 'black',
              textAlign: 'center',
              paddingBottom: '20px'
            }}
          >
            Do you want to restart the application?
          </h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center',
              marginBottom: '30px'
            }}
          >
            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#0078d4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onClick={() => {
                restartApp()
                setShowMenu(false)
              }}
            >
              Restart
            </button>

            <button
              style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background-color 0.2s'
              }}
              onClick={() => setShowMenu(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div
        ref={iconRef}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: 'white',
          cursor: 'grab',
          userSelect: 'none',
          transition: 'transform 0.2s',
          zIndex: 1001,
          position: 'relative'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={botLogo}
          alt="Bot"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  )
}

export default App

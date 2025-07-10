import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: typeof ElectronAPI & {
      moveWindow(x: number, y: number): void
      getPosition(): Promise<[number, number]>
      getRunningApps(): Promise<string[]>
      restartApp(): Promise<void>
      setWindowSize(width: number, height: number): void
    }
  }
}

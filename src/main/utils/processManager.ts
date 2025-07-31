// utils/processManager.ts
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface ProcessConfig {
  name: string; // Process name to kill (e.g., "chrome")
  command: string; // Command to run (e.g., "chrome.exe")
  args?: string[]; // Arguments array
  delay?: number; // Delay in ms before starting
  killOnExit?: boolean; // Whether to kill when app exits
}
export const getKioskName = async (): Promise<string | null> => {
  const files = await fs.readdir('C:\\Filuet\\Filuet.ASC.Kiosk');
  const keyFile = files.find((file) => file.endsWith('.key'));

  if (!keyFile) {
    console.warn('No .key file found in directory');
    return null;
  }

  return path.basename(keyFile, '.key');
};
class ProcessManager {
  private childProcesses: ChildProcess[] = [];

  async killProcess(processName: string): Promise<void> {
    const { stdout } = await execAsync(
      process.platform === 'win32'
        ? `tasklist /FI "IMAGENAME eq ${processName}.exe"`
        : `pgrep -f ${processName}`
    );
    const isProcessRunning = stdout.includes(processName);
    if (isProcessRunning) {
      if (process.platform === 'win32') {
        await execAsync(`taskkill /IM ${processName}.exe /F`);
      } else if (process.platform === 'darwin') {
        await execAsync(`pkill -f ${processName}`);
      } else {
        // Linux
        await execAsync(`pkill ${processName}`);
      }
    }
  }

  async launchProcess(config: ProcessConfig): Promise<ChildProcess> {
    return new Promise((resolve) => {
      const start = (): void => {
        const child = spawn(config.command, config.args || [], {
          detached: true,
          stdio: 'ignore',
          shell: true
        });

        if (config.killOnExit) {
          this.childProcesses.push(child);
        }

        resolve(child);
      };

      if (config.delay) {
        setTimeout(start, config.delay);
      } else {
        start();
      }
    });
  }

  cleanup(): void {
    this.childProcesses.forEach((child) => {
      try {
        if (process.platform === 'win32') {
          // Windows needs special handling for killing child processes
          exec(`taskkill /PID ${child.pid} /T /F`);
        } else {
          if (child.pid !== undefined) {
            process.kill(-child.pid); // Negative PID kills the process group
          }
        }
      } catch (err) {
        console.error('Error killing process:', err);
      }
    });
  }
}

export const processManager = new ProcessManager();

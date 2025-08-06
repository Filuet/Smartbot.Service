// utils/processManager.ts
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

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

// Helper function to find Chrome executable
const getChromeExecutablePath = (): string => {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Users\\' +
      process.env.USERNAME +
      '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ];

  for (const chromePath of possiblePaths) {
    if (existsSync(chromePath)) {
      return chromePath;
    }
  }

  // Fallback to chrome command (might work if it's in PATH)
  return 'chrome';
};

class ProcessManager {
  private childProcesses: ChildProcess[] = [];

  async killProcess(processName: string): Promise<void> {
    try {
      if (process.platform === 'win32') {
        // Use tasklist without filters to avoid the "Invalid class" error
        const { stdout } = await execAsync('tasklist');
        const isProcessRunning = stdout.includes(`${processName}.exe`);

        if (isProcessRunning) {
          await execAsync(`taskkill /IM "${processName}.exe" /F`);
          console.log(`Successfully killed process: ${processName}.exe`);
        } else {
          console.log(`Process ${processName}.exe is not running`);
        }
      } else {
        // Unix-like systems
        const { stdout } = await execAsync(`pgrep -f ${processName}`);
        if (stdout.trim().length > 0) {
          if (process.platform === 'darwin') {
            await execAsync(`pkill -f ${processName}`);
          } else {
            await execAsync(`pkill ${processName}`);
          }
          console.log(`Successfully killed process: ${processName}`);
        } else {
          console.log(`Process ${processName} is not running`);
        }
      }
    } catch (error) {
      console.error(`Error managing process ${processName}:`, error);
      // Try direct kill without checking if process exists
      try {
        if (process.platform === 'win32') {
          await execAsync(`taskkill /IM "${processName}.exe" /F`);
          console.log(`Force killed process: ${processName}.exe (alternative method)`);
        }
      } catch (error: unknown) {
        console.log(
          `Process ${processName}.exe was not running or could not be killed`,
          error instanceof Error ? error.message : error
        );
      }
    }
  }

  async launchProcess(config: ProcessConfig): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      const start = (): void => {
        // Fix Chrome command path
        let command = config.command;
        if (config.command === 'chrome') {
          command = getChromeExecutablePath();
          console.log(`Using Chrome path: ${command}`);
        }

        console.log(`Starting process: ${command} with args:`, config.args);

        // For paths with spaces, we need to quote them properly or not use shell
        const child = spawn(command, config.args || [], {
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: false, // Don't use shell to avoid path parsing issues
          windowsHide: false
        });

        let hasResolved = false;

        child.stdout?.on('data', (data) => {
          console.log(`${command} stdout:`, data.toString());
        });

        child.stderr?.on('data', (data) => {
          console.error(`${command} stderr:`, data.toString());
        });

        child.on('error', (error) => {
          console.error(`Failed to start ${command}:`, error);
          if (!hasResolved) {
            hasResolved = true;
            reject(error);
          }
        });

        child.on('spawn', () => {
          console.log(`Successfully spawned: ${command} with PID: ${child.pid}`);
          if (!hasResolved) {
            hasResolved = true;
            resolve(child);
          }
        });

        child.on('exit', (code, signal) => {
          console.log(`Process ${command} exited with code: ${code}, signal: ${signal}`);
        });

        child.on('close', (code, signal) => {
          console.log(`Process ${command} closed with code: ${code}, signal: ${signal}`);
        });

        if (config.killOnExit) {
          this.childProcesses.push(child);
        }

        // Resolve after a short delay if spawn event doesn't fire
        setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            console.log(`Resolving ${command} after timeout`);
            resolve(child);
          }
        }, 2000);
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

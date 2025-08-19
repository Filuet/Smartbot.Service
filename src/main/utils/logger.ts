import { is } from '@electron-toolkit/utils';
import * as fs from 'fs';
import * as path from 'path';

export class Logger {
  private logFile: string;
  private logStream: fs.WriteStream;

  constructor() {
    const logsDir = 'C:\\Smartbot.Service-Logs';
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(logsDir, `log-${timestamp}.log`);
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
  }

  log(message: string, ...args: undefined[]): void {
    // Write to console
    console.log(message, ...args);

    // Write to file
    if (is.dev) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${message} ${args.length > 0 ? JSON.stringify(args) : ''}\n`;
      this.logStream.write(logMessage);
    }
  }

  error(message: string, ...args: unknown[]): void {
    console.error(message, ...args);
    if (is.dev) {
      const timestamp = new Date().toISOString();
      const errorMessage = `[${timestamp}] ERROR: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}\n`;

      this.logStream.write(errorMessage);
    }
  }

  close(): void {
    this.logStream.end();
  }
}

export const logger = new Logger();

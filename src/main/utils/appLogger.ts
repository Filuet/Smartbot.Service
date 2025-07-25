import { desktopCapturer, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

const BASE_FILUET_PATH = 'C:\\Filuet\\logs';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
export class AppLogger {
  private static ensureLogsDirectory(): string {
    const logsPath = path.join(BASE_FILUET_PATH, 'Smartbot-logs');
    if (!fs.existsSync(logsPath)) {
      fs.mkdirSync(logsPath, { recursive: true });
    }
    return logsPath;
  }

  static async captureScreenshot(): Promise<string | null> {
    try {
      const logsPath = this.ensureLogsDirectory();

      const screenshotPath = path.join(logsPath, `screenshot-${timestamp}.png`);

      const displays = screen.getAllDisplays();
      for (const display of displays) {
        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: display.size
        });

        if (sources.length > 0) {
          fs.writeFileSync(screenshotPath, sources[0].thumbnail.toPNG());
          return screenshotPath;
        }
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error);
    }
    return null;
  }

  private static getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  }

  private static findLatestLogFile(baseDir: string, prefix: string): string | null {
    const dateStr = this.getDateString();
    const logDir = path.join(baseDir, prefix);

    try {
      if (!fs.existsSync(logDir)) {
        console.error(`Directory not found: ${logDir}`);
        return null;
      }

      const files = fs.readdirSync(logDir);
      if (files.length === 0) {
        console.error(`No files in directory: ${logDir}`);
        return null;
      }

      // Match: prefix_date.txt or prefix_date_001.txt
      const pattern = new RegExp(`^${prefix}-${dateStr}(?:_(\\d{3}))?\\.txt$`);
      const filteredFiles = files.filter((file) => pattern.test(file));

      if (filteredFiles.length === 0) {
        console.error(`No files matched pattern in: ${logDir}`);
        return null;
      }

      const sortedFiles = filteredFiles.sort((a, b) => {
        const getSeq = (filename: string): number => {
          const parts = filename.split('_');
          if (parts.length < 3) return 0; // No sequence number
          const seqPart = parts[2].replace('.txt', '');
          return parseInt(seqPart, 10) || 0; // Fallback to 0 if NaN
        };
        return getSeq(b) - getSeq(a); // Newest first
      });

      return path.join(logDir, sortedFiles[0]);
    } catch (error) {
      console.error(`Error finding ${prefix} logs:`, error);
      return null;
    }
  }

  private static async getRecentPosLogs(
    logPath: string | null,
    minutes: number
  ): Promise<string[]> {
    if (!logPath) return ['[POS] No log file found for today'];

    const recentLogs: string[] = [];
    const now = new Date();
    const threshold = now.getTime() - minutes * 60 * 1000;
    let lastValidTimestamp: Date | null = null;

    try {
      const fileStream = fs.createReadStream(logPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        const timestampMatch = line.match(/^\[(\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timestampMatch) {
          // Parse the timestamp and update lastValidTimestamp
          const timeStr = timestampMatch[1];
          const [hours, minutes, secondsWithMs] = timeStr.split(':');
          const [seconds, milliseconds] = secondsWithMs.split('.');

          // Create a new date with today's date but the log's time
          const logDate = new Date();
          logDate.setHours(parseInt(hours, 10));
          logDate.setMinutes(parseInt(minutes, 10));
          logDate.setSeconds(parseInt(seconds, 10));
          logDate.setMilliseconds(parseInt(milliseconds, 10));

          lastValidTimestamp = logDate;
        }

        // If we have a valid timestamp and it's within our threshold, include the line
        if (lastValidTimestamp && lastValidTimestamp.getTime() >= threshold) {
          recentLogs.push(line);
        }
      }
      console.log(`Found ${recentLogs.length} recent pos logs`);
      return recentLogs;
    } catch (error) {
      console.error('Error reading POS logs:', error);
      return ['[POS] Error reading log file'];
    }
  }

  private static async getRecentUiLogs(logPath: string | null, minutes: number): Promise<string[]> {
    if (!logPath) return ['[UI] No log file found for today'];

    const recentLogs: string[] = [];
    const now = new Date();
    const threshold = now.getTime() - minutes * 60 * 1000;
    let lastValidTimestamp: Date | null = null;

    try {
      const fileStream = fs.createReadStream(logPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timestampMatch) {
          // Parse the timestamp and update lastValidTimestamp
          const logDate = new Date(timestampMatch[1].replace(' ', 'T'));
          lastValidTimestamp = logDate;
        }

        // If we have a valid timestamp and it's within our threshold, include the line
        if (lastValidTimestamp && lastValidTimestamp.getTime() >= threshold) {
          recentLogs.push(line);
        }
      }
      console.log(`Found ${recentLogs.length} recent UI logs`);
      return recentLogs;
    } catch (error) {
      console.error('Error reading UI logs:', error);
      return ['[UI] Error reading log file'];
    }
  }

  static async saveDiagnosticLogs(): Promise<string | null> {
    try {
      const logsPath = this.ensureLogsDirectory();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const logFilePath = path.join(logsPath, `diagnostic-${timestamp}.log`);

      // Find latest log files
      const posLogPath = this.findLatestLogFile(BASE_FILUET_PATH, 'pos');
      const uiLogPath = this.findLatestLogFile(BASE_FILUET_PATH, 'ui');

      // Get recent logs
      const [posLogs, uiLogs] = await Promise.all([
        this.getRecentPosLogs(posLogPath, 5),
        this.getRecentUiLogs(uiLogPath, 5)
      ]);

      // Create combined log content
      const combinedLogs = [
        `=== Diagnostic Log ${new Date().toISOString()} ===`,
        `Source POS Log: ${posLogPath || 'Not found'}`,
        `Source UI Log: ${uiLogPath || 'Not found'}`,
        `=== Last 5 Minutes of POS Logs ===`,
        ...posLogs,
        ``,
        `=== Last 5 Minutes of UI Logs ===`,
        ...uiLogs
      ];

      fs.writeFileSync(logFilePath, combinedLogs.join('\n'));
      return logFilePath;
    } catch (error) {
      console.error('Failed to create diagnostic log:', error);
      return null;
    }
  }
}
export const appLogger = new AppLogger();

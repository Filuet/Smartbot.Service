import { desktopCapturer, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import readline from 'readline';

const BASE_FILUET_PATH = 'C:\\Filuet';
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
    const pattern = new RegExp(`^${prefix}_${dateStr}(?:_(\\d+))?\\.log$`);

    try {
      const files = fs
        .readdirSync(baseDir)
        .filter((file) => pattern.test(file))
        .sort((a, b) => {
          // Extract sequence numbers (default to 0 if no number)
          const aNum = parseInt(a.match(/_(\d+)\.log$/)?.[1] || '0', 10);
          const bNum = parseInt(b.match(/_(\d+)\.log$/)?.[1] || '0', 10);
          return bNum - aNum; // Sort descending
        });

      return files.length > 0 ? path.join(baseDir, files[0]) : null;
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
    const nowUtc = new Date();
    const threshold = nowUtc.getTime() - minutes * 60 * 1000;

    try {
      const fileStream = fs.createReadStream(logPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        const timestampMatch = line.match(/^\[(\d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timestampMatch) {
          const [timeStr] = timestampMatch;
          const [hours, minutes, seconds] = timeStr.split(':');
          const logDate = new Date();
          logDate.setHours(parseInt(hours), parseInt(minutes), parseFloat(seconds));

          if (logDate.getTime() >= threshold) {
            recentLogs.push(line);
          }
        }
      }

      return recentLogs;
    } catch (error) {
      console.error('Error reading POS logs:', error);
      return ['[POS] Error reading log file'];
    }
  }

  private static async getRecentUiLogs(logPath: string | null, minutes: number): Promise<string[]> {
    if (!logPath) return ['[UI] No log file found for today'];

    const recentLogs: string[] = [];
    const nowUtc = new Date();
    const threshold = nowUtc.getTime() - minutes * 60 * 1000;

    try {
      const fileStream = fs.createReadStream(logPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      for await (const line of rl) {
        const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3})/);
        if (timestampMatch) {
          const logDate = new Date(timestampMatch[1].replace(' ', 'T') + 'Z');
          if (logDate.getTime() >= threshold) {
            recentLogs.push(line);
          }
        }
      }

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

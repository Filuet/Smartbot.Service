import nodemailer from 'nodemailer';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  attachments?: Array<{
    filename: string;
    path: string | null;
  }>;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: 'asc@filuet.com',
        pass: 'YImP#wbg?MCF'
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Kiosk Alerts" <asc@filuet.com>`,
        ...options
      });
      logger.log(`Email sent to ${options.to} with subject "${options.subject}"`);
    } catch (error) {
      logger.error('Failed to send email:', error);
    }
  }
}

export const emailService = new EmailService();

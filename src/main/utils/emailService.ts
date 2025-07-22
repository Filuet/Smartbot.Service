import nodemailer from 'nodemailer';

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
        pass: '26Y8JgOGVS'
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Kiosk Alerts" <asc@filuet.com>`,
        ...options
      });
      console.log(`Email sent to ${options.to} with subject "${options.subject}"`);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}

export const emailService = new EmailService();

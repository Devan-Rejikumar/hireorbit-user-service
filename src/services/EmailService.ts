import { injectable } from "inversify";
import nodemailer from "nodemailer";

@injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || "your@email.com",
      pass: process.env.SMTP_PASS || "yourpassword",
    },
  });

  async sendOTP(email: string, otp: number): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Job Portal" <no-reply@jobportal.com>',
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}`,
      html: `<p>Your OTP code is: <b>${otp}</b></p>`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

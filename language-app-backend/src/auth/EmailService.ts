import { sendVerificationEmail, sendResetPasswordEmail } from "../utils/email";

export class EmailService {
  static async sendVerificationEmail(
    email: string,
    token: string
  ): Promise<void> {
    await sendVerificationEmail(email, token);
  }

  static async sendResetPasswordEmail(
    email: string,
    token: string
  ): Promise<void> {
    await sendResetPasswordEmail(email, token);
  }
}

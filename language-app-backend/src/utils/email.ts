import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error("SMTP connection error:", error);
    } else {
      console.log("SMTP server is ready to take messages:", success);
    }
  });

  return transporter;
};

export const sendVerificationEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify/${token}`;
  const mailOptions = {
    from: `"Langster" <noreply@demomailtrap.co>`,
    to: email,
    subject: "Verify Your Account",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
          .header { text-align: center; padding: 20px; background-color: #4f46e5; color: white; border-radius: 8px 8px 0 0; }
          .header img { max-width: 150px; }
          .content { padding: 20px; background-color: white; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white !important; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .button:hover { background-color: #4338ca; }
          .footer { text-align: center; padding: 10px; font-size: 12px; color: #6b7280; }
          @media (max-width: 600px) {
            .container { padding: 10px; }
            .header img { max-width: 120px; }
            .button { padding: 10px 20px; font-size: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Welcome to Langster!</h2>
          </div>
          <div class="content">
            <p>Please verify your email by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not sign up, please ignore this email.</p>
          </div>
          <div class="footer">
            &copy; 2025 Langster. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  };
  const transporter = getTransporter();
  await transporter.sendMail(mailOptions);
};

export const sendResetPasswordEmail = async (
  email: string,
  token: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  const mailOptions = {
    from: `"Langster" <noreply@demomailtrap.co>`,
    to: email,
    subject: "Reset Your Password",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
          .header { text-align: center; padding: 20px; background-color: #4f46e5; color: white; border-radius: 8px 8px 0 0; }
          .header img { max-width: 150px; }
          .content { padding: 20px; background-color: white; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white !important; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .button:hover { background-color: #4338ca; }
          .footer { text-align: center; padding: 10px; font-size: 12px; color: #6b7280; }
          @media (max-width: 600px) {
            .container { padding: 10px; }
            .header img { max-width: 120px; }
            .button { padding: 10px 20px; font-size: 14px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Reset Your Password</h2>
          </div>
          <div class="content">
            <p>You requested a password reset. Click the button below to set a new password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
          <div class="footer">
            &copy; 2025 Langster. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  };
  const transporter = getTransporter();
  await transporter.sendMail(mailOptions);
};

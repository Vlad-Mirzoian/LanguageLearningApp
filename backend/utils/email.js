const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.APP_URL}/api/auth/verify/${token}`;
  const mailOptions = {
    from: `"Langster" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify Your Account",
    html: `
    <h2>Welcome to Langster!</h2>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verificationUrl}">Verify Email</a>
    <p>This link will expire in 24 hours.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};

const sendResetPasswordEmail = async (email, token) => {
  const resetUrl = `${process.env.APP_URL}/api/auth/reset-password/${token}`;
  const mailOptions = {
    from: `"Langster" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your Password",
    html: `
    <h2>Password Reset Request</h2>
    <p>You requested a password reset. Click the link below to set a new password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendResetPasswordEmail };

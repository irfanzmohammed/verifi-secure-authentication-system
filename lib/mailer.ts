
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS?.replace(/\s/g, ""),
  },
});

export async function sendOtpEmail(
  email: string,
  otp: string
) {
  await transporter.sendMail({
    from: `"Verifi - Secure Authentication System" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Verifi Verification Code",
    text: `Your Verifi verification code is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verifi - Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 6px;">${otp}</h1>
        <p>This code expires in 5 minutes.</p>
        <p>Do not share this code with anyone.</p>
      </div>
    `,
  });
}

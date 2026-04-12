import nodemailer from "nodemailer";

function getTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

export async function sendVerificationEmail(email: string, token: string) {
  const transporter = getTransporter();
  const verifyUrl = `${getBaseUrl()}/api/auth/verify-email?token=${token}`;

  if (!transporter) {
    console.log("[verify-email] Email not configured. Verify URL for", email, ":", verifyUrl);
    return;
  }

  await transporter.sendMail({
    from: `"askGenie" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify your askGenie email",
    text: `Welcome to askGenie!\n\nPlease verify your email address by clicking the link below. This link expires in 24 hours.\n\n${verifyUrl}\n\nIf you didn't create an account, you can safely ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e1b4b">Verify your email</h2>
        <p>Welcome to <strong>askGenie</strong>! Click the button below to verify your email address and activate your account.</p>
        <p style="margin:24px 0">
          <a href="${verifyUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
            Verify my email
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">This link expires in <strong>24 hours</strong>. If you didn't create an account, ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">askGenie Student Aid Hub · elementone27@gmail.com</p>
      </div>
    `,
  }).catch((err) => {
    console.error("[verify-email] Failed to send:", err?.message);
  });
}

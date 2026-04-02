import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Always respond with success to prevent email enumeration
  const successResponse = NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return successResponse;

  // Generate a secure random token (hex, 32 bytes)
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpiry: expiry },
  });

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.log("[forgot-password] Email not configured. Token for", normalizedEmail, ":", token);
    return successResponse;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"askGenie" <${gmailUser}>`,
    to: normalizedEmail,
    subject: "Reset your askGenie password",
    text: `You requested a password reset for your askGenie account.\n\nClick the link below to set a new password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e1b4b">Reset your password</h2>
        <p>You requested a password reset for your <strong>askGenie</strong> account.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
            Set new password
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">This link expires in <strong>1 hour</strong>. If you didn't request a reset, ignore this email — your password won't change.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">askGenie Student Aid Hub · elementone27@gmail.com</p>
      </div>
    `,
  }).catch((err) => {
    console.error("[forgot-password] Failed to send email:", err?.message);
  });

  return successResponse;
}

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const TO_EMAIL = "elementone27@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, role, institution, message, type } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const subject =
      type === "demo"
        ? `Demo Request — ${institution ?? name} (${email})`
        : `Contact Form — ${name} (${email})`;

    const lines: string[] = [
      `Name: ${name}`,
      `Email: ${email}`,
    ];
    if (role) lines.push(`Role: ${role}`);
    if (institution) lines.push(`Institution: ${institution}`);
    lines.push("", "Message:", message);

    const text = lines.join("\n");

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      // Log to console so submissions aren't silently lost when email isn't configured
      console.log("[contact] Email not configured. Submission:\n", text);
      return NextResponse.json({ ok: true });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"askGenie Contact" <${user}>`,
      to: TO_EMAIL,
      replyTo: email,
      subject,
      text,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact] Failed to send email:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

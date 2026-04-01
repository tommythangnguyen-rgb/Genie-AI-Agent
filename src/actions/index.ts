"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, getSession } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limiter";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254;
const MAX_PASSWORD_LEN = 128;

// Pre-computed dummy hash used for constant-time comparison when user is not found,
// preventing email enumeration via timing side-channel.
let dummyHash: string | null = null;
async function getDummyHash(): Promise<string> {
  if (!dummyHash) dummyHash = await bcrypt.hash("__timing_dummy__", 10);
  return dummyHash;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function signUp(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length > MAX_EMAIL_LEN || !EMAIL_REGEX.test(normalizedEmail)) {
      return { success: false, error: "Invalid email address" };
    }

    if (password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    if (password.length > MAX_PASSWORD_LEN) {
      return { success: false, error: "Password is too long" };
    }

    // 5 sign-up attempts per email per hour
    if (!checkRateLimit(`signup:${normalizedEmail}`, 5, 60 * 60 * 1000)) {
      return { success: false, error: "Too many attempts. Please try again later." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    await createSession(user.id, user.email);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Sign up error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    // Surface DB/connection errors clearly so they're diagnosable
    if (msg.includes("connect") || msg.includes("ECONNREFUSED") || msg.includes("timeout") || msg.includes("Can't reach")) {
      return { success: false, error: "Database connection failed. Please try again in a moment." };
    }
    if (msg.includes("Unique constraint") || msg.includes("unique constraint") || msg.includes("P2002")) {
      return { success: false, error: "Email already registered. Try signing in instead." };
    }
    // Always surface the raw error so it's diagnosable — scrub it once the root cause is found
    return { success: false, error: `Sign up failed: ${msg}` };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail.length > MAX_EMAIL_LEN || password.length > MAX_PASSWORD_LEN) {
      return { success: false, error: "Invalid credentials" };
    }

    // 10 sign-in attempts per email per 15 minutes
    if (!checkRateLimit(`signin:${normalizedEmail}`, 10, 15 * 60 * 1000)) {
      return { success: false, error: "Too many attempts. Please try again in 15 minutes." };
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always run bcrypt to prevent timing-based email enumeration
    const hashToCompare = user?.password ?? (await getDummyHash());
    const isValidPassword = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValidPassword) {
      return { success: false, error: "Invalid credentials" };
    }

    await createSession(user.id, user.email);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("connect") || msg.includes("ECONNREFUSED") || msg.includes("timeout") || msg.includes("Can't reach")) {
      return { success: false, error: "Database connection failed. Please try again in a moment." };
    }
    return { success: false, error: `Sign in failed: ${msg}` };
  }
}

export async function signOut() {
  await deleteSession();
  revalidatePath("/");
  redirect("/");
}

export async function getUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

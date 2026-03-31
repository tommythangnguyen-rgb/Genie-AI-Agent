import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET — list current members
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      subscriptionTier: true,
      accountMembers: { select: { id: true, email: true, createdAt: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.subscriptionTier === "FREE") {
    return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
  }

  return NextResponse.json({ members: user.accountMembers, maxSeats: 3 });
}

// POST — add a member (by email)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owner = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      subscriptionTier: true,
      accountMembers: { select: { id: true } },
    },
  });

  if (!owner || owner.subscriptionTier === "FREE") {
    return NextResponse.json({ error: "Paid subscription required" }, { status: 403 });
  }

  if (owner.accountMembers.length >= 2) {
    return NextResponse.json(
      { error: "Maximum 2 additional members (3 total seats) reached" },
      { status: 400 }
    );
  }

  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      password: hashed,
      accountOwnerId: session.userId,
    },
  });

  return NextResponse.json({ success: true });
}

// DELETE — remove a member
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { memberId } = await req.json();

  const member = await prisma.user.findUnique({
    where: { id: memberId },
    select: { accountOwnerId: true },
  });

  if (!member || member.accountOwnerId !== session.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id: memberId } });
  return NextResponse.json({ success: true });
}

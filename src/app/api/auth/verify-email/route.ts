import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/aid-agent?auth=signup&verifyError=invalid", req.url));
  }

  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
    select: { id: true, email: true, emailVerificationExpiry: true, emailVerified: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/aid-agent?auth=signup&verifyError=invalid", req.url));
  }

  if (user.emailVerified) {
    // Already verified — just sign them in
    await createSession(user.id, user.email);
    return NextResponse.redirect(new URL("/aid-agent", req.url));
  }

  if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
    return NextResponse.redirect(new URL("/aid-agent?auth=signup&verifyError=expired", req.url));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  await createSession(user.id, user.email);

  return NextResponse.redirect(new URL("/aid-agent?verified=1", req.url));
}

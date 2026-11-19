import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const secretKey =
  process.env.JWT_SECRET || "scrim-manager-super-secret-key-2026";
const key = new TextEncoder().encode(secretKey);
const COOKIE_NAME = "scrim_session";

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 วัน
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key);
    const userId = payload.userId as string;

    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        gamerTag: true,
        role: true,
        memberships: {
          include: { team: true },
        },
      },
    });
  } catch {
    return null;
  }
}

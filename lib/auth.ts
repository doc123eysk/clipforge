import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface AuthUser {
  id: string;
  email: string | null;
  kind: string;
  subscription?: { plan: string; expiresAt: Date | null } | null;
}

export function signToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const store = await cookies();
  const token = store.get("token")?.value;
  if (!token) return { id: "", email: null, kind: "guest" };

  const payload = verifyToken(token);
  if (!payload) return { id: "", email: null, kind: "guest" };

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { subscription: true },
  });
  if (!user) return { id: "", email: null, kind: "guest" };

  return {
    id: user.id,
    email: user.email,
    kind: user.kind,
    subscription: user.subscription
      ? { plan: user.subscription.plan, expiresAt: user.subscription.expiresAt }
      : null,
  };
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (user.kind !== "admin") throw new Error("Unauthorized");
  return user;
}

export async function getOrCreateGuest(anonId?: string): Promise<AuthUser> {
  if (anonId) {
    const user = await prisma.user.findUnique({ where: { id: anonId } });
    if (user) return { id: user.id, email: null, kind: "guest" };
  }
  const user = await prisma.user.create({
    data: { email: `guest-${Date.now()}@anon.local`, kind: "guest" },
  });
  return { id: user.id, email: null, kind: "guest" };
}

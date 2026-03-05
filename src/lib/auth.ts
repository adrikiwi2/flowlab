import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "flowlab_token";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return new TextEncoder().encode(secret);
}

export async function signToken(tenantId: string): Promise<string> {
  return new SignJWT({ sub: tenantId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${MAX_AGE}s`)
    .setIssuedAt()
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export function buildCookieHeader(token: string): string {
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MAX_AGE}${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

export function buildLogoutCookieHeader(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

export { COOKIE_NAME };

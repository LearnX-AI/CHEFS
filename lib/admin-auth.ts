import {
  createHmac,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const adminSessionCookieName = "chef_admin_session";

type AdminSession = {
  adminId: string;
  username: string;
  expiresAt: number;
  nonce: string;
};

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "Missing ADMIN_SESSION_SECRET environment variable. Use at least 32 random characters.",
    );
  }

  return secret;
}

export function shouldUseSecureAdminCookie() {
  if (process.env.ADMIN_COOKIE_SECURE === "false") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

function base64Url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, expectedHash] = storedHash.split(":");

  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expectedHash, "hex");

  return (
    actualHash.length === expectedBuffer.length &&
    timingSafeEqual(actualHash, expectedBuffer)
  );
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${hash}`;
}

export function createAdminSessionToken(adminId: string, username: string) {
  const session: AdminSession = {
    adminId,
    username,
    expiresAt: Date.now() + 1000 * 60 * 60 * 8,
    nonce: randomUUID(),
  };
  const payload = base64Url(JSON.stringify(session));

  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token?: string) {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature || sign(payload) !== signature) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as AdminSession;

    if (!session.adminId || session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();

  return verifyAdminSessionToken(
    cookieStore.get(adminSessionCookieName)?.value,
  );
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin");
  }

  return session;
}

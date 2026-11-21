import { cookies } from "next/headers";
import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "lyric_admin_session";

/**
 * Compara duas strings em tempo constante para evitar ataques de timing side-channel.
 */
export function safeComparePasswords(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Valida se o cookie httpOnly `lyric_admin_session` corresponde exatamente a `process.env.ADMIN_PASSWORD`
 * e garante que a variável de ambiente não esteja vazia no servidor.
 */
export function verifyAdminAuth(): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword || adminPassword.length === 0) {
    return false;
  }

  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    return false;
  }

  return safeComparePasswords(sessionCookie, adminPassword);
}

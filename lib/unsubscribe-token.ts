import { createHmac, timingSafeEqual } from "crypto";

/**
 * HMAC-signed unsubscribe tokens so future transactional emails can include a
 * plain link the recipient can click without logging in.
 *
 * Token format: base64url(email) + "." + hex(hmac(email))
 */

function secret(): string {
  return process.env.NEWSLETTER_SIGNING_SECRET || process.env.SUPABASE_SECRET_KEY || "emart-unsub";
}

function sign(email: string): string {
  return createHmac("sha256", secret()).update(email).digest("hex");
}

export function createUnsubscribeToken(email: string): string {
  const normalized = email.toLowerCase().trim();
  const encoded = Buffer.from(normalized, "utf8").toString("base64url");
  return `${encoded}.${sign(normalized)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  try {
    const email = Buffer.from(encoded, "base64url").toString("utf8");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    const expected = Buffer.from(sign(email), "hex");
    const actual = Buffer.from(signature, "hex");
    if (expected.length !== actual.length) return null;
    if (!timingSafeEqual(expected, actual)) return null;
    return email;
  } catch {
    return null;
  }
}
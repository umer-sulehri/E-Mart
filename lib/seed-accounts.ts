import fs from "fs";
import path from "path";

export interface SeedAccount {
  role: "admin" | "seller" | "customer";
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  vendorName?: string;
  vendorSlug?: string;
  vendorStatus?: string;
  commissionRate?: number;
  description?: string;
}

// data/seed-accounts.json is gitignored (contains plaintext passwords), so it is
// NOT shipped to production builds. Load it at runtime and degrade gracefully
// when absent (e.g. Vercel) so the build never breaks on the missing module.
// The demo routes additionally require NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true in
// production, and .vercelignore excludes data/ from every deployment.
export function loadSeedAccounts(): SeedAccount[] {
  try {
    const file = path.join(process.cwd(), "data", "seed-accounts.json");
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as {
      accounts?: SeedAccount[];
    };
    return Array.isArray(parsed.accounts) ? parsed.accounts : [];
  } catch {
    return [];
  }
}

/**
 * Demo login is a development/tour convenience. It is on outside production,
 * or in production only when explicitly opted into. The gating flag is read
 * server-side (a NEXT_PUBLIC_* var is inlined into the client bundle and must
 * not be the sole control for a privileged endpoint).
 */
export function demoLoginEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"
  );
}

/**
 * Creating or signing into privileged (admin/seller) demo accounts, and bulk
 * seeding, additionally requires a server-only opt-in. Even when demo login is
 * enabled, a production deployment must not be able to mint an admin account
 * unless an operator deliberately sets this - and the seed file is shipped.
 */
export function demoPrivilegedEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.DEMO_ALLOW_PRIVILEGED === "true"
  );
}
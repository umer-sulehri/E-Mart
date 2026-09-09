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
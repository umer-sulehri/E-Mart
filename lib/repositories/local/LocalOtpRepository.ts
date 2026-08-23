export interface PendingRegistration {
  name: string;
  phone?: string;
  userType: 'customer' | 'seller';
  password: string;
}

interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
  sendTimestamps: number[];
  pendingRegistration?: PendingRegistration;
}

const otpStore = new Map<string, OtpEntry>();

/** Time-to-live for verification codes (15 minutes). */
export const OTP_TTL_MS = 15 * 60 * 1000;
/** Time-to-live for password-reset codes (30 minutes). */
export const RESET_TTL_MS = 30 * 60 * 1000;
/** Maximum OTP sends per identifier per rolling hour. */
const MAX_SENDS_PER_HOUR = 3;
/** Maximum wrong verification attempts before the code is invalidated. */
const MAX_VERIFY_ATTEMPTS = 5;

function pruneSends(timestamps: number[]): number[] {
  const cutoff = Date.now() - 60 * 60 * 1000;
  return timestamps.filter((t) => t > cutoff);
}

export interface StoreResult {
  ok: boolean;
  /** Seconds until the caller may retry when quota is exhausted. */
  retryAfterSeconds?: number;
}

export class LocalOtpRepository {
  store(
    identifier: string,
    code: string,
    options: { ttlMs?: number; pendingRegistration?: PendingRegistration } = {}
  ): StoreResult {
    const existing = otpStore.get(identifier);
    const recentSends = pruneSends(existing?.sendTimestamps ?? []);

    if (recentSends.length >= MAX_SENDS_PER_HOUR) {
      const oldest = Math.min(...recentSends);
      return { ok: false, retryAfterSeconds: Math.ceil((oldest + 60 * 60 * 1000 - Date.now()) / 1000) };
    }

    otpStore.set(identifier, {
      code,
      expiresAt: Date.now() + (options.ttlMs ?? OTP_TTL_MS),
      attempts: 0,
      sendTimestamps: [...recentSends, Date.now()],
      ...(options.pendingRegistration ? { pendingRegistration: options.pendingRegistration } : {}),
    });
    return { ok: true };
  }

  getPendingRegistration(identifier: string): PendingRegistration | undefined {
    return otpStore.get(identifier)?.pendingRegistration;
  }

  clearPendingRegistration(identifier: string): void {
    const entry = otpStore.get(identifier);
    if (entry) delete entry.pendingRegistration;
  }

  verify(identifier: string, code: string): boolean {
    const entry = otpStore.get(identifier);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(identifier);
      return false;
    }
    if (entry.code !== code) {
      entry.attempts += 1;
      if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
        otpStore.delete(identifier);
      }
      return false;
    }
    otpStore.delete(identifier);
    return true;
  }
}

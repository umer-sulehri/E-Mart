const otpStore = new Map<string, { code: string; expiresAt: number }>();

export class LocalOtpRepository {
  store(identifier: string, code: string): void {
    otpStore.set(identifier, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
  }

  verify(identifier: string, code: string): boolean {
    const entry = otpStore.get(identifier);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(identifier);
      return false;
    }
    if (entry.code !== code) return false;
    otpStore.delete(identifier);
    return true;
  }
}

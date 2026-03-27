const rateLimitStore = new Map<string, { count: number; firstAttempt: number; lastAttempt: number }>();

export class RateLimiter {
  static throttleKey(email: string, ip: string): string {
    return `login:${email.toLowerCase()}|${ip}`;
  }

  static tooManyAttempts(key: string, maxAttempts = 5): boolean {
    const attempts = rateLimitStore.get(key);
    if (!attempts) return false;
    return attempts.count >= maxAttempts;
  }

  static availableIn(key: string, decayMinutes = 1): number {
    const attempts = rateLimitStore.get(key);
    if (!attempts) return 0;

    const now = Date.now();
    const decayTime = decayMinutes * 60 * 1000;
    const elapsed = now - attempts.firstAttempt;
    const remaining = decayTime - elapsed;

    return Math.max(0, Math.ceil(remaining / 1000));
  }

  static hit(key: string, decayMinutes = 1): void {
    const attempts = rateLimitStore.get(key);
    const now = Date.now();

    if (!attempts) {
      rateLimitStore.set(key, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
    } else {
      attempts.count += 1;
      attempts.lastAttempt = now;
    }

    const decayTime = decayMinutes * 60 * 1000;
    setTimeout(() => {
      rateLimitStore.delete(key);
    }, decayTime);
  }

  static clear(key: string): void {
    rateLimitStore.delete(key);
  }

  static attempts(key: string): number {
    const attempts = rateLimitStore.get(key);
    return attempts ? attempts.count : 0;
  }
}

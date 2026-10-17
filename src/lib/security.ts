// Cybersecurity & Sanitization Utilities for QALBI Cafe

/**
 * Sanitizes input text against XSS, HTML injection, and malicious scripts
 */
export function sanitizeText(input: unknown, maxLength: number = 200): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, "") // Strip HTML angle brackets
    .replace(/javascript:/gi, "") // Strip javascript URIs
    .replace(/on\w+=/gi, ""); // Strip event handlers like onload, onerror
}

/**
 * Sanitizes a numeric value within optional min and max bounds
 */
export function sanitizeNumber(input: unknown, min: number = 0, max: number = 100000, fallback: number = 0): number {
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

// In-memory rate limiting map for brute-force & DDoS protection
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Checks if a client IP has exceeded max requests within the windowMs
 */
export function isRateLimited(key: string, maxAttempts: number = 10, windowMs: number = 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > maxAttempts;
}

/**
 * Extracts a safe client identifier (IP or forwarded header) from the request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

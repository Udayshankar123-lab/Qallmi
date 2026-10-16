// Table Security for QALBI Cafe
// Prevents customers or guests from tampering with or editing the table number in the browser address bar.

const TABLE_SECRET_SALT = "QALBI_CAFE_VIJAYAPURA_TABLE_SECURITY_2026_FARHAN";

/**
 * Deterministic salted signature for tamper-proof table verification.
 */
export function generateTableSignature(tableNum: string): string {
  const normalized = tableNum.padStart(2, "0");
  const payload = `TABLE:${normalized}:SALT:${TABLE_SECRET_SALT}`;

  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < payload.length; i++) {
    const ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hash32 = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  return hash32.substring(0, 8);
}

/**
 * Creates an obfuscated, signed table token so table numbers are not plain text in the URL.
 */
export function createSecureTableToken(tableNum: string): string {
  const clean = tableNum.padStart(2, "0");
  const sig = generateTableSignature(clean);
  const raw = `${clean}-${sig}`;

  if (typeof btoa !== "undefined") {
    return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  return Buffer.from(raw).toString("base64url");
}

/**
 * Generates the full verified dine-in URL for a table standee/QR code.
 */
export function createSecureTableUrl(baseUrl: string, tableNum: string): string {
  const base = baseUrl.replace(/\/$/, "");
  const token = createSecureTableToken(tableNum);
  return `${base}/?t=${token}`;
}

/**
 * Validates a table token or raw query parameter.
 * Returns the verified 2-digit table number if signature is valid.
 * Returns null if missing, forged, tampered, or invalid.
 */
export function verifyTableToken(token: string | null): string | null {
  if (!token) return null;

  try {
    let decoded = "";
    try {
      const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      if (typeof atob !== "undefined") {
        decoded = atob(padded);
      } else {
        decoded = Buffer.from(padded, "base64").toString("utf-8");
      }
    } catch {
      decoded = token;
    }

    const delimiter = decoded.includes("-") ? "-" : decoded.includes("_") ? "_" : null;
    if (!delimiter) return null;

    const [tableNum, sig] = decoded.split(delimiter);
    if (!tableNum || !sig) return null;

    const clean = tableNum.padStart(2, "0");
    const expectedSig = generateTableSignature(clean);

    if (sig === expectedSig) {
      return clean;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Instantly cleans the URL query parameters from the browser address bar
 * so the customer only sees "https://qalbicafe.vercel.app/" with NO table parameter to edit.
 */
export function cleanAddressBar(): void {
  if (typeof window === "undefined" || !window.history) return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of ["t", "table", "token", "tableToken", "sig"]) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      const cleanPath = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : "") + url.hash;
      window.history.replaceState({}, document.title, cleanPath || "/");
    }
  } catch {
    // Ignore history errors
  }
}

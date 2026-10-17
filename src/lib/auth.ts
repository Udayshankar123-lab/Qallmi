import { NextResponse } from "next/server";
import { getStaffPin } from "./db";
import { isRateLimited, getClientIp } from "./security";

/**
 * Validates staff credentials from incoming request headers.
 * Protects administrative mutation endpoints against hacking and unauthorized access.
 */
export async function verifyStaffAuth(request: Request): Promise<{ authorized: boolean; reason?: string }> {
  const ip = getClientIp(request);

  // Anti-Brute-Force Protection: max 12 PIN verification attempts per 5 minutes per IP
  if (isRateLimited(`auth-fail-${ip}`, 12, 5 * 60 * 1000)) {
    return {
      authorized: false,
      reason: "Too many failed attempts. Access temporarily locked for security.",
    };
  }

  const pinHeader = request.headers.get("x-staff-pin");
  const authHeader = request.headers.get("authorization");

  let submittedPin = pinHeader;
  if (!submittedPin && authHeader && authHeader.startsWith("Bearer ")) {
    submittedPin = authHeader.substring(7).trim();
  }

  if (!submittedPin) {
    return {
      authorized: false,
      reason: "Unauthorized: Staff security credentials required.",
    };
  }

  const currentPin = await getStaffPin();

  // Allow current custom PIN or master cafe emergency pins
  const isMatch =
    submittedPin === currentPin ||
    submittedPin === "1234" ||
    submittedPin === "7411";

  if (!isMatch) {
    // Record failed attempt for rate limiting
    isRateLimited(`auth-fail-${ip}`, 12, 5 * 60 * 1000);
    return {
      authorized: false,
      reason: "Unauthorized: Invalid staff security credentials.",
    };
  }

  return { authorized: true };
}

/**
 * Returns a standardized 401 Unauthorized response for blocked requests
 */
export function unauthorizedResponse(reason: string = "Unauthorized: Staff credentials required") {
  return NextResponse.json(
    {
      success: false,
      error: reason,
      code: "STAFF_AUTH_REQUIRED",
    },
    { status: 401 }
  );
}

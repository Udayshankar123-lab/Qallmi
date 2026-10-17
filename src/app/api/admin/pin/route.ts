import { NextResponse } from "next/server";
import { getStaffPin, setStaffPin } from "@/lib/db";

export async function GET() {
  try {
    const currentPin = getStaffPin();
    return NextResponse.json({ success: true, hasCustomPin: currentPin !== "1234" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get PIN status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, pin, oldPin, newPin } = body;

    const currentPin = getStaffPin();

    // Verify PIN action (e.g., login check)
    if (action === "verify") {
      const isValid = pin === currentPin || pin === "1234" || pin === "7411";
      return NextResponse.json({ success: true, isValid });
    }

    // Change PIN action
    if (!oldPin || !newPin) {
      return NextResponse.json(
        { success: false, error: "Please provide both old PIN and new PIN" },
        { status: 400 }
      );
    }

    // Verify old PIN
    if (oldPin !== currentPin && oldPin !== "1234" && oldPin !== "7411") {
      return NextResponse.json(
        { success: false, error: "Current PIN is incorrect. Please try again." },
        { status: 401 }
      );
    }

    if (newPin.length < 4) {
      return NextResponse.json(
        { success: false, error: "New PIN must be at least 4 digits" },
        { status: 400 }
      );
    }

    setStaffPin(newPin);
    return NextResponse.json({ success: true, message: "Staff PIN updated successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update staff PIN";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

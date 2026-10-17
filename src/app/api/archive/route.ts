import { NextResponse } from "next/server";
import { getDailyRecords, archivePastOrders, deleteDailyRecord } from "@/lib/db";
import { verifyStaffAuth, unauthorizedResponse } from "@/lib/auth";
import { sanitizeText } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Cybersecurity Check: Financial ledger is strictly staff-only
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.reason);
    }

    const records = await getDailyRecords();
    return NextResponse.json({ success: true, records });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch daily records";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Cybersecurity Check: Only staff can archive orders / close day
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.reason);
    }

    const body = await request.json().catch(() => ({}));
    const mode = body.mode === "close_day" || body.mode === "all_past" ? body.mode : "yesterday";

    const result = await archivePastOrders(mode);
    return NextResponse.json({
      success: true,
      archivedCount: result.archivedCount,
      records: result.records,
      remainingOrders: result.remainingOrders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to archive orders";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Cybersecurity Check: Only staff can delete ledger records
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.reason);
    }

    const { searchParams } = new URL(request.url);
    const date = sanitizeText(searchParams.get("date"), 30);

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Missing date parameter" },
        { status: 400 }
      );
    }

    const deleted = await deleteDailyRecord(date);
    const updatedRecords = await getDailyRecords();
    return NextResponse.json({ success: deleted, records: updatedRecords });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete daily record";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

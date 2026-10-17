import { NextResponse } from "next/server";
import { getDailyRecords, archivePastOrders, deleteDailyRecord } from "@/lib/db";

export async function GET() {
  try {
    const records = getDailyRecords();
    return NextResponse.json({ success: true, records });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch daily records";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { mode = "yesterday" } = body;

    const result = archivePastOrders(mode);
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
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Missing date parameter" },
        { status: 400 }
      );
    }

    const deleted = deleteDailyRecord(date);
    return NextResponse.json({ success: deleted, records: getDailyRecords() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete daily record";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

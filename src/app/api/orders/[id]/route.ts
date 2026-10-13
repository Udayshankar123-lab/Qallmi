import { NextResponse } from "next/server";
import { getOrderById } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = getOrderById(id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch order";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getOrders, createOrder, updateOrderStatus } from "@/lib/db";
import { OrderStatus } from "@/types/cafe";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const status = searchParams.get("status");

    let orders = getOrders();
    if (table) {
      orders = orders.filter((o) => o.tableNumber === table);
    }
    if (status && status !== "all") {
      orders = orders.filter((o) => o.status === status);
    }

    return NextResponse.json({ success: true, orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tableNumber,
      customerName,
      customerPhone,
      items,
      paymentMethod = "upi",
      transactionId,
      specialInstructions,
    } = body;

    if (!tableNumber || !items || !items.length) {
      return NextResponse.json(
        { success: false, error: "Missing required order details" },
        { status: 400 }
      );
    }

    // Recalculate totals for server-side integrity
    const subtotal = items.reduce(
      (sum: number, item: { unitPrice: number; quantity: number }) =>
        sum + item.unitPrice * item.quantity,
      0
    );
    const tax = 0; // No GST
    const total = subtotal;

    const order = createOrder({
      tableNumber: String(tableNumber).padStart(2, "0"),
      customerName: customerName || "Guest",
      customerPhone: customerPhone || "",
      items,
      subtotal,
      tax,
      total,
      status: "received",
      paymentStatus: "unpaid", // Pay at counter upon dining
      paymentMethod: paymentMethod || "pay_at_counter",
      transactionId: transactionId || `DINEIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      specialInstructions: specialInstructions || "",
    });

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, paymentStatus } = body;
    if (!id || (!status && !paymentStatus)) {
      return NextResponse.json(
        { success: false, error: "Missing order id or fields to update" },
        { status: 400 }
      );
    }

    const updated = updateOrderStatus(id, status as OrderStatus, paymentStatus);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update order status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

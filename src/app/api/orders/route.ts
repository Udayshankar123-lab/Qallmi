import { NextResponse } from "next/server";
import { getOrders, createOrder, updateOrderStatus } from "@/lib/db";
import { OrderStatus } from "@/types/cafe";
import { verifyStaffAuth, unauthorizedResponse } from "@/lib/auth";
import { sanitizeText, sanitizeNumber, isRateLimited, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const status = searchParams.get("status");

    // Cybersecurity: If fetching all cafe orders (no specific table), require staff authentication
    if (!table) {
      const auth = await verifyStaffAuth(request);
      if (!auth.authorized) {
        return unauthorizedResponse(auth.reason);
      }
    }

    let orders = await getOrders();
    if (table) {
      orders = orders.filter((o) => o.tableNumber === table);
    }
    if (status && status !== "all") {
      orders = orders.filter((o) => o.status === status);
    }

    return NextResponse.json(
      { success: true, orders },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    // Anti-Spam: max 8 order requests per 2 minutes per IP
    if (isRateLimited(`order-spam-${ip}`, 8, 2 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many orders placed in short succession. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const rawTable = sanitizeText(body.tableNumber, 10);
    const tableNumber = rawTable ? rawTable.padStart(2, "0") : "";
    const customerName = sanitizeText(body.customerName, 60) || "Guest";
    const customerPhone = sanitizeText(body.customerPhone, 20);
    const specialInstructions = sanitizeText(body.specialInstructions, 300);
    const items = Array.isArray(body.items) ? body.items : [];

    if (!tableNumber || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required order details" },
        { status: 400 }
      );
    }

    // Server-Side Price & Total Calculation to prevent tampering
    let subtotal = 0;
    const sanitizedItems = items.map((item: any) => {
      const unitPrice = sanitizeNumber(item.unitPrice, 0, 10000, 0);
      const quantity = Math.max(1, Math.min(sanitizeNumber(item.quantity, 1, 50, 1), 50));
      subtotal += unitPrice * quantity;

      return {
        id: sanitizeText(item.id, 100) || `it-${Date.now()}`,
        menuItemId: sanitizeText(item.menuItemId, 100),
        name: sanitizeText(item.name, 100),
        unitPrice,
        quantity,
        imageUrl: item.imageUrl || "",
        selectedSize: sanitizeText(item.selectedSize, 50),
        selectedOptions: item.selectedOptions || {},
        notes: sanitizeText(item.notes, 150),
      };
    });

    const tax = 0; // No GST
    const total = subtotal;

    const order = await createOrder({
      tableNumber,
      customerName,
      customerPhone,
      items: sanitizedItems,
      subtotal,
      tax,
      total,
      status: "received",
      paymentStatus: "unpaid",
      paymentMethod: "pay_at_counter",
      transactionId: `DINEIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      specialInstructions,
    });

    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Cybersecurity Check: Only authenticated staff can change order status or mark as paid
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.reason);
    }

    const body = await request.json();
    const { id, status, paymentStatus } = body;
    if (!id || (!status && !paymentStatus)) {
      return NextResponse.json(
        { success: false, error: "Missing order id or fields to update" },
        { status: 400 }
      );
    }

    const updated = await updateOrderStatus(id, status as OrderStatus, paymentStatus);
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

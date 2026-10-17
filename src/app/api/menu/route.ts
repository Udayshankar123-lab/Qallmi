import { NextResponse } from "next/server";
import { getMenuItems, saveMenuItem, toggleItemAvailability, deleteMenuItem, clearMenuItems } from "@/lib/db";
import { MenuItem } from "@/types/cafe";
import { verifyStaffAuth, unauthorizedResponse } from "@/lib/auth";
import { sanitizeText, sanitizeNumber } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getMenuItems();
    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch menu";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Cybersecurity Check: Only authenticated staff can add dishes
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.reason);
    }

    const body = await request.json();
    const name = sanitizeText(body.name, 100);
    const description = sanitizeText(body.description, 300);
    const category = sanitizeText(body.category, 50) || "all";
    const price = sanitizeNumber(body.price, 0, 50000, 0);

    if (!name || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Dish name and valid price are required." },
        { status: 400 }
      );
    }

    const item: MenuItem = {
      ...body,
      id: body.id || `m-${Date.now()}`,
      name,
      description,
      category,
      price,
      imageUrl: body.imageUrl || "",
      isAvailable: body.isAvailable ?? true,
      dietary: body.dietary || "veg",
    };

    const saved = await saveMenuItem(item);
    return NextResponse.json({ success: true, item: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Cybersecurity Check: Only authenticated staff can update dish availability
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.reason);
    }

    const { id, isAvailable } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing item id" }, { status: 400 });
    }

    const updated = await toggleItemAvailability(id, Boolean(isAvailable));
    return NextResponse.json({ success: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Cybersecurity Check: Only authenticated staff can delete dishes
    const auth = await verifyStaffAuth(request);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.reason);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (action === "clear_all") {
      const cleared = await clearMenuItems();
      return NextResponse.json({ success: cleared });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing item id" }, { status: 400 });
    }

    const deleted = await deleteMenuItem(id);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

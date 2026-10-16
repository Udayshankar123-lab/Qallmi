import { NextResponse } from "next/server";
import { getMenuItems, saveMenuItem, toggleItemAvailability, deleteMenuItem, clearMenuItems } from "@/lib/db";
import { MenuItem } from "@/types/cafe";

export async function GET() {
  try {
    const items = getMenuItems();
    return NextResponse.json({ success: true, items });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch menu";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item: MenuItem = {
      ...body,
      id: body.id || `m-${Date.now()}`,
      price: Number(body.price),
      isAvailable: body.isAvailable ?? true,
    };
    const saved = saveMenuItem(item);
    return NextResponse.json({ success: true, item: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, isAvailable } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing item id" }, { status: 400 });
    }
    const updated = toggleItemAvailability(id, isAvailable);
    return NextResponse.json({ success: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (action === "clear_all") {
      const cleared = clearMenuItems();
      return NextResponse.json({ success: cleared });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing item id" }, { status: 400 });
    }
    const deleted = deleteMenuItem(id);
    return NextResponse.json({ success: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete item";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCategories, saveCategory, deleteCategory } from "@/lib/db";
import { Category } from "@/types/cafe";
import { verifyStaffAuth, unauthorizedResponse } from "@/lib/auth";
import { sanitizeText } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch categories";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Cybersecurity Check: Only authenticated staff can create categories
    const auth = await verifyStaffAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.reason);
    }

    const body = await req.json();
    const cleanName = sanitizeText(body.name, 50);

    if (!cleanName) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newCategory: Category = {
      id: id || `cat-${Date.now()}`,
      name: cleanName,
      icon: sanitizeText(body.icon, 30) || "Coffee",
    };

    const saved = await saveCategory(newCategory);
    return NextResponse.json({ success: true, category: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save category";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Cybersecurity Check: Only authenticated staff can delete categories
    const auth = await verifyStaffAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.reason);
    }

    const body = await req.json();
    const id = sanitizeText(body.id, 50);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    const success = await deleteCategory(id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete category";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

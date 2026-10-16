import { NextRequest, NextResponse } from "next/server";
import { getCategories, saveCategory, deleteCategory } from "@/lib/db";
import { Category } from "@/types/cafe";

export async function GET() {
  try {
    const categories = getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch categories";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, icon } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Category name is required" },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const newCategory: Category = {
      id: id || `cat-${Date.now()}`,
      name: cleanName,
      icon: icon || "Coffee",
    };

    const saved = saveCategory(newCategory);
    return NextResponse.json({ success: true, category: saved });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save category";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Category ID is required" },
        { status: 400 }
      );
    }

    const success = deleteCategory(id);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete category";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

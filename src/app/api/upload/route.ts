import { NextResponse } from "next/server";
import { verifyStaffAuth, unauthorizedResponse } from "@/lib/auth";
import { uploadImageToBlob } from "@/lib/blobStorage";

export const maxDuration = 30; // Max execution seconds for upload

export async function POST(request: Request) {
  try {
    // Strict Cybersecurity: Only authenticated staff can upload dish images
    const authCheck = await verifyStaffAuth(request);
    if (!authCheck.authorized) {
      return unauthorizedResponse(authCheck.reason);
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
      }

      // Check file size (max 6MB)
      if (file.size > 6 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: "Image size exceeds 6MB limit" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const blobUrl = await uploadImageToBlob(buffer, file.type || "image/jpeg", ext);

      if (blobUrl) {
        return NextResponse.json({ success: true, url: blobUrl });
      }

      // If blob fails, return data URL fallback
      const base64 = buffer.toString("base64");
      const dataUrl = `data:${file.type || "image/jpeg"};base64,${base64}`;
      return NextResponse.json({ success: true, url: dataUrl });
    }

    // JSON base64 upload
    const body = await request.json().catch(() => ({}));
    const { dataUrl, filename } = body;

    if (!dataUrl || typeof dataUrl !== "string") {
      return NextResponse.json({ success: false, error: "Invalid image payload" }, { status: 400 });
    }

    // Extract base64 and mime
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ success: true, url: dataUrl });
    }

    const mime = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");
    const ext = mime.split("/")[1] || "jpg";

    const blobUrl = await uploadImageToBlob(buffer, mime, ext);
    if (blobUrl) {
      return NextResponse.json({ success: true, url: blobUrl });
    }

    return NextResponse.json({ success: true, url: dataUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

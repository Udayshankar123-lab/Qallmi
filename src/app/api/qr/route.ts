import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text") || searchParams.get("url");
    const table = searchParams.get("table") || "01";
    const format = (searchParams.get("format") || "svg").toLowerCase();
    const download = searchParams.get("download") === "true";
    const width = parseInt(searchParams.get("width") || "512", 10);

    if (!text) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameter: text" },
        { status: 400 }
      );
    }

    // Generate in Brand Colors: Deep Espresso (#241713) on Pure White (#FFFFFF)
    const qrOptions = {
      margin: 2,
      errorCorrectionLevel: "H" as const, // High error correction (30% recoverable)
      color: {
        dark: "#241713",
        light: "#FFFFFF",
      },
    };

    if (format === "png") {
      const buffer = await QRCode.toBuffer(text, {
        ...qrOptions,
        type: "png",
        width,
      });

      const filename = `qallmi-table-${table}-qr.png`;
      const headers: Record<string, string> = {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      };

      if (download) {
        headers["Content-Disposition"] = `attachment; filename="${filename}"`;
      }

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers,
      });
    }

    // Default: SVG format (crisp, scalable vector)
    const svgString = await QRCode.toString(text, {
      ...qrOptions,
      type: "svg",
      width,
    });

    const filename = `qallmi-table-${table}-qr.svg`;
    const headers: Record<string, string> = {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    };

    if (download) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    return new NextResponse(svgString, {
      status: 200,
      headers,
    });
  } catch (error: unknown) {
    console.error("QR Generation Error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate QR code";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

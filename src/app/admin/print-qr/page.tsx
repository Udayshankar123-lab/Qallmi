"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Coffee, Printer, ArrowLeft, Download, Wifi, UtensilsCrossed } from "lucide-react";
import { createSecureTableUrl } from "@/lib/tableSecurity";

function PrintQRContent() {
  const searchParams = useSearchParams();
  const [baseUrl, setBaseUrl] = useState("http://10.63.0.52:3000");
  const [tableCount, setTableCount] = useState(8);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const paramBase = searchParams.get("baseUrl");
      if (paramBase) {
        setBaseUrl(paramBase);
      } else {
        const origin = window.location.origin;
        setBaseUrl(origin.includes("localhost") ? "http://10.63.0.52:3000" : origin);
      }

      const paramCount = searchParams.get("count");
      if (paramCount) {
        setTableCount(Math.max(1, parseInt(paramCount, 10) || 8));
      }
    }
  }, [searchParams]);

  const tables = Array.from({ length: tableCount }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#241713] p-4 sm:p-8 font-sans">
      {/* Non-printing Control Bar */}
      <div className="max-w-5xl mx-auto mb-8 bg-[#FFFFFF] p-5 rounded-3xl border border-[#B8A99A]/30 shadow-md print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#493126] hover:text-[#241713] mb-1.5"
            >
              <ArrowLeft className="w-4 h-4 text-[#C6A46C]" />
              <span>Back to Staff Dashboard</span>
            </Link>
            <h1 className="font-serif font-black text-xl sm:text-2xl text-[#241713]">
              Printable Table QR Standees & Tent Cards
            </h1>
            <p className="text-xs text-[#B8A99A]">
              Professional high-resolution table cards formatted for standard A4 printing.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-3 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-[#C6A46C]" />
              <span>Print All Cards</span>
            </button>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#F5F3EF]">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#493126] mb-1">
              QR Target Base Domain / IP:
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="e.g. https://qalbicafe.vercel.app"
              className="w-full px-3.5 py-2 text-xs font-mono bg-[#F5F3EF] border border-[#B8A99A]/40 rounded-xl text-[#241713] focus:outline-none focus:ring-1 focus:ring-[#C6A46C]"
            />
            <div className="flex items-center gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setBaseUrl("https://qalbicafe.vercel.app")}
                className="text-[10px] font-bold text-[#493126] hover:text-[#241713] px-2 py-0.5 rounded bg-[#493126]/10"
              >
                QALBI Production Domain
              </button>
              <button
                type="button"
                onClick={() => setBaseUrl(window.location.origin)}
                className="text-[10px] font-bold text-[#493126] hover:text-[#241713] px-2 py-0.5 rounded bg-[#493126]/10"
              >
                Browser Host ({typeof window !== "undefined" ? window.location.host : ""})
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#493126] mb-1">
              Number of Table Cards:
            </label>
            <div className="flex items-center gap-2">
              {[4, 6, 8, 12, 16].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setTableCount(cnt)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    tableCount === cnt
                      ? "bg-[#241713] text-[#F7F2EA]"
                      : "bg-[#F5F3EF] text-[#493126] hover:bg-[#E5E2DC]"
                  }`}
                >
                  {cnt} Tables
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#B8A99A] mt-1.5">
              Standard A4 paper fits 2 cards per page (approx. 4×6 inches each).
            </p>
          </div>
        </div>
      </div>

      {/* Printable Grid of Table Standees */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 print:grid-cols-2 print:gap-6 print:m-0 print:p-0">
        {tables.map((num) => {
          const targetUrl = createSecureTableUrl(baseUrl, num);
          const qrSrc = `/api/qr?text=${encodeURIComponent(targetUrl)}&table=${num}&format=svg`;
          const downloadPngUrl = `/api/qr?text=${encodeURIComponent(targetUrl)}&table=${num}&format=png&download=true&width=1024`;

          return (
            <div
              key={num}
              className="bg-[#FFFFFF] rounded-3xl border-2 border-[#241713] p-7 flex flex-col items-center text-center shadow-lg print:shadow-none print:break-inside-avoid relative overflow-hidden"
              style={{ minHeight: "440px" }}
            >
              {/* Gold Top Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#241713] via-[#C6A46C] to-[#241713]" />

              {/* Cafe Emblem */}
              <div className="flex items-center gap-2 mb-2 mt-2">
                <div className="w-8 h-8 rounded-xl bg-[#241713] text-[#C6A46C] flex items-center justify-center shadow">
                  <Coffee className="w-4 h-4 text-[#C6A46C]" />
                </div>
                <div className="text-left">
                  <span className="font-serif tracking-widest font-black text-sm text-[#241713] block leading-none">
                    QALBI CAFE
                  </span>
                  <span className="text-[9px] tracking-widest uppercase font-bold text-[#B8A99A]">
                    Tea, Coffee & Fast Food
                  </span>
                </div>
              </div>

              {/* Table Number Pill */}
              <div className="my-2.5 px-5 py-1 rounded-full bg-[#241713] text-[#F7F2EA] font-serif font-black text-lg tracking-wider shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C6A46C]" />
                <span>TABLE {num}</span>
              </div>

              {/* Real Scannable QR Code */}
              <div className="relative p-3 bg-[#FFFFFF] rounded-2xl border-2 border-[#B8A99A]/30 my-3 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt={`QR Code for Table ${num}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              </div>

              {/* Guest Instructions */}
              <div className="space-y-1 mb-2">
                <h4 className="font-serif font-black text-sm text-[#241713]">
                  Scan with Camera to Order
                </h4>
                <p className="text-[11px] text-[#493126] font-medium max-w-xs">
                  No app needed • Instant website menu • Pay at counter
                </p>
              </div>

              {/* Owner & Address Footer on Card */}
              <div className="mt-auto pt-2.5 border-t border-[#F5F3EF] w-full space-y-1 text-[10px] text-[#B8A99A]">
                <div className="flex items-center justify-between font-semibold text-[#493126]">
                  <div className="flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-[#C6A46C]" />
                    <span>Wi-Fi: QALBI_Guest</span>
                  </div>
                  <span>+91 74118 33084</span>
                </div>
                <p className="text-[9px] text-[#B8A99A] truncate text-center">
                  Kannan nagar, bus stop, opposite Bijapur, Vijayapura
                </p>
              </div>

              {/* Non-printing quick download button */}
              <div className="mt-3 pt-2 print:hidden flex items-center gap-2">
                <a
                  href={downloadPngUrl}
                  download={`qalbi-table-${num}-qr.png`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#F5F3EF] hover:bg-[#E5E2DC] text-[#493126] rounded-lg text-[11px] font-bold transition-colors"
                >
                  <Download className="w-3 h-3 text-[#C6A46C]" />
                  <span>Download Hi-Res PNG</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PrintQRPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center p-4">
          <div className="w-10 h-10 border-4 border-[#241713] border-t-[#C6A46C] rounded-full animate-spin" />
        </div>
      }
    >
      <PrintQRContent />
    </Suspense>
  );
}

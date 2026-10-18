"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Coffee, RotateCcw, Home, AlertCircle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[QALBI Cafe Client Error]:", error);
  }, [error]);

  const handleReset = () => {
    try {
      // Purge any corrupted order state from localStorage
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("qallmi_active_order");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (!parsed || !parsed.id || !Array.isArray(parsed.items)) {
              localStorage.removeItem("qallmi_active_order");
            }
          } catch {
            localStorage.removeItem("qallmi_active_order");
          }
        }
      }
    } catch {
      // Ignore
    }

    if (typeof reset === "function") {
      reset();
    } else if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F2EA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#B8A99A]/30 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#241713] text-[#C6A46C] flex items-center justify-center mx-auto shadow-md">
          <Coffee className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#C6A46C] bg-[#241713] px-3 py-1 rounded-full">
            QALBI CAFE
          </span>
          <h2 className="font-serif font-black text-xl text-[#241713] mt-3">
            Something went wrong
          </h2>
          <p className="text-xs text-[#493126]/80 mt-1 max-w-xs mx-auto leading-relaxed">
            We encountered a temporary hiccup updating your live status. Your kitchen order remains safe with our team!
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleReset}
            className="w-full py-3.5 px-5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
          >
            <RotateCcw className="w-4 h-4 text-[#C6A46C]" />
            <span>Reload Menu</span>
          </button>

          <Link
            href="/"
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("qallmi_active_order");
              }
            }}
            className="w-full py-3 px-5 bg-[#F7F2EA] hover:bg-[#EAE4D9] text-[#241713] border border-[#B8A99A]/30 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all block"
          >
            <Home className="w-4 h-4 text-[#493126]" />
            <span>Return to Cafe Menu</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

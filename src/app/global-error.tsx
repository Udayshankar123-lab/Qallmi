"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[QALBI Cafe Global Error]:", error);
  }, [error]);

  const handleReset = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("qallmi_active_order");
        window.location.href = "/";
        return;
      }
    } catch {
      // Ignore
    }
    reset();
  };

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: "#F7F2EA", fontFamily: "sans-serif", color: "#241713" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ maxWidth: "400px", width: "100%", backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "28px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", border: "1px solid rgba(184,169,154,0.3)" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", backgroundColor: "#241713", color: "#C6A46C", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", fontSize: "24px" }}>
              ☕
            </div>
            <div style={{ fontSize: "10px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", color: "#C6A46C", backgroundColor: "#241713", display: "inline-block", padding: "4px 12px", borderRadius: "999px" }}>
              QALBI CAFE
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 900, margin: "14px 0 6px 0", color: "#241713" }}>
              Connection Restored
            </h2>
            <p style={{ fontSize: "12px", color: "rgba(73,49,38,0.8)", margin: "0 0 20px 0", lineHeight: 1.5 }}>
              Tap below to return to the fresh cafe menu.
            </p>
            <button
              onClick={handleReset}
              style={{ width: "100%", padding: "14px 20px", backgroundColor: "#241713", color: "#F7F2EA", border: "none", borderRadius: "16px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", cursor: "pointer" }}
            >
              Return to Cafe Menu
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

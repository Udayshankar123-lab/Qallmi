"use client";

import React, { useState } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ChefHat,
  Receipt,
  UtensilsCrossed,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const {
    items,
    tableNumber,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    total,
    setActiveOrder,
    setIsTrackerOpen,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [tableNotes, setTableNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handlePlaceOrder = async () => {
    if (items.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber,
          customerName: customerName.trim() || "Table Guest",
          customerPhone: customerPhone.trim() || "",
          items,
          paymentMethod: "pay_at_counter",
          specialInstructions: tableNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success || !data.order) {
        throw new Error(data.error || "Failed to place order. Please try again.");
      }

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#C6A46C", "#241713", "#493126", "#B8A99A"],
        });
      } catch {
        // Fallback
      }

      clearCart();
      setActiveOrder(data.order);
      setIsCartOpen(false);
      setIsTrackerOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={() => setIsCartOpen(false)}
    >
      <div
        className="w-full sm:max-w-md bg-[#F7F2EA] max-h-[92vh] sm:max-h-full h-[92vh] sm:h-full flex flex-col rounded-t-3xl sm:rounded-none shadow-2xl animate-slide-up sm:animate-none overflow-hidden border-t sm:border-t-0 sm:border-l border-[#493126]/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1 bg-[#B8A99A]/50 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0" />

        {/* Header: Deep Espresso */}
        <div className="px-5 py-3.5 sm:py-4 border-b border-[#493126]/30 flex items-center justify-between bg-[#241713] text-[#F7F2EA] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C6A46C]" />
              <h2 className="font-serif font-bold text-base sm:text-lg text-[#F7F2EA]">
                Table {tableNumber} Order
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-[#B8A99A]">
              {items.length} {items.length === 1 ? "dish" : "dishes"} selected
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="p-2 text-xs text-[#B8A99A] hover:text-[#C6A46C] hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1"
                title="Clear cart"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-[#F7F2EA] hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cart items list */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-[#F7F2EA] overscroll-contain">
          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#FFFFFF] border border-[#B8A99A]/30 flex items-center justify-center text-[#493126] mb-3 shadow-xs">
                <UtensilsCrossed className="w-8 h-8 text-[#C6A46C]" />
              </div>
              <h3 className="font-serif font-bold text-base text-[#241713]">
                Your cart is empty
              </h3>
              <p className="text-xs text-[#B8A99A] max-w-xs mt-1">
                Explore our coffee roasts, morning bakes, and kitchen plates to add them to your table order.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-5 py-2.5 bg-[#241713] text-[#F7F2EA] rounded-xl text-xs font-semibold hover:bg-[#493126] transition-colors"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-[#FFFFFF] rounded-2xl border border-[#B8A99A]/30 shadow-xs"
              >
                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#F7F2EA] flex-shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-serif font-bold text-sm text-[#241713] truncate">
                      {item.name}
                    </h4>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[#B8A99A] hover:text-[#493126] transition-colors p-1"
                      aria-label="Remove dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Size & Options Tags */}
                  {(item.selectedSize || (item.selectedOptions && Object.keys(item.selectedOptions).length > 0)) && (
                    <div className="text-[11px] text-[#B8A99A] mt-0.5 space-x-1">
                      {item.selectedSize && <span className="text-[#493126] font-medium">{item.selectedSize}</span>}
                      {item.selectedOptions &&
                        Object.entries(item.selectedOptions).map(([key, val]) => (
                          <span key={key} className="text-[#C6A46C]">
                            • {val}
                          </span>
                        ))}
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-[10px] text-[#B8A99A] italic mt-0.5 truncate">
                      Note: &quot;{item.notes}&quot;
                    </p>
                  )}

                  {/* Price & Quantity Controls */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#F7F2EA]">
                    <span className="font-serif font-bold text-xs text-[#493126]">
                      ₹{item.unitPrice * item.quantity}
                    </span>

                    <div className="flex items-center bg-[#F7F2EA] border border-[#B8A99A]/30 rounded-lg overflow-hidden text-xs">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1.5 hover:bg-[#B8A99A]/20 text-[#241713]"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3 text-[#493126]" />
                      </button>
                      <span className="px-2 font-bold text-xs text-[#241713]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1.5 hover:bg-[#B8A99A]/20 text-[#241713]"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3 text-[#493126]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Customer info fields if items present */}
          {items.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#493126]">
                  Guest Details (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-2.5 text-base sm:text-xs bg-[#FFFFFF] border border-[#B8A99A]/30 rounded-xl text-[#241713] placeholder-[#B8A99A] focus:outline-none focus:ring-1 focus:ring-[#C6A46C]"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone (Optional)"
                    className="w-full px-3 py-2.5 text-base sm:text-xs bg-[#FFFFFF] border border-[#B8A99A]/30 rounded-xl text-[#241713] placeholder-[#B8A99A] focus:outline-none focus:ring-1 focus:ring-[#C6A46C]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#493126]">
                  Kitchen Instructions
                </label>
                <input
                  type="text"
                  value={tableNotes}
                  onChange={(e) => setTableNotes(e.target.value)}
                  placeholder="e.g. Serve coffee first, dressing on side"
                  className="w-full px-3 py-2.5 text-base sm:text-xs bg-[#FFFFFF] border border-[#B8A99A]/30 rounded-xl text-[#241713] placeholder-[#B8A99A] focus:outline-none focus:ring-1 focus:ring-[#C6A46C]"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Order Summary & Place Order CTA */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-[#FFFFFF] border-t border-[#B8A99A]/20 space-y-3 shadow-sm flex-shrink-0">
            {/* Bill breakdown */}
            <div className="space-y-1.5 text-xs text-[#B8A99A]">
              <div className="flex justify-between text-sm font-bold text-[#241713] pt-0.5">
                <span>Total Bill (Pay at Counter)</span>
                <span className="font-serif text-base text-[#493126]">₹{total}</span>
              </div>
            </div>

            {/* Pay at Counter Notice */}
            <div className="flex items-center gap-2 text-[11px] text-[#493126] bg-[#F7F2EA] p-2.5 rounded-xl border border-[#B8A99A]/30">
              <Receipt className="w-4 h-4 text-[#C6A46C] flex-shrink-0" />
              <span>Dine-in Order • Pay at Counter or Table after dining</span>
            </div>

            {/* Primary Action Button: Deep Espresso with white text */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full flex items-center justify-between px-5 py-3.5 sm:py-4 bg-[#241713] hover:bg-[#493126] disabled:opacity-75 text-[#F7F2EA] rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 text-[#C6A46C] animate-spin" />
                    <span>Sending to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4 text-[#C6A46C]" />
                    <span>Confirm & Send to Kitchen</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[#C6A46C]">
                <span className="font-serif text-base">₹{total}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function StickyCartBar() {
  const { totalItems, total, setIsCartOpen, isCartOpen, isTrackerOpen, tableNumber } = useCart();

  if (totalItems === 0 || isCartOpen || isTrackerOpen) {
    return null;
  }

  return (
    <aside aria-label="Order summary" className="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-lg mx-auto pointer-events-none animate-slide-up">
      <button
        onClick={() => setIsCartOpen(true)}
        className="w-full pointer-events-auto flex items-center justify-between p-3.5 sm:p-4 bg-[#241713] text-[#F7F2EA] rounded-2xl shadow-xl shadow-black/30 border border-[#C6A46C]/40 hover:bg-[#493126] transition-all group"
      >
        {/* Left side: items count & table */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-[#493126] border border-[#C6A46C]/40 text-[#C6A46C] flex items-center justify-center font-bold text-sm shadow">
            <ShoppingBag className="w-5 h-5 text-[#C6A46C]" />
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-[#C6A46C] text-[#241713] text-[11px] font-black rounded-full flex items-center justify-center border border-[#241713]">
              {totalItems}
            </span>
          </div>
          <div className="text-left">
            <p className="text-xs text-[#B8A99A]">Table {tableNumber}</p>
            <p className="text-sm font-bold text-[#F7F2EA]">
              {totalItems} {totalItems === 1 ? "item" : "items"} added
            </p>
          </div>
        </div>

        {/* Right side: total price & call to action */}
        <div className="flex items-center gap-2.5">
          <span className="text-base font-serif font-bold text-[#F7F2EA] tracking-wide">
            ₹{total}
          </span>
          <div className="flex items-center gap-1.5 bg-[#C6A46C] text-[#241713] px-3.5 py-1.5 rounded-xl text-xs font-bold shadow group-hover:translate-x-0.5 transition-transform">
            <span>View Order</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#241713]" />
          </div>
        </div>
      </button>
    </aside>
  );
}

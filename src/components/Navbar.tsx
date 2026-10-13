"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Coffee, ShoppingBag, Clock, Edit2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { totalItems, tableNumber, setTableNumber, setIsCartOpen, activeOrder, setIsTrackerOpen } = useCart();
  const [isEditingTable, setIsEditingTable] = useState(false);
  const [tempTable, setTempTable] = useState(tableNumber);

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempTable.trim()) {
      setTableNumber(tempTable.trim());
      setIsEditingTable(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#241713] text-[#F7F2EA] border-b border-[#493126]/60 shadow-md px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#493126] border border-[#C6A46C]/40 text-[#C6A46C] flex items-center justify-center shadow group-hover:scale-105 transition-transform">
            <Coffee className="w-5 h-5 text-[#C6A46C]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif tracking-widest font-bold text-lg text-[#F7F2EA] block leading-none">
                QALLMI
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6A46C]" />
            </div>
            <span className="text-[10px] tracking-widest uppercase font-medium text-[#B8A99A] block mt-0.5">
              Artisanal Roastery & Kitchen
            </span>
          </div>
        </Link>

        {/* Center: Table Badge & Live Order Status */}
        <div className="flex items-center gap-2">
          {isEditingTable ? (
            <form onSubmit={handleTableSubmit} className="flex items-center gap-1">
              <input
                type="text"
                value={tempTable}
                onChange={(e) => setTempTable(e.target.value)}
                maxLength={3}
                placeholder="Table #"
                className="w-16 px-2 py-1 text-xs font-bold bg-[#493126] border border-[#C6A46C] rounded-lg text-center text-[#F7F2EA] focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs bg-[#C6A46C] text-[#241713] rounded-lg font-bold hover:bg-[#d8b880] transition-colors"
              >
                Set
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setTempTable(tableNumber);
                setIsEditingTable(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#493126]/70 border border-[#C6A46C]/40 rounded-full text-xs font-semibold text-[#F7F2EA] hover:border-[#C6A46C] transition-colors shadow-xs"
              title="Click to switch table number"
            >
              <span className="w-2 h-2 rounded-full bg-[#C6A46C] animate-pulse" />
              <span>Table {tableNumber}</span>
              <Edit2 className="w-3 h-3 text-[#B8A99A]" />
            </button>
          )}

          {/* Active order badge if any */}
          {activeOrder && activeOrder.status !== "completed" && (
            <button
              onClick={() => setIsTrackerOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#493126] text-[#C6A46C] border border-[#C6A46C]/40 rounded-full text-xs font-medium hover:border-[#C6A46C] transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-[#C6A46C] animate-spin" style={{ animationDuration: "3s" }} />
              <span className="capitalize">{activeOrder.status}</span>
            </button>
          )}
        </div>

        {/* Right: Staff Dashboard & Shopping Cart */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin"
            className="text-xs font-medium text-[#B8A99A] hover:text-[#C6A46C] px-2 py-1 rounded-lg hover:bg-white/5 transition-colors hidden md:block"
          >
            Staff Terminal
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            aria-label="Shopping Cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#493126] hover:bg-[#5b3e31] border border-[#C6A46C]/40 text-[#F7F2EA] shadow-md transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-[#C6A46C]" />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-[#C6A46C] text-[#241713] text-[11px] font-black rounded-full flex items-center justify-center border-2 border-[#241713] shadow animate-fade-in">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

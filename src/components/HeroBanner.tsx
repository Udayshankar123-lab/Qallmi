"use client";

import React from "react";
import { Search, Sparkles, X, Coffee, Leaf, ShieldAlert } from "lucide-react";
import { DietaryType } from "@/types/cafe";

interface HeroBannerProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dietaryFilter: DietaryType | "all";
  setDietaryFilter: (filter: DietaryType | "all") => void;
  tableNumber: string;
}

export default function HeroBanner({
  searchQuery,
  setSearchQuery,
  dietaryFilter,
  setDietaryFilter,
  tableNumber,
}: HeroBannerProps) {
  return (
    <div className="px-4 pt-4 pb-2 max-w-4xl mx-auto">
      {/* Editorial Cream & Espresso Hero Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#241713] text-[#F7F2EA] p-6 sm:p-7 shadow-sm border border-[#493126]">
        {/* Subtle Decorative Ambient Gold Radial Glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#C6A46C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            {/* Table Badge with Champagne Gold Accent */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#493126]/80 border border-[#C6A46C]/40 text-[11px] font-medium tracking-wider text-[#C6A46C] mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C6A46C]" />
              <span>Table {tableNumber} • Digital Dine-in</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#F7F2EA] mb-2 leading-tight">
              Tea, Coffee & Fast Food Kitchen
            </h1>
            <p className="text-xs sm:text-sm text-[#B8A99A] max-w-lg leading-relaxed">
              Fresh tea, hot coffee, crispy gobi, fried rice, noodles and tasty snacks. Browse menu, order directly for your table, and pay at the counter.
            </p>
          </div>

          <div className="hidden md:flex flex-col gap-1.5 self-start bg-[#493126]/50 border border-[#C6A46C]/30 px-4 py-2.5 rounded-xl text-xs text-[#F7F2EA]">
            <div className="flex items-center gap-2 text-[#C6A46C] font-serif font-semibold">
              <Coffee className="w-4 h-4" />
              <span>Tea, Coffee & Snacks</span>
            </div>
            <span className="text-[11px] text-[#B8A99A]">Freshly Prepared • Pay at Counter</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mt-5">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-[#B8A99A]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tea, coffee, gobi, fried rice, noodles, snacks..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#FFFFFF] text-[#241713] rounded-xl text-sm placeholder-[#B8A99A] focus:outline-none focus:ring-1 focus:ring-[#C6A46C] shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 p-1 rounded-full text-[#B8A99A] hover:text-[#241713]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dietary Filter Buttons */}
      <div className="flex items-center gap-2 mt-3.5 overflow-x-auto no-scrollbar py-1 text-xs">
        <span className="text-[#B8A99A] font-semibold text-[11px] uppercase tracking-wider mr-1">
          Dietary:
        </span>

        {/* All Items */}
        <button
          onClick={() => setDietaryFilter("all")}
          className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
            dietaryFilter === "all"
              ? "bg-[#241713] text-[#F7F2EA] shadow-xs"
              : "bg-[#FFFFFF] text-[#493126] border border-[#B8A99A]/40 hover:border-[#493126]"
          }`}
        >
          All Items
        </button>

        {/* Pure Veg */}
        <button
          onClick={() => setDietaryFilter("veg")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all ${
            dietaryFilter === "veg"
              ? "bg-[#241713] text-[#F7F2EA] shadow-xs ring-1 ring-[#C6A46C]"
              : "bg-[#FFFFFF] text-[#493126] border border-[#B8A99A]/40 hover:border-[#493126]"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>Vegetarian</span>
        </button>

        {/* Vegan */}
        <button
          onClick={() => setDietaryFilter("vegan")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all ${
            dietaryFilter === "vegan"
              ? "bg-[#241713] text-[#F7F2EA] shadow-xs ring-1 ring-[#C6A46C]"
              : "bg-[#FFFFFF] text-[#493126] border border-[#B8A99A]/40 hover:border-[#493126]"
          }`}
        >
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>Vegan</span>
        </button>

        {/* Non-Veg */}
        <button
          onClick={() => setDietaryFilter("non-veg")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium transition-all ${
            dietaryFilter === "non-veg"
              ? "bg-[#241713] text-[#F7F2EA] shadow-xs ring-1 ring-[#C6A46C]"
              : "bg-[#FFFFFF] text-[#493126] border border-[#B8A99A]/40 hover:border-[#493126]"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-600" />
          <span>Non-Veg</span>
        </button>
      </div>
    </div>
  );
}

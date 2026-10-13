"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MenuItem, Category, DietaryType } from "@/types/cafe";
import { INITIAL_CATEGORIES } from "@/lib/initialData";
import { CartProvider, useCart } from "@/context/CartContext";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import CategoryChips from "@/components/CategoryChips";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import StickyCartBar from "@/components/StickyCartBar";
import CartDrawer from "@/components/CartDrawer";
import OrderTrackerModal from "@/components/OrderTrackerModal";
import { Sparkles, Wifi, Clock, MapPin, Coffee, Flame, Heart } from "lucide-react";

function CafeMainView() {
  const { tableNumber } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<DietaryType | "all">("all");
  const [activeDetailItem, setActiveDetailItem] = useState<MenuItem | null>(null);

  // Fetch live menu from API
  useEffect(() => {
    async function loadMenu() {
      try {
        const res = await fetch("/api/menu");
        const data = await res.json();
        if (data.success && data.items) {
          setMenuItems(data.items);
        }
      } catch (err) {
        console.error("Failed to fetch menu:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, []);

  // Compute item counts per category
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = { all: menuItems.length };
    menuItems.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [menuItems]);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (dietaryFilter !== "all" && item.dietary !== dietaryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [menuItems, selectedCategory, dietaryFilter, searchQuery]);

  // Featured items list
  const featuredItems = useMemo(() => {
    return menuItems.filter((item) => item.isFeatured && item.isAvailable);
  }, [menuItems]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F2EA] relative overflow-hidden pb-24">
      {/* Subtle Warm Tone Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C6A46C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#B8A99A]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <Navbar />

      {/* Hero Atmosphere & Search */}
      <HeroBanner
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dietaryFilter={dietaryFilter}
        setDietaryFilter={setDietaryFilter}
        tableNumber={tableNumber}
      />

      {/* Category Pills Bar */}
      <CategoryChips
        categories={INITIAL_CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        itemCounts={itemCounts}
      />

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-6 w-full flex-grow relative z-10">
        {/* Featured Section (when no search active and 'all' category) */}
        {!searchQuery && selectedCategory === "all" && dietaryFilter === "all" && (
          <section className="mb-9">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#241713] flex items-center justify-center text-[#C6A46C] shadow-xs">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif font-black text-lg sm:text-xl text-[#241713] leading-tight">
                    Chef & Barista Signatures
                  </h2>
                  <p className="text-[11px] text-[#B8A99A] font-medium">Handcrafted daily specialties you can&apos;t miss</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-[#C6A46C]/15 text-[#241713] rounded-full border border-[#C6A46C]/40 shadow-2xs">
                🌟 Hot Picks
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
              {featuredItems.slice(0, 4).map((item) => (
                <ProductCard
                  key={`feat-${item.id}`}
                  item={item}
                  onOpenDetails={setActiveDetailItem}
                />
              ))}
            </div>
          </section>
        )}

        {/* Regular Menu Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-6 rounded-full bg-[#C6A46C]" />
              <h2 className="font-serif font-black text-lg sm:text-xl text-[#241713]">
                {selectedCategory === "all"
                  ? "Full Artisanal Catalog"
                  : INITIAL_CATEGORIES.find((c) => c.id === selectedCategory)?.name || "Menu"}
              </h2>
            </div>
            <span className="text-xs font-bold text-[#B8A99A] bg-[#FFFFFF] px-2.5 py-1 rounded-full border border-[#B8A99A]/30 shadow-2xs">
              {filteredItems.length} {filteredItems.length === 1 ? "dish" : "dishes"}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-[#FFFFFF]/80 animate-pulse rounded-3xl border border-[#B8A99A]/20 shadow-xs"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center bg-[#FFFFFF] rounded-3xl border border-[#B8A99A]/30 p-6 shadow-sm">
              <Coffee className="w-12 h-12 text-[#C6A46C] mx-auto mb-2.5 animate-bounce" />
              <h3 className="font-serif font-bold text-base text-[#241713]">
                No matching dishes found
              </h3>
              <p className="text-xs text-[#B8A99A] mt-1">
                Try searching for something else or reset your dietary filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDietaryFilter("all");
                  setSelectedCategory("all");
                }}
                className="mt-4 px-5 py-2.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl text-xs font-black shadow-md transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
              {filteredItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onOpenDetails={setActiveDetailItem}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Customer Website Footer: Deep Espresso with Warm Ivory Text & Gold Accents */}
      <footer className="mt-14 border-t border-[#493126]/30 bg-[#241713] px-4 py-8 text-center text-xs text-[#F7F2EA] relative z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#F7F2EA] font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#493126] text-[#C6A46C] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </span>
              <span>Qallmi Roastery & Kitchen, 12 Indiranagar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#493126] text-[#C6A46C] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </span>
              <span>Open Daily: 8:00 AM – 11:00 PM</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#493126] text-[#C6A46C] flex items-center justify-center">
                <Wifi className="w-4 h-4" />
              </span>
              <span>Free Guest Wi-Fi: Qallmi_Guest</span>
            </div>
          </div>
          <p className="text-[11px] text-[#B8A99A] font-medium">
            © {new Date().getFullYear()} Qallmi Cafe. Digital Dine-in QR Ordering System • Pay at Counter. All taxes included as applicable.
          </p>
        </div>
      </footer>

      {/* Floating Bottom Cart Bar */}
      <StickyCartBar />

      {/* Modals & Drawers */}
      <ProductDetailModal
        item={activeDetailItem}
        onClose={() => setActiveDetailItem(null)}
      />
      <CartDrawer />
      <OrderTrackerModal />
    </div>
  );
}

export default function HomePage() {
  return (
    <CartProvider>
      <CafeMainView />
    </CartProvider>
  );
}

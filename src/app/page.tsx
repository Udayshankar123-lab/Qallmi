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
import { Sparkles, Wifi, Clock, MapPin, Coffee, Flame, Heart, Phone, QrCode, X } from "lucide-react";

function Instagram({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function CafeMainView() {
  const { tableNumber } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<DietaryType | "all">("all");
  const [activeDetailItem, setActiveDetailItem] = useState<MenuItem | null>(null);
  const [isInstaQrOpen, setIsInstaQrOpen] = useState(false);

  // Fetch live menu and categories from API
  useEffect(() => {
    async function loadData() {
      try {
        const [menuRes, catRes] = await Promise.all([
          fetch("/api/menu"),
          fetch("/api/categories"),
        ]);
        const menuData = await menuRes.json();
        const catData = await catRes.json();

        if (menuData.success && menuData.items) {
          setMenuItems(menuData.items);
        }
        if (catData.success && catData.categories && catData.categories.length > 0) {
          setCategories(catData.categories);
        }
      } catch (err) {
        console.error("Failed to fetch menu data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
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
        categories={categories}
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
                    Cafe Specials & Favorites
                  </h2>
                  <p className="text-[11px] text-[#B8A99A] font-medium">Freshly prepared hot tea, coffee & snacks</p>
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
                  ? "Full Cafe Menu"
                  : categories.find((c) => c.id === selectedCategory)?.name || "Menu"}
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
      <footer className="mt-14 border-t border-[#493126]/30 bg-[#241713] px-4 py-10 text-center text-xs text-[#F7F2EA] relative z-10">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Cafe Name & Tagline */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#C6A46C]" />
              <h3 className="font-serif font-black tracking-widest text-lg text-[#F7F2EA]">
                QALBI CAFE
              </h3>
              <span className="w-2 h-2 rounded-full bg-[#C6A46C]" />
            </div>
            <p className="text-xs text-[#B8A99A]">
              Tea, Coffee, Snacks & Fast Food Kitchen
            </p>
          </div>

          {/* Quick Contact & Details Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
            {/* Reservations */}
            <div className="bg-[#493126]/40 border border-[#C6A46C]/30 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 text-[#C6A46C] font-bold text-xs mb-1">
                <Phone className="w-4 h-4" />
                <span>Reservations</span>
              </div>
              <a
                href="tel:+917411833084"
                className="font-serif font-bold text-sm text-[#F7F2EA] hover:text-[#C6A46C] block transition-colors"
              >
                +91 74118 33084
              </a>
              <p className="text-[11px] text-[#B8A99A] mt-0.5">Call to book a table</p>
            </div>

            {/* Instagram Profile */}
            <div className="bg-[#493126]/40 border border-[#C6A46C]/30 p-3.5 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-[#C6A46C] font-bold text-xs mb-1">
                  <div className="flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-[#C6A46C]" />
                    <span>Instagram</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInstaQrOpen(true)}
                    className="p-1 hover:bg-[#C6A46C]/20 rounded-lg text-[#C6A46C] text-[10px] flex items-center gap-1 transition-colors"
                    title="View Instagram QR"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>
                </div>
                <a
                  href="https://www.instagram.com/qalbicafe26/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-serif font-bold text-sm text-[#F7F2EA] hover:text-[#C6A46C] block transition-colors"
                >
                  @QALBICAFE26
                </a>
                <p className="text-[11px] text-[#B8A99A] mt-0.5">Follow for daily specials</p>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <a
                  href="https://www.instagram.com/qalbicafe26/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#C6A46C] hover:text-[#F7F2EA] font-semibold transition-colors flex items-center gap-1"
                >
                  Follow on Instagram →
                </a>
              </div>
            </div>

            {/* Timings */}
            <div className="bg-[#493126]/40 border border-[#C6A46C]/30 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 text-[#C6A46C] font-bold text-xs mb-1">
                <Clock className="w-4 h-4" />
                <span>Opening Hours</span>
              </div>
              <p className="font-serif font-bold text-sm text-[#F7F2EA]">Open Daily</p>
              <p className="text-xs text-[#B8A99A]">2:00 PM – 12:00 AM</p>
            </div>

            {/* Guest Wi-Fi */}
            <div className="bg-[#493126]/40 border border-[#C6A46C]/30 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 text-[#C6A46C] font-bold text-xs mb-1">
                <Wifi className="w-4 h-4" />
                <span>Free Guest Wi-Fi</span>
              </div>
              <p className="font-serif font-bold text-sm text-[#F7F2EA]">QALBI_Guest</p>
              <p className="text-xs text-[#B8A99A]">High-speed internet</p>
            </div>
          </div>

          {/* Full Location Address */}
          <div className="p-4 bg-[#493126]/20 border border-[#B8A99A]/20 rounded-2xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#493126] text-[#C6A46C] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#C6A46C] tracking-wider block">Cafe Location</span>
                <p className="text-xs text-[#F7F2EA] font-medium leading-relaxed">
                  Kannan nagar, bus stop, opposite Bijapur, Bammanajogi, Vijayapura, Karnataka 586109
                </p>
              </div>
            </div>
            <a
              href="https://maps.app.goo.gl/yw9grk3i39XkVe9z7"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-[#C6A46C] hover:bg-[#d8b880] text-[#241713] rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0"
            >
              Open in Maps
            </a>
          </div>
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

      {/* Instagram QR Popup Modal */}
      {isInstaQrOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl border border-[#B8A99A]/30 relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsInstaQrOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F5F3EF] hover:bg-[#E5E2DC] flex items-center justify-center text-[#493126] transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Instagram className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-black text-lg text-[#241713]">
              QALBI Cafe on Instagram
            </h3>
            <p className="text-xs text-[#B8A99A] font-semibold mt-0.5">
              @QALBICAFE26
            </p>

            <div className="my-4 p-2.5 bg-white rounded-2xl border-2 border-[#241713]/10 shadow-inner flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/instagram-qr.png"
                alt="Instagram QR Code @QALBICAFE26"
                className="w-56 h-56 object-contain rounded-xl"
              />
            </div>

            <p className="text-xs text-[#493126] font-medium mb-4">
              Scan with camera or tap below to open our Instagram profile.
            </p>

            <a
              href="https://www.instagram.com/qalbicafe26/"
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Instagram className="w-4 h-4 text-[#C6A46C]" />
              <span>Open @QALBICAFE26</span>
            </a>
          </div>
        </div>
      )}
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

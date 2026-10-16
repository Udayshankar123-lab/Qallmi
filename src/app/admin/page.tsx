"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { createSecureTableUrl } from "@/lib/tableSecurity";
import {
  Coffee,
  ShoppingBag,
  UtensilsCrossed,
  QrCode,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  ChefHat,
  Bell,
  RefreshCw,
  ExternalLink,
  Check,
  ArrowLeft,
  Sparkles,
  Flame,
  TrendingUp,
  Printer,
  Download,
  Wifi,
  Camera,
  Upload,
  FolderPlus,
  Lock,
  Unlock,
  LogOut,
  KeyRound,
  Layers,
  AlertTriangle,
  X,
  Phone,
  MapPin,
} from "lucide-react";
import { MenuItem, Order, OrderStatus, PaymentStatus, DietaryType, Category } from "@/types/cafe";
import { INITIAL_CATEGORIES } from "@/lib/initialData";

export default function AdminDashboardPage() {
  // Staff Security Authentication (PIN protected terminal)
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "qr" | "analytics">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("active");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAddingCategoryInline, setIsAddingCategoryInline] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState("");
  const [imageCompressing, setImageCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [qrBaseUrl, setQrBaseUrl] = useState("https://qalbicafe.vercel.app");
  const [qrTableCount, setQrTableCount] = useState(8);
  const [selectedBillOrder, setSelectedBillOrder] = useState<Order | null>(null);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "coffee",
    price: "",
    description: "",
    imageUrl: "",
    dietary: "veg" as DietaryType,
    isFeatured: false,
  });

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (data.success && data.items) {
        setMenuItems(data.items);
      }
    } catch (err) {
      console.error("Error fetching menu:", err);
    } finally {
      setLoadingMenu(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (data.success && data.categories && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  useEffect(() => {
    // Check staff authentication session
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("qalbi_staff_auth");
      setIsStaffAuthenticated(auth === "true");

      const origin = window.location.origin;
      if (!origin.includes("localhost")) {
        setQrBaseUrl(origin);
      }
    }

    fetchOrders();
    fetchMenu();
    fetchCategories();

    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (newStatus === "completed") {
          const completedOrd = orders.find((o) => o.id === orderId);
          if (completedOrd) {
            setSelectedBillOrder({ ...completedOrd, status: "completed" });
          }
        }
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const handleTogglePaymentStatus = async (orderId: string, newPaymentStatus: PaymentStatus) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, paymentStatus: newPaymentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: newPaymentStatus } : o))
        );
      }
    } catch (err) {
      console.error("Failed to update payment status:", err);
    }
  };

  const handleToggleAvailability = async (itemId: string, current: boolean) => {
    try {
      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, isAvailable: !current }),
      });
      const data = await res.json();
      if (data.success) {
        setMenuItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, isAvailable: !current } : i))
        );
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch(`/api/menu?id=${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMenuItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handlePinSubmit = (e?: React.FormEvent, customPin?: string) => {
    if (e) e.preventDefault();
    const pin = customPin !== undefined ? customPin : pinInput;
    // Default PIN: 1234 or Farhan's contact prefix 7411
    if (pin === "1234" || pin === "7411") {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("qalbi_staff_auth", "true");
      }
      setIsStaffAuthenticated(true);
      setPinError(false);
      setPinInput("");
    } else {
      setPinError(true);
      setPinInput("");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("qalbi_staff_auth");
    }
    setIsStaffAuthenticated(false);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
          setNewItem((prev) => ({ ...prev, imageUrl: compressedDataUrl }));
        }
        setImageCompressing(false);
      };
      img.onerror = () => setImageCompressing(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setImageCompressing(false);
    reader.readAsDataURL(file);
  };

  const handleAddCategory = async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategories((prev) => [...prev, data.category]);
        setNewItem((prev) => ({ ...prev, category: data.category.id }));
        setNewCategoryName("");
        setInlineCategoryName("");
        setIsAddingCategoryInline(false);
      }
    } catch (err) {
      console.error("Failed to add category:", err);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (catId === "all") return;
    if (!confirm("Delete this category? Items in this category will remain, but the filter will be removed.")) return;
    try {
      const res = await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: catId }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.id !== catId));
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  const handleClearAllItems = async () => {
    if (!confirm("Are you sure you want to clear all sample menu items? This will allow you to build your own real cafe menu from scratch.")) return;
    try {
      const res = await fetch("/api/menu?action=clear_all", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setMenuItems([]);
      }
    } catch (err) {
      console.error("Failed to clear items:", err);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;

    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItem,
          imageUrl: newItem.imageUrl || "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
          price: Number(newItem.price),
          isAvailable: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setMenuItems((prev) => [data.item, ...prev]);
        setIsAddModalOpen(false);
        setNewItem({
          name: "",
          category: categories.find((c) => c.id !== "all")?.id || "coffee",
          price: "",
          description: "",
          imageUrl: "",
          dietary: "veg",
          isFeatured: false,
        });
      }
    } catch (err) {
      console.error("Failed to add menu item:", err);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter === "active") {
        return o.status === "received" || o.status === "preparing" || o.status === "ready";
      }
      if (orderStatusFilter === "all") return true;
      return o.status === orderStatusFilter;
    });
  }, [orders, orderStatusFilter]);

  const analytics = useMemo(() => {
    const totalRev = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);

    const activeCount = orders.filter(
      (o) => o.status === "received" || o.status === "preparing" || o.status === "ready"
    ).length;

    const completedCount = orders.filter((o) => o.status === "completed").length;

    const aov = orders.length > 0 ? Math.round(totalRev / orders.length) : 0;

    return { totalRev, activeCount, completedCount, aov };
  }, [orders]);

  // If staff is not authenticated, show Staff Security PIN Pad
  if (isStaffAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex flex-col items-center justify-center p-4 text-[#241713]">
        <div className="w-full max-w-sm bg-[#FFFFFF] rounded-3xl p-7 shadow-xl border border-[#B8A99A]/30 text-center space-y-5 animate-slide-up">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#241713] text-[#C6A46C] flex items-center justify-center shadow-md mb-2.5">
              <Lock className="w-7 h-7 text-[#C6A46C]" />
            </div>
            <h1 className="font-serif font-black text-2xl text-[#241713] tracking-wider">
              QALBI CAFE
            </h1>
            <p className="text-xs text-[#B8A99A] font-semibold uppercase tracking-wider mt-0.5">
              Staff & Kitchen Terminal
            </p>
          </div>

          <div className="bg-[#F5F3EF] p-3 rounded-2xl border border-[#B8A99A]/20 text-xs text-[#493126]">
            <p className="font-bold text-[#241713]">Restricted Staff Access</p>
            <p className="text-[11px] text-[#B8A99A] mt-0.5">
              Authorized Counter & Kitchen Terminal
            </p>
          </div>

          {/* PIN Input & Dots */}
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#493126] mb-2">
                Enter 4-Digit Staff PIN
              </label>
              <div className="flex justify-center gap-3 mb-3">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pinInput.length > idx
                        ? "bg-[#241713] border-[#241713] scale-110"
                        : "border-[#B8A99A]/60 bg-white"
                    }`}
                  />
                ))}
              </div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setPinInput(val);
                  if (val.length === 4) {
                    handlePinSubmit(undefined, val);
                  }
                }}
                placeholder="• • • •"
                className="w-full text-center text-xl tracking-[0.5em] font-mono py-2.5 px-4 bg-[#F5F3EF] border border-[#B8A99A]/40 rounded-2xl text-[#241713] focus:outline-none focus:ring-2 focus:ring-[#C6A46C]"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-600 font-bold mt-1.5 animate-pulse">
                  Incorrect PIN. Please try again.
                </p>
              )}
            </div>

            {/* On-screen Keypad for Mobile Staff */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => {
                    if (pinInput.length < 4) {
                      const updated = pinInput + digit;
                      setPinInput(updated);
                      if (updated.length === 4) {
                        handlePinSubmit(undefined, updated);
                      }
                    }
                  }}
                  className="py-3 bg-[#F5F3EF] hover:bg-[#E5E2DC] active:bg-[#C6A46C]/30 text-[#241713] font-bold text-base rounded-2xl transition-all"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPinInput("")}
                className="py-3 bg-[#F5F3EF] hover:bg-[#E5E2DC] text-rose-700 font-bold text-xs rounded-2xl transition-all"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pinInput.length < 4) {
                    const updated = pinInput + "0";
                    setPinInput(updated);
                    if (updated.length === 4) {
                      handlePinSubmit(undefined, updated);
                    }
                  }
                }}
                className="py-3 bg-[#F5F3EF] hover:bg-[#E5E2DC] text-[#241713] font-bold text-base rounded-2xl transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => setPinInput((p) => p.slice(0, -1))}
                className="py-3 bg-[#F5F3EF] hover:bg-[#E5E2DC] text-[#493126] font-bold text-xs rounded-2xl transition-all"
              >
                ⌫
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-98"
            >
              Unlock Terminal
            </button>
          </form>

          <div className="pt-2 border-t border-[#F5F3EF] flex items-center justify-center text-[11px] text-[#B8A99A]">
            <span className="text-[10px] bg-[#C6A46C]/20 text-[#493126] px-3 py-1 rounded-full font-bold">
              Default PIN: 1234
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex flex-col font-sans">
      {/* Deep Espresso Header */}
      <header className="bg-[#241713] text-[#F7F2EA] border-b border-[#493126]/40 px-4 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#493126] border border-[#C6A46C]/40 flex items-center justify-center font-serif font-black text-[#C6A46C] shadow-xs">
              Q
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif font-black text-base tracking-wider leading-none text-[#F7F2EA]">
                  QALBI
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C6A46C]" />
              </div>
              <span className="text-[10px] text-[#C6A46C] font-bold uppercase tracking-wider block mt-0.5">
                Staff & Kitchen Terminal
              </span>
            </div>
          </div>

          {/* Tab switcher: Active is Rich Coffee #493126 with Gold accent */}
          <div className="flex items-center gap-1.5 bg-[#493126]/30 p-1 rounded-2xl border border-[#C6A46C]/20 text-xs font-bold">
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === "orders"
                  ? "bg-[#493126] text-[#F7F2EA] shadow-md border border-[#C6A46C]/30"
                  : "text-[#B8A99A] hover:text-[#F7F2EA]"
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-[#C6A46C]" />
              <span className="hidden sm:inline">Orders</span>
              {analytics.activeCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#C6A46C] text-[#241713] text-[10px] font-black flex items-center justify-center animate-pulse">
                  {analytics.activeCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("menu")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === "menu"
                  ? "bg-[#493126] text-[#F7F2EA] shadow-md border border-[#C6A46C]/30"
                  : "text-[#B8A99A] hover:text-[#F7F2EA]"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#C6A46C]" />
              <span>Menu</span>
            </button>

            <button
              onClick={() => setActiveTab("qr")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === "qr"
                  ? "bg-[#493126] text-[#F7F2EA] shadow-md border border-[#C6A46C]/30"
                  : "text-[#B8A99A] hover:text-[#F7F2EA]"
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-[#C6A46C]" />
              <span className="hidden sm:inline">Table QRs</span>
            </button>

            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === "analytics"
                  ? "bg-[#493126] text-[#F7F2EA] shadow-md border border-[#C6A46C]/30"
                  : "text-[#B8A99A] hover:text-[#F7F2EA]"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-[#C6A46C]" />
              <span className="hidden md:inline">Analytics</span>
            </button>

            {/* Lock / Logout Terminal Button */}
            <button
              onClick={handleLogout}
              className="px-2.5 py-1.5 rounded-xl bg-[#493126]/60 hover:bg-[#493126] text-[#C6A46C] hover:text-[#F7F2EA] flex items-center gap-1 transition-colors ml-1"
              title="Lock Staff Terminal"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-grow">
        {/* ================= TAB 1: KITCHEN ORDERS FEED ================= */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Orders Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] p-4.5 rounded-3xl border border-[#B8A99A]/30 shadow-xs">
              <div>
                <h2 className="font-serif font-black text-xl text-[#241713]">
                  Live Kitchen Orders Feed
                </h2>
                <p className="text-xs text-[#B8A99A] font-medium">
                  Auto-syncing every 5s • Dine-in Table Ordering
                </p>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
                {[
                  { id: "active", label: "Active Queue" },
                  { id: "received", label: "Received" },
                  { id: "preparing", label: "Brewing" },
                  { id: "ready", label: "Ready" },
                  { id: "completed", label: "Completed" },
                  { id: "all", label: "All" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setOrderStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      orderStatusFilter === st.id
                        ? "bg-[#493126] text-[#F7F2EA] shadow-xs"
                        : "bg-[#F5F3EF] text-[#241713] hover:bg-[#B8A99A]/20"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
                <button
                  onClick={fetchOrders}
                  className="p-2 bg-[#F5F3EF] hover:bg-[#B8A99A]/20 rounded-xl text-[#241713] transition-colors"
                  title="Refresh orders now"
                >
                  <RefreshCw className="w-4 h-4 text-[#C6A46C]" />
                </button>
              </div>
            </div>

            {/* Orders Grid / Cards */}
            {loadingOrders ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-64 bg-[#FFFFFF] animate-pulse rounded-3xl border border-[#B8A99A]/20" />
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-16 text-center bg-[#FFFFFF] rounded-3xl border border-[#B8A99A]/30 p-6 shadow-xs">
                <ChefHat className="w-12 h-12 text-[#C6A46C] mx-auto mb-2 animate-bounce" />
                <h3 className="font-serif font-black text-base text-[#241713]">
                  No orders in this queue
                </h3>
                <p className="text-xs text-[#B8A99A] mt-1">
                  Orders placed by customers via table QR codes will appear here instantly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => {
                  const isReceived = order.status === "received";
                  const isPreparing = order.status === "preparing";
                  const isReady = order.status === "ready";
                  const isCompleted = order.status === "completed";

                  return (
                    <div
                      key={order.id}
                      className={`flex flex-col justify-between bg-[#FFFFFF] rounded-3xl border-2 transition-all p-4.5 shadow-xs ${
                        isReceived
                          ? "border-[#C6A46C] ring-4 ring-[#C6A46C]/10"
                          : isPreparing
                          ? "border-[#493126] ring-4 ring-[#493126]/10"
                          : isReady
                          ? "border-[#241713] ring-4 ring-[#241713]/10"
                          : "border-[#B8A99A]/30 opacity-80"
                      }`}
                    >
                      {/* Top Bar: Table & Status */}
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-[#F5F3EF]">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-[#241713] text-[#F7F2EA] rounded-xl font-serif font-black text-sm shadow-xs">
                              Table {order.tableNumber}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#B8A99A]">
                              #{order.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedBillOrder(order)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F5F3EF] hover:bg-[#E5E2DC] text-[#493126] hover:text-[#241713] transition-colors border border-[#B8A99A]/30 text-[10px] font-bold"
                              title="Print Customer Bill"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#C6A46C]" />
                              <span>Bill</span>
                            </button>

                            {/* Status Badge */}
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ${
                                isReceived
                                  ? "bg-[#C6A46C]/20 text-[#241713] animate-pulse border border-[#C6A46C]"
                                  : isPreparing
                                  ? "bg-[#493126]/15 text-[#493126] border border-[#493126]/30"
                                  : isReady
                                  ? "bg-[#241713] text-[#F7F2EA] border border-[#241713]"
                                  : "bg-[#F5F3EF] text-[#B8A99A] border border-[#B8A99A]/30"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Order info & Timestamp (NO GUEST NAME) */}
                        <div className="flex items-center justify-between text-[11px] text-[#B8A99A] py-2">
                          <span className="font-bold text-[#493126]">
                            Dine-in • Table {order.tableNumber}
                          </span>
                          <span className="font-semibold text-[#B8A99A]">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {/* Special instructions banner */}
                        {order.specialInstructions && (
                          <div className="p-2.5 mb-2 bg-[#F5F3EF] border border-[#B8A99A]/30 rounded-xl text-xs text-[#241713] font-medium">
                            <span className="font-black text-[#493126]">Note: </span>
                            {order.specialInstructions}
                          </div>
                        )}

                        {/* Items list */}
                        <div className="divide-y divide-[#F5F3EF] text-xs py-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="py-2 flex justify-between items-start">
                              <div>
                                <span className="font-black text-[#493126] mr-2 text-sm">
                                  {item.quantity}×
                                </span>
                                <span className="text-[#241713] font-bold">{item.name}</span>
                                {(item.selectedSize || (item.selectedOptions && Object.keys(item.selectedOptions).length > 0)) && (
                                  <p className="text-[10px] text-[#493126] font-semibold mt-0.5">
                                    {item.selectedSize} {item.selectedOptions && Object.values(item.selectedOptions).join(", ")}
                                  </p>
                                )}
                              </div>
                              <span className="font-mono font-bold text-[#493126]">
                                ₹{item.unitPrice * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bottom Action Footer */}
                      <div className="pt-3 border-t border-[#F5F3EF] mt-2">
                        <div className="flex items-center justify-between text-xs mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-[#493126] bg-[#F5F3EF] px-2.5 py-0.5 rounded-full border border-[#B8A99A]/30">
                              {order.paymentStatus === "paid" ? "✓ Bill Paid" : "Dine-in • Pay at Counter"}
                            </span>
                            {order.paymentStatus !== "paid" ? (
                              <button
                                onClick={() => handleTogglePaymentStatus(order.id, "paid")}
                                className="text-[10px] font-bold text-[#C6A46C] hover:text-[#241713] px-2 py-0.5 rounded bg-[#493126]/10 hover:bg-[#C6A46C]/20 transition-colors"
                                title="Mark bill as collected at counter"
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <button
                                onClick={() => handleTogglePaymentStatus(order.id, "unpaid")}
                                className="text-[10px] font-medium text-[#B8A99A] hover:text-[#493126] px-1.5 py-0.5 transition-colors"
                                title="Undo paid mark if clicked accidentally"
                              >
                                (Undo)
                              </button>
                            )}
                          </div>
                          <span className="font-serif font-black text-base text-[#493126]">
                            ₹{order.total}
                          </span>
                        </div>

                        {/* Primary action buttons: Deep espresso with white text */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {isReceived && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "preparing")}
                              className="col-span-2 py-2.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
                            >
                              <ChefHat className="w-4 h-4 text-[#C6A46C]" />
                              <span>Start Preparing</span>
                            </button>
                          )}

                          {isPreparing && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "ready")}
                              className="col-span-2 py-2.5 bg-[#493126] hover:bg-[#241713] text-[#F7F2EA] font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-md border border-[#C6A46C]/30 transition-all active:scale-98"
                            >
                              <CheckCircle className="w-4 h-4 text-[#C6A46C]" />
                              <span>Mark Ready to Serve</span>
                            </button>
                          )}

                          {isReady && (
                            <button
                              onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                              className="col-span-2 py-2.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
                            >
                              <Check className="w-4 h-4 text-[#C6A46C]" />
                              <span>Complete & Served</span>
                            </button>
                          )}

                          {isCompleted && (
                            <div className="col-span-2 flex items-center gap-2">
                              <button
                                onClick={() => setSelectedBillOrder(order)}
                                className="flex-1 py-2.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] font-black rounded-2xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
                              >
                                <Printer className="w-4 h-4 text-[#C6A46C]" />
                                <span>Print Bill</span>
                              </button>
                              <span className="px-3 py-2 text-xs font-bold text-[#B8A99A] bg-[#F5F3EF] rounded-2xl border border-[#B8A99A]/30">
                                Completed
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MENU & PRICE MANAGEMENT ================= */}
        {activeTab === "menu" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] p-5 rounded-3xl border border-[#B8A99A]/30 shadow-xs">
              <div>
                <h2 className="font-serif font-black text-xl text-[#241713]">
                  Menu & Pricing Catalog
                </h2>
                <p className="text-xs text-[#B8A99A] font-medium">
                  Add custom dishes with mobile gallery photos, manage custom categories, and update prices in real time.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#F5F3EF] hover:bg-[#E5E2DC] text-[#493126] rounded-2xl text-xs font-bold border border-[#B8A99A]/30 transition-all active:scale-98"
                >
                  <Layers className="w-4 h-4 text-[#C6A46C]" />
                  <span>Categories ({categories.filter((c) => c.id !== "all").length})</span>
                </button>

                {menuItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllItems}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl text-xs font-bold border border-rose-200 transition-all active:scale-98"
                    title="Clear sample dishes and start fresh"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Sample Items</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setNewItem({
                      name: "",
                      category: categories.find((c) => c.id !== "all")?.id || "coffee",
                      price: "",
                      description: "",
                      imageUrl: "",
                      dietary: "veg",
                      isFeatured: false,
                    });
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl text-xs font-black shadow-md transition-all active:scale-98"
                >
                  <Plus className="w-4 h-4 text-[#C6A46C]" />
                  <span>Add New Item</span>
                </button>
              </div>
            </div>

            {/* Empty state if staff cleared sample items */}
            {menuItems.length === 0 ? (
              <div className="py-16 text-center bg-[#FFFFFF] rounded-3xl border border-[#B8A99A]/30 p-8 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-[#F5F3EF] flex items-center justify-center text-[#493126] mx-auto mb-3 border border-[#B8A99A]/30">
                  <UtensilsCrossed className="w-8 h-8 text-[#C6A46C]" />
                </div>
                <h3 className="font-serif font-black text-lg text-[#241713]">
                  Your Menu is Ready for QALBI Dishes!
                </h3>
                <p className="text-xs text-[#B8A99A] mt-1 max-w-sm mx-auto">
                  Click &quot;Add New Item&quot; above to add your real cafe dishes. You can pick photos directly from your phone gallery or take a picture with your camera!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewItem({
                      name: "",
                      category: categories.find((c) => c.id !== "all")?.id || "coffee",
                      price: "",
                      description: "",
                      imageUrl: "",
                      dietary: "veg",
                      isFeatured: false,
                    });
                    setIsAddModalOpen(true);
                  }}
                  className="mt-4 px-6 py-3 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl text-xs font-black shadow-md transition-all active:scale-98"
                >
                  + Add First Dish with Photo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-[#FFFFFF] rounded-3xl border border-[#B8A99A]/30 p-4 flex flex-col justify-between shadow-xs transition-all ${
                    !item.isAvailable ? "opacity-60 bg-[#F5F3EF]" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-[#F5F3EF] flex-shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif font-bold text-sm text-[#241713] truncate">
                          {item.name}
                        </h4>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-[#F5F3EF] text-[#493126] border border-[#B8A99A]/20">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#B8A99A] line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                      <div className="mt-2 font-serif font-black text-sm text-[#493126]">
                        ₹{item.price}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F5F3EF] text-xs">
                    <button
                      onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                        item.isAvailable
                          ? "bg-[#493126] text-[#F7F2EA] hover:bg-[#241713] border border-[#C6A46C]/30"
                          : "bg-[#F5F3EF] text-[#B8A99A] hover:bg-[#B8A99A]/20 border border-[#B8A99A]/30"
                      }`}
                    >
                      {item.isAvailable ? "In Stock (Active)" : "Sold Out (86'd)"}
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-[#B8A99A] hover:text-[#241713] rounded-xl hover:bg-[#F5F3EF] transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

        {/* ================= TAB 3: TABLE QR CODES ================= */}
        {activeTab === "qr" && (
          <div className="space-y-6">
            {/* Header with Print Standees Action */}
            <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#B8A99A]/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif font-black text-xl text-[#241713]">
                  Table QR Code Center
                </h2>
                <p className="text-xs text-[#B8A99A] mt-0.5 font-medium">
                  Real, high-resolution scannable QR codes for table-side customer ordering.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href={`/admin/print-qr?baseUrl=${encodeURIComponent(qrBaseUrl)}&count=${qrTableCount}`}
                  target="_blank"
                  className="flex items-center gap-2 px-5 py-3 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4 text-[#C6A46C]" />
                  <span>Print Table Standees</span>
                </Link>
              </div>
            </div>

            {/* Target URL & Table Count Configurator */}
            <div className="bg-[#FFFFFF] p-5 rounded-3xl border border-[#B8A99A]/30 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#493126] mb-1">
                  Base Domain / IP (Encoded in QR):
                </label>
                <input
                  type="text"
                  value={qrBaseUrl}
                  onChange={(e) => setQrBaseUrl(e.target.value)}
                  placeholder="e.g. https://qalbicafe.vercel.app"
                  className="w-full px-3.5 py-2 text-xs font-mono bg-[#F5F3EF] border border-[#B8A99A]/40 rounded-xl text-[#241713] focus:outline-none focus:ring-1 focus:ring-[#C6A46C]"
                />
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setQrBaseUrl("https://qalbicafe.vercel.app")}
                    className="text-[10px] font-bold text-[#493126] hover:text-[#241713] px-2.5 py-1 rounded-lg bg-[#493126]/10 hover:bg-[#C6A46C]/20 transition-colors"
                  >
                    QALBI Live (qalbicafe.vercel.app)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        setQrBaseUrl(window.location.origin);
                      }
                    }}
                    className="text-[10px] font-bold text-[#493126] hover:text-[#241713] px-2.5 py-1 rounded-lg bg-[#493126]/10 hover:bg-[#C6A46C]/20 transition-colors"
                  >
                    Browser Origin
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#493126] mb-1">
                  Active Cafe Tables:
                </label>
                <div className="flex items-center gap-2">
                  {[4, 6, 8, 12, 16].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQrTableCount(cnt)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        qrTableCount === cnt
                          ? "bg-[#241713] text-[#F7F2EA]"
                          : "bg-[#F5F3EF] text-[#493126] hover:bg-[#E5E2DC]"
                      }`}
                    >
                      {cnt} Tables
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#B8A99A] mt-2">
                  Each QR code automatically links to its respective table URL query parameter.
                </p>
              </div>
            </div>

            {/* Grid of Real Scannable Table QR Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: qrTableCount }, (_, i) => (i + 1).toString().padStart(2, "0")).map((num) => {
                const targetUrl = createSecureTableUrl(qrBaseUrl, num);
                const qrSvgUrl = `/api/qr?text=${encodeURIComponent(targetUrl)}&table=${num}&format=svg`;
                const qrPngDownload = `/api/qr?text=${encodeURIComponent(targetUrl)}&table=${num}&format=png&download=true&width=1024`;
                const qrSvgDownload = `/api/qr?text=${encodeURIComponent(targetUrl)}&table=${num}&format=svg&download=true`;

                return (
                  <div
                    key={num}
                    className="bg-[#FFFFFF] rounded-3xl border border-[#B8A99A]/30 p-5 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-all group"
                  >
                    <div className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase text-[#C6A46C] bg-[#241713] tracking-wider">
                      QALBI Cafe
                    </div>
                    <h3 className="font-serif font-black text-xl text-[#241713] my-1.5">
                      Table {num}
                    </h3>

                    {/* Real Scannable QR Code Image */}
                    <div className="relative p-2.5 bg-[#FFFFFF] rounded-2xl border border-[#B8A99A]/30 my-2 shadow-xs group-hover:scale-105 transition-transform duration-300">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrSvgUrl}
                        alt={`QR Code for Table ${num}`}
                        className="w-36 h-36 object-contain"
                      />
                    </div>

                    <p className="text-[11px] text-[#493126] font-semibold mt-1">
                      Scan to Order
                    </p>
                    <p className="text-[9px] text-[#B8A99A] font-mono truncate max-w-full px-2 mt-0.5">
                      {targetUrl}
                    </p>

                    {/* Download & Test Scan Actions */}
                    <div className="w-full pt-3 mt-3 border-t border-[#F5F3EF] flex flex-col gap-1.5 text-xs">
                      <div className="grid grid-cols-2 gap-1.5">
                        <a
                          href={qrPngDownload}
                          download={`qalbi-table-${num}-qr.png`}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-[#F5F3EF] hover:bg-[#E5E2DC] text-[#493126] rounded-xl text-[10px] font-bold transition-colors"
                          title="Download high-resolution PNG for print"
                        >
                          <Download className="w-3 h-3 text-[#C6A46C]" />
                          <span>PNG</span>
                        </a>
                        <a
                          href={qrSvgDownload}
                          download={`qalbi-table-${num}-qr.svg`}
                          className="flex items-center justify-center gap-1 py-1.5 px-2 bg-[#F5F3EF] hover:bg-[#E5E2DC] text-[#493126] rounded-xl text-[10px] font-bold transition-colors"
                          title="Download vector SVG"
                        >
                          <Download className="w-3 h-3 text-[#C6A46C]" />
                          <span>SVG</span>
                        </a>
                      </div>

                      <Link
                        href={targetUrl}
                        target="_blank"
                        className="flex items-center justify-center gap-1 py-1 text-xs font-bold text-[#493126] hover:text-[#241713] transition-colors"
                      >
                        <span>Test Scan in Browser</span>
                        <ExternalLink className="w-3 h-3 text-[#C6A46C]" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 4: REVENUE & SALES ANALYTICS ================= */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="bg-[#FFFFFF] p-4.5 rounded-3xl border border-[#B8A99A]/30 shadow-xs">
              <h2 className="font-serif font-black text-xl text-[#241713]">
                Today&apos;s Cafe Sales & Performance
              </h2>
              <p className="text-xs text-[#B8A99A] mt-0.5 font-medium">
                Live metrics from completed online dine-in transactions.
              </p>
            </div>

            {/* 4 Key Stat Cards in Brand Palette */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              {/* Total Revenue: Deep Espresso */}
              <div className="bg-[#241713] text-[#F7F2EA] p-5 rounded-3xl shadow-sm border border-[#493126] flex flex-col justify-between">
                <span className="text-xs text-[#C6A46C] font-bold uppercase tracking-wider">Total Revenue</span>
                <h3 className="font-serif font-black text-3xl text-[#F7F2EA] mt-1">
                  ₹{analytics.totalRev}
                </h3>
                <span className="text-[10px] text-[#C6A46C] font-semibold mt-2">Dine-in Table Orders</span>
              </div>

              {/* Total Orders: Rich Coffee */}
              <div className="bg-[#493126] text-[#F7F2EA] p-5 rounded-3xl shadow-sm border border-[#C6A46C]/20 flex flex-col justify-between">
                <span className="text-xs text-[#C6A46C] font-bold uppercase tracking-wider">Total Orders</span>
                <h3 className="font-serif font-black text-3xl text-[#F7F2EA] mt-1">
                  {orders.length}
                </h3>
                <span className="text-[10px] text-[#B8A99A] font-semibold mt-2">Across all tables</span>
              </div>

              {/* Active in Kitchen: Pure White with Taupe border */}
              <div className="bg-[#FFFFFF] text-[#241713] p-5 rounded-3xl shadow-xs border border-[#B8A99A]/30 flex flex-col justify-between">
                <span className="text-xs text-[#B8A99A] font-bold uppercase tracking-wider">Kitchen Queue</span>
                <h3 className="font-serif font-black text-3xl text-[#493126] mt-1">
                  {analytics.activeCount}
                </h3>
                <span className="text-[10px] text-[#493126] font-semibold mt-2">Preparing / Ready</span>
              </div>

              {/* Avg Order Value: Pure White with Gold Border */}
              <div className="bg-[#FFFFFF] text-[#241713] p-5 rounded-3xl shadow-xs border border-[#C6A46C]/50 flex flex-col justify-between">
                <span className="text-xs text-[#C6A46C] font-bold uppercase tracking-wider">Avg. Order Value</span>
                <h3 className="font-serif font-black text-3xl text-[#241713] mt-1">
                  ₹{analytics.aov}
                </h3>
                <span className="text-[10px] text-[#B8A99A] font-semibold mt-2">Per table check</span>
              </div>
            </div>

            {/* Charts: Muted gold (#C6A46C), brown (#493126), and neutral shades (#B8A99A) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Sales Distribution Chart */}
              <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#B8A99A]/30 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-black text-base text-[#241713]">
                      Category Sales Distribution
                    </h3>
                    <p className="text-xs text-[#B8A99A]">Share of kitchen orders by menu section</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-[#C6A46C]" />
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between mb-1 font-bold">
                      <span className="text-[#241713]">Specialty Roastery & Coffee</span>
                      <span className="text-[#493126]">48%</span>
                    </div>
                    <div className="w-full h-3 bg-[#F5F3EF] rounded-full overflow-hidden">
                      <div className="h-full bg-[#C6A46C] rounded-full" style={{ width: "48%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 font-bold">
                      <span className="text-[#241713]">Artisanal Bakery & Breakfast</span>
                      <span className="text-[#493126]">26%</span>
                    </div>
                    <div className="w-full h-3 bg-[#F5F3EF] rounded-full overflow-hidden">
                      <div className="h-full bg-[#493126] rounded-full" style={{ width: "26%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 font-bold">
                      <span className="text-[#241713]">Gourmet Mains & Pastas</span>
                      <span className="text-[#493126]">18%</span>
                    </div>
                    <div className="w-full h-3 bg-[#F5F3EF] rounded-full overflow-hidden">
                      <div className="h-full bg-[#241713] rounded-full" style={{ width: "18%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 font-bold">
                      <span className="text-[#241713]">Cold Brews & Refreshers</span>
                      <span className="text-[#493126]">8%</span>
                    </div>
                    <div className="w-full h-3 bg-[#F5F3EF] rounded-full overflow-hidden">
                      <div className="h-full bg-[#B8A99A] rounded-full" style={{ width: "8%" }} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#F5F3EF] text-[11px] text-[#B8A99A]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C6A46C]" /> Gold: Coffee</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#493126]" /> Brown: Bakery</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#241713]" /> Espresso: Mains</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#B8A99A]" /> Taupe: Cold Brews</span>
                </div>
              </div>

              {/* Peak Service Hours Chart */}
              <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#B8A99A]/30 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-black text-base text-[#241713]">
                      Peak Dining & Kitchen Traffic
                    </h3>
                    <p className="text-xs text-[#B8A99A]">Hourly guest activity across dine-in tables</p>
                  </div>
                  <Clock className="w-5 h-5 text-[#493126]" />
                </div>

                <div className="pt-4 flex items-end justify-between h-40 gap-2">
                  {[
                    { hour: "9 AM", height: "35%", color: "bg-[#B8A99A]" },
                    { hour: "11 AM", height: "70%", color: "bg-[#C6A46C]" },
                    { hour: "1 PM", height: "95%", color: "bg-[#493126]" },
                    { hour: "3 PM", height: "50%", color: "bg-[#B8A99A]" },
                    { hour: "5 PM", height: "85%", color: "bg-[#C6A46C]" },
                    { hour: "7 PM", height: "100%", color: "bg-[#241713]" },
                    { hour: "9 PM", height: "60%", color: "bg-[#493126]" },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div
                        className={`w-full rounded-t-xl ${bar.color} transition-all duration-500`}
                        style={{ height: bar.height }}
                      />
                      <span className="text-[10px] font-bold text-[#B8A99A]">{bar.hour}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#F5F3EF] flex justify-between text-[11px] text-[#B8A99A]">
                  <span>Peak Rush: <strong>1:00 PM & 7:00 PM</strong></span>
                  <span>Average Turnaround: <strong>18 mins</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Add New Menu Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241713]/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 shadow-2xl space-y-4 border border-[#B8A99A]/30 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5F3EF]">
              <div>
                <h3 className="font-serif font-black text-lg text-[#241713]">
                  Add New Dish / Beverage
                </h3>
                <p className="text-[11px] text-[#B8A99A]">
                  Upload photo directly from mobile gallery or camera
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-[#B8A99A] hover:text-[#241713] hover:bg-[#F5F3EF] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              {/* Photo Upload: Mobile Gallery or Camera */}
              <div>
                <label className="font-bold text-[#241713] block mb-1">
                  Dish Photo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageFileSelect}
                  className="hidden"
                />

                {newItem.imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#B8A99A]/30 bg-[#F5F3EF] p-2 flex items-center gap-3">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newItem.imageUrl}
                        alt="Dish Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow space-y-1.5">
                      <p className="text-[11px] font-bold text-[#241713]">Photo Ready!</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 bg-[#493126] text-white rounded-lg text-[10px] font-bold hover:bg-[#241713] transition-colors"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, imageUrl: "" })}
                          className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageCompressing}
                    className="w-full border-2 border-dashed border-[#B8A99A]/50 hover:border-[#C6A46C] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 bg-[#F5F3EF]/60 hover:bg-[#F5F3EF] transition-all group active:scale-98"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#FFFFFF] border border-[#B8A99A]/30 flex items-center justify-center text-[#493126] group-hover:text-[#C6A46C] transition-colors shadow-xs">
                      {imageCompressing ? (
                        <RefreshCw className="w-5 h-5 animate-spin text-[#C6A46C]" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-black text-[#241713] text-xs">
                        {imageCompressing
                          ? "Optimizing photo for fast loading..."
                          : "Tap to Select from Gallery or Camera"}
                      </p>
                      <p className="text-[10px] text-[#B8A99A] mt-0.5">
                        JPG, PNG, HEIC from your phone
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Item Name */}
              <div>
                <label className="font-bold text-[#241713] block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Special Dum Biryani, Cold Brew..."
                  className="w-full px-3.5 py-2.5 bg-[#F5F3EF] border border-[#B8A99A]/30 rounded-2xl text-[#241713] focus:outline-none focus:ring-2 focus:ring-[#C6A46C]"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#241713]">Category</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategoryInline(!isAddingCategoryInline)}
                      className="text-[10px] font-bold text-[#C6A46C] hover:text-[#493126] transition-colors"
                    >
                      {isAddingCategoryInline ? "Cancel" : "+ New"}
                    </button>
                  </div>

                  {isAddingCategoryInline ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={inlineCategoryName}
                        onChange={(e) => setInlineCategoryName(e.target.value)}
                        placeholder="Category name"
                        className="w-full px-2 py-1.5 bg-[#F5F3EF] border border-[#B8A99A]/40 rounded-xl text-[#241713] text-[11px] focus:outline-none focus:ring-1 focus:ring-[#C6A46C]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCategory(inlineCategoryName)}
                        className="px-2 py-1.5 bg-[#241713] text-[#F7F2EA] rounded-xl font-bold text-[10px] hover:bg-[#493126]"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F5F3EF] border border-[#B8A99A]/30 rounded-2xl text-[#241713] focus:outline-none focus:ring-2 focus:ring-[#C6A46C] font-semibold text-xs"
                    >
                      {categories
                        .filter((c) => c.id !== "all")
                        .map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="font-bold text-[#241713] block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="250"
                    className="w-full px-3.5 py-2 bg-[#F5F3EF] border border-[#B8A99A]/30 rounded-2xl text-[#241713] focus:outline-none focus:ring-2 focus:ring-[#C6A46C]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-[#241713] block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Ingredients, taste, preparation notes..."
                  className="w-full px-3.5 py-2.5 bg-[#F5F3EF] border border-[#B8A99A]/30 rounded-2xl text-[#241713] focus:outline-none focus:ring-2 focus:ring-[#C6A46C]"
                />
              </div>

              {/* Dietary & Featured */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="font-bold text-[#241713] block mb-1">Dietary</label>
                  <select
                    value={newItem.dietary}
                    onChange={(e) => setNewItem({ ...newItem, dietary: e.target.value as DietaryType })}
                    className="w-full px-3.5 py-2 bg-[#F5F3EF] border border-[#B8A99A]/30 rounded-2xl text-[#241713] focus:outline-none font-semibold text-xs"
                  >
                    <option value="veg">Pure Veg</option>
                    <option value="vegan">Vegan</option>
                    <option value="non-veg">Non-Veg</option>
                    <option value="egg">Contains Egg</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-[#241713]">
                    <input
                      type="checkbox"
                      checked={newItem.isFeatured}
                      onChange={(e) => setNewItem({ ...newItem, isFeatured: e.target.checked })}
                      className="rounded text-[#493126] focus:ring-[#C6A46C] w-4 h-4"
                    />
                    <span>Chef Pick / Popular</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F5F3EF]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#B8A99A] font-bold hover:bg-[#F5F3EF] hover:text-[#241713] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={imageCompressing}
                  className="px-5 py-2.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] font-black rounded-2xl shadow-md transition-all active:scale-98"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Category Management */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241713]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-6 shadow-2xl space-y-4 border border-[#B8A99A]/30">
            <div className="flex items-center justify-between pb-2 border-b border-[#F5F3EF]">
              <div>
                <h3 className="font-serif font-black text-lg text-[#241713]">
                  Menu Categories
                </h3>
                <p className="text-[11px] text-[#B8A99A]">
                  Create custom sections for your QALBI menu
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl text-[#B8A99A] hover:text-[#241713] hover:bg-[#F5F3EF] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create Category Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddCategory(newCategoryName);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Starters, Tandoor, Desserts..."
                className="flex-grow px-3.5 py-2.5 bg-[#F5F3EF] border border-[#B8A99A]/40 rounded-2xl text-xs text-[#241713] focus:outline-none focus:ring-2 focus:ring-[#C6A46C]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] font-black text-xs rounded-2xl shadow-md transition-all whitespace-nowrap"
              >
                + Add
              </button>
            </form>

            {/* Categories List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pt-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#B8A99A] block">
                Existing Categories ({categories.length})
              </label>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F3EF] border border-[#B8A99A]/20 text-xs"
                >
                  <span className="font-bold text-[#241713]">
                    {cat.name}
                    {cat.id === "all" && (
                      <span className="text-[10px] text-[#B8A99A] font-normal ml-2">
                        (Default Filter)
                      </span>
                    )}
                  </span>
                  {cat.id !== "all" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-[#B8A99A] hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#F5F3EF]">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2 bg-[#241713] text-[#F7F2EA] font-bold text-xs rounded-2xl hover:bg-[#493126] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Printable Customer Bill / Receipt */}
      {selectedBillOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241713]/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-[#FFFFFF] rounded-3xl p-6 shadow-2xl border border-[#B8A99A]/40 space-y-4 my-8">
            {/* Action Bar (Hidden on print) */}
            <div className="no-print flex items-center justify-between pb-3 border-b border-[#F5F3EF]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#241713]">
                <Printer className="w-4 h-4 text-[#C6A46C]" />
                <span>Customer Bill / Receipt</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBillOrder(null)}
                className="p-1.5 rounded-xl text-[#B8A99A] hover:text-[#241713] hover:bg-[#F5F3EF] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Container (Prints cleanly) */}
            <div
              id="printable-bill"
              className="bg-[#FFFFFF] p-4 text-[#241713] font-mono text-xs space-y-3 rounded-2xl border border-dashed border-[#B8A99A]/50"
            >
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#241713]/20">
                <h2 className="font-serif font-black text-xl tracking-wider text-[#241713]">
                  QALBI CAFE
                </h2>
                <p className="text-[10px] text-[#493126] font-sans">
                  Tea, Coffee & Fast Food
                </p>
                <p className="text-[9px] text-[#B8A99A] leading-tight px-1 font-sans">
                  Kannan nagar, bus stop, opposite Bijapur, Bammanajogi, Vijayapura, Karnataka 586109
                </p>
                <p className="text-[10px] font-bold text-[#241713] font-sans pt-0.5">
                  Phone: +91 74118 33084
                </p>
              </div>

              {/* Order Meta Info (NO GUEST NAME) */}
              <div className="flex justify-between items-center text-[11px] py-1 border-b border-dashed border-[#241713]/20">
                <div>
                  <p className="font-bold text-sm">Table {selectedBillOrder.tableNumber}</p>
                  <p className="text-[10px] text-[#B8A99A]">Order #{selectedBillOrder.id}</p>
                </div>
                <div className="text-right text-[10px] text-[#493126]">
                  <p>{new Date(selectedBillOrder.createdAt).toLocaleDateString("en-IN")}</p>
                  <p>{new Date(selectedBillOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-1">
                <div className="flex justify-between font-bold text-[10px] uppercase text-[#B8A99A] pb-1 border-b border-[#241713]/10">
                  <span className="w-1/2">Item</span>
                  <span className="w-1/6 text-center">Qty</span>
                  <span className="w-1/6 text-right">Rate</span>
                  <span className="w-1/6 text-right">Amt</span>
                </div>
                <div className="divide-y divide-[#241713]/5 py-1">
                  {selectedBillOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-1.5 text-[11px]">
                      <span className="w-1/2 font-semibold text-[#241713] truncate pr-1">
                        {item.name}
                      </span>
                      <span className="w-1/6 text-center font-bold text-[#493126]">
                        {item.quantity}
                      </span>
                      <span className="w-1/6 text-right text-[#B8A99A]">
                        ₹{item.unitPrice}
                      </span>
                      <span className="w-1/6 text-right font-bold text-[#241713]">
                        ₹{item.unitPrice * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Totals (NO GST) */}
              <div className="pt-2 border-t border-dashed border-[#241713]/20 space-y-1 text-right">
                <div className="flex justify-between text-base font-black text-[#241713] pt-1">
                  <span>Grand Total</span>
                  <span className="font-serif">₹{selectedBillOrder.total}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="text-center py-1.5 bg-[#F5F3EF] rounded-xl text-[10px] font-bold uppercase tracking-wider text-[#493126] border border-[#B8A99A]/20">
                {selectedBillOrder.paymentStatus === "paid"
                  ? "✓ PAID AT COUNTER"
                  : "DINE-IN • PAY AT COUNTER"}
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-2 border-t border-dashed border-[#241713]/20 space-y-0.5 text-[10px] text-[#B8A99A] font-sans">
                <p className="font-serif font-bold text-[#241713]">Thank you for visiting QALBI!</p>
                <p>Please visit again ✨</p>
              </div>
            </div>

            {/* Print and Close Actions (Hidden on print) */}
            <div className="no-print flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedBillOrder(null)}
                className="flex-1 py-2.5 rounded-2xl bg-[#F5F3EF] hover:bg-[#E5E2DC] text-[#493126] font-bold text-xs transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.print();
                  }
                }}
                className="flex-1 py-2.5 rounded-2xl bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98"
              >
                <Printer className="w-4 h-4 text-[#C6A46C]" />
                <span>Print Bill</span>
              </button>
            </div>
          </div>

          {/* Dedicated POS & Thermal Print Styling */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-bill, #printable-bill * {
                visibility: visible !important;
              }
              #printable-bill {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 380px !important;
                margin: 0 auto !important;
                padding: 16px !important;
                border: none !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

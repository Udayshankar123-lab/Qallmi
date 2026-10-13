"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChefHat,
  BellRing,
  UtensilsCrossed,
  ShieldCheck,
  Coffee,
  AlertCircle,
  PlusCircle,
} from "lucide-react";
import { Order, OrderStatus } from "@/types/cafe";

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || "Order not found");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load order";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
    const interval = setInterval(loadOrder, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const steps: { key: OrderStatus; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      key: "received",
      label: "Order Verified & Received",
      desc: "Sent instantly to the barista & kitchen",
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: "from-purple-500 to-indigo-600",
    },
    {
      key: "preparing",
      label: "Currently Brewing & Cooking",
      desc: "Crafted fresh for your table",
      icon: <ChefHat className="w-4 h-4" />,
      color: "from-amber-500 to-orange-500",
    },
    {
      key: "ready",
      label: "Ready to Serve",
      desc: "Coming right to your table now!",
      icon: <BellRing className="w-4 h-4" />,
      color: "from-emerald-500 to-teal-600",
    },
    {
      key: "completed",
      label: "Delivered & Enjoyed",
      desc: "Bon appétit at Qallmi Cafe",
      icon: <UtensilsCrossed className="w-4 h-4" />,
      color: "from-teal-600 to-cyan-600",
    },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case "received":
        return 0;
      case "preparing":
        return 1;
      case "ready":
        return 2;
      case "completed":
        return 3;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] flex items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#241713] border-t-[#C6A46C] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#F7F2EA] flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-[#493126] mb-3" />
        <h2 className="font-serif font-black text-xl text-[#241713]">Order Not Found</h2>
        <p className="text-xs text-[#B8A99A] mt-1 max-w-xs">
          We couldn&apos;t find an active order with reference #{id}.
        </p>
        <Link
          href="/"
          className="mt-4 px-5 py-2.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl text-xs font-black shadow-md transition-all"
        >
          Return to Cafe Menu
        </Link>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-[#F7F2EA] flex flex-col font-sans">
      {/* Header: Deep Espresso */}
      <header className="bg-[#241713] border-b border-[#493126]/30 px-4 py-3 sticky top-0 z-40 text-[#F7F2EA]">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link
            href={`/?table=${order.tableNumber}`}
            className="flex items-center gap-1.5 text-xs font-bold text-[#C6A46C] hover:text-[#F7F2EA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Table {order.tableNumber} Menu</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-serif font-black text-[#F7F2EA]">
            <Coffee className="w-4 h-4 text-[#C6A46C]" />
            <span>QALLMI CAFE</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 w-full flex-grow space-y-5">
        {/* Main Status Container */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#B8A99A]/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F7F2EA]">
            <div>
              <h1 className="font-serif font-black text-lg text-[#241713]">
                Table {order.tableNumber} Live Status
              </h1>
              <p className="text-xs text-[#B8A99A] font-medium">
                Reference: <span className="font-mono font-bold text-[#241713]">#{order.id}</span>
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#C6A46C] text-[#241713] flex items-center gap-1 shadow-2xs">
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#241713]" /> DINE-IN • PAY AT COUNTER
            </span>
          </div>

          {/* Kitchen Status Box: Deep Espresso */}
          <div className="p-5 rounded-3xl bg-[#241713] text-[#F7F2EA] flex items-center justify-between shadow-xl border border-[#493126]">
            <div>
              <p className="text-xs text-[#C6A46C] font-bold uppercase tracking-wider">Kitchen Status</p>
              <h3 className="text-lg font-serif font-black text-[#F7F2EA] mt-0.5">
                {order.status === "completed"
                  ? "Completed & Served! ✨"
                  : order.status === "ready"
                  ? "Ready! Serving to Table 🎉"
                  : order.status === "preparing"
                  ? "Brewing & Preparing ♨️"
                  : "Order Received in Kitchen 📋"}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-[#493126] flex items-center justify-center text-[#C6A46C] border border-[#C6A46C]/30 shadow-inner">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-4 pl-2 pt-2">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} className="relative flex items-start gap-4">
                  {idx < steps.length - 1 && (
                    <div
                      className={`absolute left-4 top-8 w-0.5 h-10 -ml-[1px] transition-colors ${
                        idx < currentStepIndex ? "bg-[#C6A46C]" : "bg-[#B8A99A]/30"
                      }`}
                    />
                  )}

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
                      isPast
                        ? "bg-[#493126] text-[#C6A46C] shadow-sm"
                        : isCurrent
                        ? "bg-[#241713] text-[#C6A46C] ring-4 ring-[#C6A46C]/40 shadow-md animate-pulse"
                        : "bg-[#FFFFFF] text-[#B8A99A] border border-[#B8A99A]/40"
                    }`}
                  >
                    {step.icon}
                  </div>

                  <div className="flex-grow pt-0.5">
                    <h4
                      className={`text-sm font-bold ${
                        isCurrent
                          ? "text-[#241713] font-black"
                          : isPast
                          ? "text-[#493126]"
                          : "text-[#B8A99A]"
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-xs text-[#B8A99A] font-medium">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ordered Dishes Summary: Pure White Card */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#B8A99A]/30 shadow-sm space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#493126]">
            Ordered Dishes & Drinks
          </h3>
          <div className="divide-y divide-[#F7F2EA] text-xs">
            {order.items.map((item, i) => (
              <div key={i} className="py-2.5 flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#241713] mr-1.5">
                    {item.quantity}× {item.name}
                  </span>
                  {item.selectedSize && (
                    <span className="text-[#493126] bg-[#F7F2EA] px-1.5 py-0.5 rounded text-[10px] font-semibold border border-[#B8A99A]/20">
                      {item.selectedSize}
                    </span>
                  )}
                </div>
                <span className="font-bold text-[#493126] font-serif">
                  ₹{item.unitPrice * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#F7F2EA] flex justify-between text-sm font-black text-[#241713]">
            <span>Total Bill (Pay at Counter)</span>
            <span className="font-serif text-lg text-[#493126]">
              ₹{order.total}
            </span>
          </div>
        </div>

        {/* Action Button: Deep Espresso */}
        <div className="text-center">
          <Link
            href={`/?table=${order.tableNumber}`}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl text-xs font-black tracking-wider uppercase shadow-xl transition-all active:scale-98"
          >
            <PlusCircle className="w-4 h-4 text-[#C6A46C]" />
            <span>Order More for Table {order.tableNumber}</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

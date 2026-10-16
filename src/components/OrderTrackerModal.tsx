"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  Clock,
  ChefHat,
  BellRing,
  UtensilsCrossed,
  ShieldCheck,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Order, OrderStatus } from "@/types/cafe";

export default function OrderTrackerModal() {
  const { isTrackerOpen, setIsTrackerOpen, activeOrder, setActiveOrder } = useCart();
  const [currentOrder, setCurrentOrder] = useState<Order | null>(activeOrder);

  useEffect(() => {
    setCurrentOrder(activeOrder);

    if (!activeOrder || !isTrackerOpen) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${activeOrder.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.order) {
            setCurrentOrder(data.order);
            setActiveOrder(data.order);
          }
        }
      } catch {
        // Polling error silently handled
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeOrder, isTrackerOpen, setActiveOrder]);

  if (!isTrackerOpen || !currentOrder) return null;

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
      desc: "Crafted with fresh ingredients",
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
      desc: "Bon appétit at QALBI Cafe",
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

  const currentStepIndex = getStepIndex(currentOrder.status);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#241713]/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-[#FFFFFF] rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up border border-[#B8A99A]/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1 bg-[#B8A99A]/50 rounded-full mx-auto mt-2 sm:hidden flex-shrink-0" />

        {/* Deep Espresso Header */}
        <div className="px-5 py-4 border-b border-[#493126]/20 flex items-center justify-between bg-[#241713] text-[#F7F2EA]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-lg text-[#F7F2EA]">
                Live Order Tracker
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#C6A46C] text-[#241713] flex items-center gap-1 shadow-xs">
                <UtensilsCrossed className="w-3 h-3 text-[#241713]" /> PAY AT COUNTER
              </span>
            </div>
            <p className="text-xs text-[#B8A99A] font-medium">
              Order #{currentOrder.id} • Table {currentOrder.tableNumber}
            </p>
          </div>
          <button
            onClick={() => setIsTrackerOpen(false)}
            className="p-2 text-[#F7F2EA]/80 hover:text-[#F7F2EA] hover:bg-[#493126] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content with Warm Ivory background */}
        <div className="p-5 overflow-y-auto space-y-5 flex-grow bg-[#F7F2EA]">
          {/* Kitchen status card: Deep Espresso with Gold accents */}
          <div className="p-5 rounded-3xl bg-[#241713] text-[#F7F2EA] flex items-center justify-between shadow-xl border border-[#493126]">
            <div>
              <p className="text-xs text-[#C6A46C] font-bold uppercase tracking-wider">Kitchen Status</p>
              <h3 className="text-xl font-serif font-black text-[#F7F2EA] mt-0.5">
                {currentOrder.status === "completed"
                  ? "Completed & Served! ✨"
                  : currentOrder.status === "ready"
                  ? "Ready! Serving to Table 🎉"
                  : currentOrder.status === "preparing"
                  ? "Brewing & Preparing ♨️"
                  : "Order Received in Kitchen 📋"}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#493126] flex items-center justify-center text-[#C6A46C] border border-[#C6A46C]/30 shadow-inner">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-4 pl-2">
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

          {/* Order Items Summary: Pure White card */}
          <div className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#B8A99A]/30 space-y-2 shadow-xs">
            <h5 className="text-xs font-black uppercase tracking-wider text-[#493126]">
              Ordered Items
            </h5>
            <div className="divide-y divide-[#F7F2EA] text-xs">
              {currentOrder.items.map((item, i) => (
                <div key={i} className="py-2 flex justify-between items-center">
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

            <div className="pt-2 border-t border-[#F7F2EA] flex justify-between text-xs font-black text-[#241713]">
              <span>Total Bill (Pay at Counter)</span>
              <span className="font-serif text-sm text-[#493126]">
                ₹{currentOrder.total}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Primary Button Deep Espresso with Ivory text and Gold icon */}
        <div className="p-4 bg-[#FFFFFF] border-t border-[#B8A99A]/20">
          <button
            onClick={() => setIsTrackerOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#241713] hover:bg-[#493126] text-[#F7F2EA] rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4 text-[#C6A46C]" />
            <span>Order More for Table {currentOrder.tableNumber}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

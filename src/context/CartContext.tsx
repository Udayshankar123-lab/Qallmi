"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, MenuItem, Order } from "@/types/cafe";
import { verifyTableToken, cleanAddressBar } from "@/lib/tableSecurity";

interface CartContextType {
  items: CartItem[];
  tableNumber: string;
  setTableNumber: (table: string) => void;
  addItem: (
    item: MenuItem,
    quantity?: number,
    selectedSize?: string,
    selectedOptions?: Record<string, string>,
    notes?: string
  ) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isTrackerOpen: boolean;
  setIsTrackerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumberState] = useState<string>("01");
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  // Sync table from secure URL token or session storage; immediately clean address bar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get("t") || params.get("token") || params.get("tbl");
      
      let establishedTable: string | null = null;

      if (tokenParam) {
        // Verify cryptographic signature from QR code
        const verified = verifyTableToken(tokenParam);
        if (verified) {
          establishedTable = verified;
          setTableNumberState(verified);
          sessionStorage.setItem("qalbi_table", verified);
          localStorage.setItem("qalbi_table", verified);
        }
      }

      // If no valid QR token was in URL, restore from session/local storage
      if (!establishedTable) {
        const saved =
          sessionStorage.getItem("qalbi_table") ||
          localStorage.getItem("qalbi_table") ||
          localStorage.getItem("qallmi_table");
        if (saved) {
          setTableNumberState(saved);
        }
      }

      // Clean the address bar immediately so ?t= or ?table= is never visible or editable
      cleanAddressBar();

      // Check for previously active order with strict validation
      const savedOrder = localStorage.getItem("qallmi_active_order");
      if (savedOrder) {
        try {
          const parsed = JSON.parse(savedOrder);
          if (
            parsed &&
            typeof parsed === "object" &&
            parsed.id &&
            Array.isArray(parsed.items) &&
            parsed.items.length > 0
          ) {
            setActiveOrder(parsed);
          } else {
            localStorage.removeItem("qallmi_active_order");
          }
        } catch {
          localStorage.removeItem("qallmi_active_order");
        }
      }
    }
  }, []);

  const setTableNumber = (table: string) => {
    const formatted = table.padStart(2, "0");
    setTableNumberState(formatted);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("qalbi_table", formatted);
      localStorage.setItem("qalbi_table", formatted);
    }
  };

  const handleSetActiveOrder = (order: Order | null) => {
    if (order && order.id && Array.isArray(order.items)) {
      setActiveOrder(order);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("qallmi_active_order", JSON.stringify(order));
        } catch {
          // Ignore storage quota errors
        }
      }
    } else {
      setActiveOrder(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("qallmi_active_order");
        } catch {
          // Ignore storage errors
        }
      }
    }
  };

  const addItem = (
    item: MenuItem,
    quantity = 1,
    selectedSize?: string,
    selectedOptions?: Record<string, string>,
    notes?: string
  ) => {
    // Calculate final unit price including size and options
    let unitPrice = item.price;
    if (selectedSize && item.sizes) {
      const s = item.sizes.find((x) => x.name === selectedSize);
      if (s) unitPrice += s.priceDelta;
    }
    if (selectedOptions && item.options) {
      item.options.forEach((group) => {
        const choiceLabel = selectedOptions[group.name];
        if (choiceLabel) {
          const choice = group.choices.find((c) => c.label === choiceLabel);
          if (choice) unitPrice += choice.priceDelta;
        }
      });
    }

    const lineKey = `${item.id}-${selectedSize || "default"}-${JSON.stringify(
      selectedOptions || {}
    )}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === lineKey);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: lineKey,
          menuItemId: item.id,
          name: item.name,
          unitPrice,
          quantity,
          selectedSize,
          selectedOptions,
          imageUrl: item.imageUrl,
          notes,
        },
      ];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const tax = 0; // No GST
  const total = subtotal;

  return (
    <CartContext.Provider
      value={{
        items,
        tableNumber,
        setTableNumber,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        subtotal,
        tax,
        total,
        activeOrder,
        setActiveOrder: handleSetActiveOrder,
        isCartOpen,
        setIsCartOpen,
        isTrackerOpen,
        setIsTrackerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CartItem, MenuItem, Order } from "@/types/cafe";

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
  const [tableNumber, setTableNumberState] = useState<string>("04");
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  // Sync table from URL query param or localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get("table");
      if (tableParam) {
        const cleanTable = tableParam.padStart(2, "0");
        setTableNumberState(cleanTable);
        localStorage.setItem("qallmi_table", cleanTable);
      } else {
        const saved = localStorage.getItem("qallmi_table");
        if (saved) setTableNumberState(saved);
      }

      // Check for previously active order
      const savedOrder = localStorage.getItem("qallmi_active_order");
      if (savedOrder) {
        try {
          setActiveOrder(JSON.parse(savedOrder));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  const setTableNumber = (table: string) => {
    const formatted = table.padStart(2, "0");
    setTableNumberState(formatted);
    if (typeof window !== "undefined") {
      localStorage.setItem("qallmi_table", formatted);
    }
  };

  const handleSetActiveOrder = (order: Order | null) => {
    setActiveOrder(order);
    if (typeof window !== "undefined") {
      if (order) {
        localStorage.setItem("qallmi_active_order", JSON.stringify(order));
      } else {
        localStorage.removeItem("qallmi_active_order");
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

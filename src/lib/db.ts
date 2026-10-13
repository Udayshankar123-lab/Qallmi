import fs from "fs";
import path from "path";
import { MenuItem, Order, OrderStatus, PaymentStatus } from "@/types/cafe";
import { INITIAL_MENU_ITEMS } from "./initialData";

const DATA_DIR = path.join(process.cwd(), "data");
const MENU_FILE = path.join(DATA_DIR, "menu.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// In-memory fallback if filesystem write is restricted
let memoryMenu: MenuItem[] = [...INITIAL_MENU_ITEMS];
let memoryOrders: Order[] = [
  {
    id: "QLM-1021",
    tableNumber: "04",
    customerName: "Aarav S.",
    customerPhone: "+91 98765 43210",
    items: [
      {
        id: "c-1",
        menuItemId: "m-1",
        name: "Signature Spanish Latte",
        unitPrice: 285,
        quantity: 2,
        selectedSize: "Large (350ml)",
        selectedOptions: { "Milk Choice": "Oat Milk" },
        imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "c-2",
        menuItemId: "m-11",
        name: "Butter Flaky Almond Croissant",
        unitPrice: 210,
        quantity: 1,
        imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
      },
    ],
    subtotal: 780,
    tax: 39,
    total: 819,
    status: "preparing",
    paymentStatus: "paid",
    paymentMethod: "upi",
    transactionId: "UPI-TXN-908234",
    specialInstructions: "Less ice in both cups please.",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "QLM-1020",
    tableNumber: "02",
    customerName: "Priya M.",
    items: [
      {
        id: "c-3",
        menuItemId: "m-5",
        name: "Truffle Mushroom Sourdough Toast",
        unitPrice: 400,
        quantity: 1,
        selectedOptions: { "Egg Add-on": "Poached Farm Egg" },
        imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "c-4",
        menuItemId: "m-4",
        name: "Ceremonial Matcha Cloud Latte",
        unitPrice: 300,
        quantity: 1,
        selectedSize: "Iced (350ml)",
        imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80",
      },
    ],
    subtotal: 700,
    tax: 35,
    total: 735,
    status: "ready",
    paymentStatus: "paid",
    paymentMethod: "card",
    transactionId: "CARD-AUTH-65481",
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
];

export function getMenuItems(): MenuItem[] {
  try {
    ensureDirectory();
    if (fs.existsSync(MENU_FILE)) {
      const data = fs.readFileSync(MENU_FILE, "utf-8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(MENU_FILE, JSON.stringify(INITIAL_MENU_ITEMS, null, 2));
      return INITIAL_MENU_ITEMS;
    }
  } catch (err) {
    console.error("Error reading menu file, falling back to memory:", err);
    return memoryMenu;
  }
}

export function saveMenuItem(item: MenuItem): MenuItem {
  try {
    ensureDirectory();
    const items = getMenuItems();
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.unshift(item);
    }
    fs.writeFileSync(MENU_FILE, JSON.stringify(items, null, 2));
    memoryMenu = items;
    return item;
  } catch (err) {
    console.error("Error saving menu item:", err);
    const index = memoryMenu.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      memoryMenu[index] = item;
    } else {
      memoryMenu.unshift(item);
    }
    return item;
  }
}

export function toggleItemAvailability(id: string, isAvailable: boolean): boolean {
  try {
    const items = getMenuItems();
    const item = items.find((i) => i.id === id);
    if (item) {
      item.isAvailable = isAvailable;
      fs.writeFileSync(MENU_FILE, JSON.stringify(items, null, 2));
      memoryMenu = items;
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error toggling item availability:", err);
    const item = memoryMenu.find((i) => i.id === id);
    if (item) {
      item.isAvailable = isAvailable;
      return true;
    }
    return false;
  }
}

export function deleteMenuItem(id: string): boolean {
  try {
    const items = getMenuItems().filter((i) => i.id !== id);
    fs.writeFileSync(MENU_FILE, JSON.stringify(items, null, 2));
    memoryMenu = items;
    return true;
  } catch (err) {
    memoryMenu = memoryMenu.filter((i) => i.id !== id);
    return true;
  }
}

export function getOrders(): Order[] {
  try {
    ensureDirectory();
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(memoryOrders, null, 2));
      return memoryOrders;
    }
  } catch (err) {
    return memoryOrders;
  }
}

export function getOrderById(id: string): Order | undefined {
  const orders = getOrders();
  return orders.find((o) => o.id.toLowerCase() === id.toLowerCase());
}

export function createOrder(orderInput: Omit<Order, "id" | "createdAt" | "updatedAt">): Order {
  const idNumber = Math.floor(1000 + Math.random() * 9000);
  const newOrder: Order = {
    ...orderInput,
    id: `QLM-${idNumber}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    ensureDirectory();
    const orders = getOrders();
    orders.unshift(newOrder);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    memoryOrders = orders;
  } catch (err) {
    memoryOrders.unshift(newOrder);
  }

  return newOrder;
}

export function updateOrderStatus(
  id: string,
  status?: OrderStatus,
  paymentStatus?: PaymentStatus
): Order | null {
  try {
    const orders = getOrders();
    const order = orders.find((o) => o.id.toLowerCase() === id.toLowerCase());
    if (order) {
      if (status) order.status = status;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      order.updatedAt = new Date().toISOString();
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
      memoryOrders = orders;
      return order;
    }
    return null;
  } catch (err) {
    const order = memoryOrders.find((o) => o.id.toLowerCase() === id.toLowerCase());
    if (order) {
      if (status) order.status = status;
      if (paymentStatus) order.paymentStatus = paymentStatus;
      order.updatedAt = new Date().toISOString();
      return order;
    }
    return null;
  }
}

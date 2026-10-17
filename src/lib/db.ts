import fs from "fs";
import path from "path";
import { MenuItem, Order, OrderStatus, PaymentStatus, Category, DailyEarningsRecord } from "@/types/cafe";
import { INITIAL_MENU_ITEMS, INITIAL_CATEGORIES } from "./initialData";

const IS_VERCEL = process.env.VERCEL === "1";
const DATA_DIR = IS_VERCEL ? path.join("/tmp", "qalbi_data") : path.join(process.cwd(), "data");
const MENU_FILE = path.join(DATA_DIR, "menu.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");
const DAILY_HISTORY_FILE = path.join(DATA_DIR, "daily_history.json");
const PIN_FILE = path.join(DATA_DIR, "pin.json");

function ensureDirectory() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    // Copy initial data to /tmp if running on Vercel
    if (IS_VERCEL) {
      const srcMenu = path.join(process.cwd(), "data", "menu.json");
      const srcOrders = path.join(process.cwd(), "data", "orders.json");
      const srcCategories = path.join(process.cwd(), "data", "categories.json");
      const srcDaily = path.join(process.cwd(), "data", "daily_history.json");
      const srcPin = path.join(process.cwd(), "data", "pin.json");

      if (!fs.existsSync(MENU_FILE) && fs.existsSync(srcMenu)) {
        fs.copyFileSync(srcMenu, MENU_FILE);
      }
      if (!fs.existsSync(ORDERS_FILE) && fs.existsSync(srcOrders)) {
        fs.copyFileSync(srcOrders, ORDERS_FILE);
      }
      if (!fs.existsSync(CATEGORIES_FILE) && fs.existsSync(srcCategories)) {
        fs.copyFileSync(srcCategories, CATEGORIES_FILE);
      }
      if (!fs.existsSync(DAILY_HISTORY_FILE) && fs.existsSync(srcDaily)) {
        fs.copyFileSync(srcDaily, DAILY_HISTORY_FILE);
      }
      if (!fs.existsSync(PIN_FILE) && fs.existsSync(srcPin)) {
        fs.copyFileSync(srcPin, PIN_FILE);
      }
    }
  } catch (err) {
    // Graceful fallback to memory
  }
}

// In-memory fallback if filesystem write is restricted
let memoryDailyRecords: DailyEarningsRecord[] = [];
let memoryStaffPin: string = "1234";
let memoryCategories: Category[] = [...INITIAL_CATEGORIES];
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

export function clearMenuItems(): boolean {
  try {
    ensureDirectory();
    fs.writeFileSync(MENU_FILE, JSON.stringify([], null, 2));
    memoryMenu = [];
    return true;
  } catch (err) {
    memoryMenu = [];
    return true;
  }
}

export function getCategories(): Category[] {
  try {
    ensureDirectory();
    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = fs.readFileSync(CATEGORIES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Fallback to initial
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(INITIAL_CATEGORIES, null, 2));
    return INITIAL_CATEGORIES;
  } catch (err) {
    return memoryCategories;
  }
}

export function saveCategory(category: Category): Category {
  try {
    ensureDirectory();
    const categories = getCategories();
    const index = categories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    memoryCategories = categories;
    return category;
  } catch (err) {
    const index = memoryCategories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      memoryCategories[index] = category;
    } else {
      memoryCategories.push(category);
    }
    return category;
  }
}

export function deleteCategory(id: string): boolean {
  if (id === "all") return false; // Prevent deleting "all"
  try {
    const categories = getCategories().filter((c) => c.id !== id);
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    memoryCategories = categories;
    return true;
  } catch (err) {
    memoryCategories = memoryCategories.filter((c) => c.id !== id);
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

export function getStaffPin(): string {
  try {
    ensureDirectory();
    if (fs.existsSync(PIN_FILE)) {
      const data = fs.readFileSync(PIN_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && parsed.pin) return String(parsed.pin);
    }
  } catch {
    // fallback
  }
  return memoryStaffPin || "1234";
}

export function setStaffPin(newPin: string): boolean {
  try {
    ensureDirectory();
    const data = { pin: newPin, updatedAt: new Date().toISOString() };
    fs.writeFileSync(PIN_FILE, JSON.stringify(data, null, 2));
    memoryStaffPin = newPin;
    return true;
  } catch {
    memoryStaffPin = newPin;
    return true;
  }
}

export function getDailyRecords(): DailyEarningsRecord[] {
  try {
    ensureDirectory();
    if (fs.existsSync(DAILY_HISTORY_FILE)) {
      const data = fs.readFileSync(DAILY_HISTORY_FILE, "utf-8");
      const records: DailyEarningsRecord[] = JSON.parse(data);
      return Array.isArray(records)
        ? records.sort((a, b) => b.date.localeCompare(a.date))
        : [];
    }
    return memoryDailyRecords.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return memoryDailyRecords.sort((a, b) => b.date.localeCompare(a.date));
  }
}

export function saveDailyRecords(records: DailyEarningsRecord[]) {
  try {
    ensureDirectory();
    fs.writeFileSync(DAILY_HISTORY_FILE, JSON.stringify(records, null, 2));
    memoryDailyRecords = records;
  } catch {
    memoryDailyRecords = records;
  }
}

function toISTDateKey(isoOrDate: string | Date): string {
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
    return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

function toDisplayDateString(dateKey: string): string {
  try {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return dt.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateKey;
  }
}

export function archivePastOrders(mode: "yesterday" | "all_past" | "close_day" = "yesterday"): {
  archivedCount: number;
  records: DailyEarningsRecord[];
  remainingOrders: Order[];
} {
  ensureDirectory();
  const allOrders = getOrders();
  const todayKey = toISTDateKey(new Date());

  let ordersToArchive: Order[] = [];
  let remainingOrders: Order[] = [];

  if (mode === "close_day") {
    // Close Day: Archive today's completed/served orders or all orders from current day
    ordersToArchive = allOrders.filter(
      (o) => o.status === "completed" || toISTDateKey(o.createdAt) < todayKey
    );
    remainingOrders = allOrders.filter(
      (o) => !(o.status === "completed" || toISTDateKey(o.createdAt) < todayKey)
    );
  } else {
    // Yesterday / past orders: strictly any order created before today's IST date
    ordersToArchive = allOrders.filter((o) => toISTDateKey(o.createdAt) < todayKey);
    remainingOrders = allOrders.filter((o) => toISTDateKey(o.createdAt) >= todayKey);
  }

  if (ordersToArchive.length === 0) {
    return {
      archivedCount: 0,
      records: getDailyRecords(),
      remainingOrders: allOrders,
    };
  }

  const existingRecords = getDailyRecords();
  const recordsMap = new Map<string, DailyEarningsRecord>();
  for (const rec of existingRecords) {
    recordsMap.set(rec.date, rec);
  }

  // Group orders to archive by their date
  for (const order of ordersToArchive) {
    const dateKey = toISTDateKey(order.createdAt);
    const existing = recordsMap.get(dateKey);

    if (existing) {
      // Avoid duplicate order IDs
      const orderExists = existing.orders.some((o) => o.id === order.id);
      if (!orderExists) {
        existing.orders.unshift(order);
        existing.totalOrders = existing.orders.length;
        existing.totalEarnings = existing.orders.reduce(
          (sum, o) => sum + (o.status !== "cancelled" ? o.total : 0),
          0
        );
      }
    } else {
      recordsMap.set(dateKey, {
        date: dateKey,
        displayDate: toDisplayDateString(dateKey),
        totalOrders: 1,
        totalEarnings: order.status !== "cancelled" ? order.total : 0,
        orders: [order],
        archivedAt: new Date().toISOString(),
      });
    }
  }

  const updatedRecords = Array.from(recordsMap.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  // Persist updated records
  saveDailyRecords(updatedRecords);

  // Persist remaining orders to orders.json (deleting yesterday's archived orders)
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(remainingOrders, null, 2));
    memoryOrders = remainingOrders;
  } catch {
    memoryOrders = remainingOrders;
  }

  return {
    archivedCount: ordersToArchive.length,
    records: updatedRecords,
    remainingOrders,
  };
}

export function deleteDailyRecord(date: string): boolean {
  try {
    ensureDirectory();
    const records = getDailyRecords().filter((r) => r.date !== date);
    saveDailyRecords(records);
    return true;
  } catch {
    return false;
  }
}


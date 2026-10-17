import fs from "fs";
import path from "path";
import { MenuItem, Order, OrderStatus, PaymentStatus, Category, DailyEarningsRecord } from "@/types/cafe";
import { INITIAL_MENU_ITEMS, INITIAL_CATEGORIES } from "./initialData";
import { writeBlobState, readBlobState } from "./blobStorage";

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
  } catch {
    // In-memory fallback
  }
}

// In-memory runtime cache
let memoryDailyRecords: DailyEarningsRecord[] = [];
let memoryStaffPin: string = "1234";
let memoryCategories: Category[] = [...INITIAL_CATEGORIES];
let memoryMenu: MenuItem[] = [...INITIAL_MENU_ITEMS];
let memoryOrders: Order[] = [];
let isStateInitialized = false;

// Fast initial memory populate from disk if available
try {
  ensureDirectory();
  if (fs.existsSync(MENU_FILE)) {
    const raw = fs.readFileSync(MENU_FILE, "utf-8");
    memoryMenu = JSON.parse(raw);
  }
  if (fs.existsSync(CATEGORIES_FILE)) {
    const raw = fs.readFileSync(CATEGORIES_FILE, "utf-8");
    memoryCategories = JSON.parse(raw);
  }
  if (fs.existsSync(ORDERS_FILE)) {
    const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
    memoryOrders = JSON.parse(raw);
  }
  if (fs.existsSync(PIN_FILE)) {
    const raw = fs.readFileSync(PIN_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed?.pin) memoryStaffPin = String(parsed.pin);
  }
  if (fs.existsSync(DAILY_HISTORY_FILE)) {
    const raw = fs.readFileSync(DAILY_HISTORY_FILE, "utf-8");
    memoryDailyRecords = JSON.parse(raw);
  }
} catch {
  // Use memory defaults
}

// Write local files safely
function writeLocalFile(filePath: string, data: unknown) {
  try {
    ensureDirectory();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch {
    // Non-fatal if filesystem is read-only
  }
}

/* ---------------- MENU ITEMS ---------------- */

export async function getMenuItems(): Promise<MenuItem[]> {
  try {
    // Check cloud blob state first for authoritative distributed persistence
    const cloudMenu = await readBlobState<MenuItem[] | null>("menu", null);
    if (cloudMenu !== null && Array.isArray(cloudMenu)) {
      memoryMenu = cloudMenu;
      writeLocalFile(MENU_FILE, cloudMenu);
      return cloudMenu;
    }

    // Fallback to local file or memory
    if (fs.existsSync(MENU_FILE)) {
      const data = fs.readFileSync(MENU_FILE, "utf-8");
      memoryMenu = JSON.parse(data);
      return memoryMenu;
    }
    return memoryMenu;
  } catch {
    return memoryMenu;
  }
}

export async function saveMenuItem(item: MenuItem): Promise<MenuItem> {
  const items = await getMenuItems();
  const index = items.findIndex((i) => i.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.unshift(item);
  }

  memoryMenu = items;
  writeLocalFile(MENU_FILE, items);
  await writeBlobState("menu", items);
  return item;
}

export async function toggleItemAvailability(id: string, isAvailable: boolean): Promise<boolean> {
  const items = await getMenuItems();
  const item = items.find((i) => i.id === id);
  if (item) {
    item.isAvailable = isAvailable;
    memoryMenu = items;
    writeLocalFile(MENU_FILE, items);
    await writeBlobState("menu", items);
    return true;
  }
  return false;
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const items = (await getMenuItems()).filter((i) => i.id !== id);
  memoryMenu = items;
  writeLocalFile(MENU_FILE, items);
  await writeBlobState("menu", items);
  return true;
}

export async function clearMenuItems(): Promise<boolean> {
  memoryMenu = [];
  writeLocalFile(MENU_FILE, []);
  await writeBlobState("menu", []);
  return true;
}

/* ---------------- CATEGORIES ---------------- */

export async function getCategories(): Promise<Category[]> {
  try {
    const cloudCategories = await readBlobState<Category[] | null>("categories", null);
    if (cloudCategories !== null && Array.isArray(cloudCategories) && cloudCategories.length > 0) {
      memoryCategories = cloudCategories;
      writeLocalFile(CATEGORIES_FILE, cloudCategories);
      return cloudCategories;
    }

    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = fs.readFileSync(CATEGORIES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCategories = parsed;
        return parsed;
      }
    }
    return memoryCategories;
  } catch {
    return memoryCategories;
  }
}

export async function saveCategory(category: Category): Promise<Category> {
  const categories = await getCategories();
  const index = categories.findIndex((c) => c.id === category.id);
  if (index >= 0) {
    categories[index] = category;
  } else {
    categories.push(category);
  }

  memoryCategories = categories;
  writeLocalFile(CATEGORIES_FILE, categories);
  await writeBlobState("categories", categories);
  return category;
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (id === "all") return false; // Never delete 'all'
  const categories = (await getCategories()).filter((c) => c.id !== id);
  memoryCategories = categories;
  writeLocalFile(CATEGORIES_FILE, categories);
  await writeBlobState("categories", categories);
  return true;
}

/* ---------------- ORDERS ---------------- */

export async function getOrders(): Promise<Order[]> {
  try {
    const cloudOrders = await readBlobState<Order[] | null>("orders", null);
    if (cloudOrders !== null && Array.isArray(cloudOrders)) {
      memoryOrders = cloudOrders;
      writeLocalFile(ORDERS_FILE, cloudOrders);
      return cloudOrders;
    }

    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      memoryOrders = JSON.parse(data);
      return memoryOrders;
    }
    return memoryOrders;
  } catch {
    return memoryOrders;
  }
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await getOrders();
  return orders.find((o) => o.id.toLowerCase() === id.toLowerCase());
}

export async function createOrder(orderInput: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> {
  const idNumber = Math.floor(1000 + Math.random() * 9000);
  const newOrder: Order = {
    ...orderInput,
    id: `QLM-${idNumber}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const orders = await getOrders();
  orders.unshift(newOrder);

  memoryOrders = orders;
  writeLocalFile(ORDERS_FILE, orders);
  await writeBlobState("orders", orders);

  return newOrder;
}

export async function updateOrderStatus(
  id: string,
  status?: OrderStatus,
  paymentStatus?: PaymentStatus
): Promise<Order | null> {
  const orders = await getOrders();
  const order = orders.find((o) => o.id.toLowerCase() === id.toLowerCase());
  if (order) {
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    order.updatedAt = new Date().toISOString();

    memoryOrders = orders;
    writeLocalFile(ORDERS_FILE, orders);
    await writeBlobState("orders", orders);
    return order;
  }
  return null;
}

/* ---------------- STAFF PIN ---------------- */

export async function getStaffPin(): Promise<string> {
  try {
    const cloudPin = await readBlobState<{ pin: string } | null>("pin", null);
    if (cloudPin && cloudPin.pin) {
      memoryStaffPin = String(cloudPin.pin);
      return memoryStaffPin;
    }

    if (fs.existsSync(PIN_FILE)) {
      const data = fs.readFileSync(PIN_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed?.pin) {
        memoryStaffPin = String(parsed.pin);
        return memoryStaffPin;
      }
    }
  } catch {
    // fallback
  }
  return memoryStaffPin || "1234";
}

export async function setStaffPin(newPin: string): Promise<boolean> {
  memoryStaffPin = newPin;
  const pinObj = { pin: newPin, updatedAt: new Date().toISOString() };
  writeLocalFile(PIN_FILE, pinObj);
  await writeBlobState("pin", pinObj);
  return true;
}

/* ---------------- DAILY ARCHIVE & EARNINGS ---------------- */

export async function getDailyRecords(): Promise<DailyEarningsRecord[]> {
  try {
    const cloudRecords = await readBlobState<DailyEarningsRecord[] | null>("daily_history", null);
    if (cloudRecords !== null && Array.isArray(cloudRecords)) {
      memoryDailyRecords = cloudRecords.sort((a, b) => b.date.localeCompare(a.date));
      writeLocalFile(DAILY_HISTORY_FILE, memoryDailyRecords);
      return memoryDailyRecords;
    }

    if (fs.existsSync(DAILY_HISTORY_FILE)) {
      const data = fs.readFileSync(DAILY_HISTORY_FILE, "utf-8");
      const records: DailyEarningsRecord[] = JSON.parse(data);
      if (Array.isArray(records)) {
        memoryDailyRecords = records.sort((a, b) => b.date.localeCompare(a.date));
        return memoryDailyRecords;
      }
    }
    return memoryDailyRecords.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return memoryDailyRecords.sort((a, b) => b.date.localeCompare(a.date));
  }
}

export async function saveDailyRecords(records: DailyEarningsRecord[]): Promise<void> {
  memoryDailyRecords = records;
  writeLocalFile(DAILY_HISTORY_FILE, records);
  await writeBlobState("daily_history", records);
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

export async function archivePastOrders(mode: "yesterday" | "all_past" | "close_day" = "yesterday"): Promise<{
  archivedCount: number;
  records: DailyEarningsRecord[];
  remainingOrders: Order[];
}> {
  const allOrders = await getOrders();
  const todayKey = toISTDateKey(new Date());

  let ordersToArchive: Order[] = [];
  let remainingOrders: Order[] = [];

  if (mode === "close_day") {
    ordersToArchive = allOrders.filter(
      (o) => o.status === "completed" || toISTDateKey(o.createdAt) < todayKey
    );
    remainingOrders = allOrders.filter(
      (o) => !(o.status === "completed" || toISTDateKey(o.createdAt) < todayKey)
    );
  } else {
    ordersToArchive = allOrders.filter((o) => toISTDateKey(o.createdAt) < todayKey);
    remainingOrders = allOrders.filter((o) => toISTDateKey(o.createdAt) >= todayKey);
  }

  if (ordersToArchive.length === 0) {
    const records = await getDailyRecords();
    return {
      archivedCount: 0,
      records,
      remainingOrders: allOrders,
    };
  }

  const existingRecords = await getDailyRecords();
  const recordsMap = new Map<string, DailyEarningsRecord>();
  for (const rec of existingRecords) {
    recordsMap.set(rec.date, rec);
  }

  for (const order of ordersToArchive) {
    const dateKey = toISTDateKey(order.createdAt);
    const existing = recordsMap.get(dateKey);

    if (existing) {
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

  await saveDailyRecords(updatedRecords);

  memoryOrders = remainingOrders;
  writeLocalFile(ORDERS_FILE, remainingOrders);
  await writeBlobState("orders", remainingOrders);

  return {
    archivedCount: ordersToArchive.length,
    records: updatedRecords,
    remainingOrders,
  };
}

export async function deleteDailyRecord(date: string): Promise<boolean> {
  const records = (await getDailyRecords()).filter((r) => r.date !== date);
  await saveDailyRecords(records);
  return true;
}

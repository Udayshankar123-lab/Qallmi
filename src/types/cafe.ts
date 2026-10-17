export type DietaryType = 'veg' | 'non-veg' | 'vegan' | 'egg';

export interface MenuOptionChoice {
  label: string;
  priceDelta: number;
}

export interface MenuOptionGroup {
  name: string;
  choices: MenuOptionChoice[];
}

export interface MenuSizeOption {
  name: string;
  priceDelta: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  dietary: DietaryType;
  sizes?: MenuSizeOption[];
  options?: MenuOptionGroup[];
}

export interface CartItem {
  id: string; // unique item line id
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  selectedSize?: string;
  selectedOptions?: Record<string, string>;
  imageUrl: string;
  notes?: string;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'pending' | 'failed';
export type PaymentMethod = 'pay_at_counter' | 'cash' | 'card_at_counter' | 'upi' | 'card' | 'netbanking';

export interface Order {
  id: string;
  tableNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  serviceCharge?: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyEarningsRecord {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. "Friday, Oct 16, 2026"
  totalOrders: number;
  totalEarnings: number;
  orders: Order[];
  archivedAt: string;
}


export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Salon {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
}

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  salonId: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  currentAmount?: number;
  reservationInfo?: {
    time: string;
    clientName: string;
    count: number;
    pax?: number;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  order?: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  imageUrl?: string;
  image?: string;
  cost?: number;
  description?: string;
  barcode: string;
  stock: number;
  minStockAlert: number;
  soldCount?: number;
}

export type KdsStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
  notes?: string;
  kdsStatus: KdsStatus;
  chefName?: string;
}

export type OrderStatus = 'open' | 'closed' | 'cancelled';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

export interface Order {
  id: string;
  folio: string; // e.g. "#000001" or "#2"
  orderNumber?: string | number;
  tableId: string;
  tableName: string;
  salonId: string;
  salonName: string;
  clientName: string;
  clientId?: string;
  waiterName: string;
  cashierName?: string;
  chefName?: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentMethod?: PaymentMethod;
  receivedAmount?: number;
  changeAmount?: number;
  createdAt: string; // ISO string
  closedAt?: string;
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  clientName: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  pax: number;
  tableId: string;
  tableName: string;
  salonId: string;
  notes: string; // e.g., "Silla de bebe"
  status: ReservationStatus;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  visitsCount?: number;
  totalVisits?: number;
  totalSpent: number;
  lastVisit?: string;
  preferences?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'Administrador' | 'Mesero' | 'Cajero' | 'Cocinero';
  avatar: string;
  salesTotal?: number;
}

export interface CashTransaction {
  id: string;
  type: 'opening' | 'sale' | 'expense' | 'closing';
  amount: number;
  orderId?: string;
  folio?: string;
  paymentMethod: PaymentMethod;
  timestamp: string;
  cashier: string;
  waiterName?: string;
  chefName?: string;
  description: string;
}

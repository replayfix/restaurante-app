import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc, onSnapshot } from '@angular/fire/firestore';
import { Salon, Table, Category, Product, Order, OrderItem, Reservation, Client, Staff, CashTransaction, PaymentMethod, KdsStatus } from '../models';
import { MockDataService } from './mock-data.service';
import { NotificationModalService } from './notification-modal.service';

@Injectable({
  providedIn: 'root'
})
export class RestaurantService {
  readonly notify = inject(NotificationModalService);

  // Signals state
  readonly salons = signal<Salon[]>([]);
  readonly tables = signal<Table[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly reservations = signal<Reservation[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly staff = signal<Staff[]>([]);
  readonly transactions = signal<CashTransaction[]>([]);

  // Active user / navigation state
  readonly currentUser = signal<Staff>({ id: 'admin', name: 'Administrador', role: 'Administrador', avatar: 'A' });
  readonly activeSalonId = signal<string>('main');
  readonly selectedTableId = signal<string | null>(null);
  readonly selectedOrderId = signal<string | null>(null);
  readonly searchQuery = signal<string>('');

  // Computed views for instant UI reactivity
  readonly activeSalonTables = computed(() => {
    const salonId = this.activeSalonId();
    const allTables = this.tables().filter(t => t.salonId === salonId);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayReservations = this.reservations().filter(r => r.date === todayStr && r.status === 'confirmed');

    return allTables.map(table => {
      const tableRes = todayReservations.filter(r => r.tableId === table.id);
      if (tableRes.length > 0 && table.status !== 'occupied') {
        return {
          ...table,
          status: 'reserved' as const,
          reservationInfo: {
            time: tableRes[0].time,
            clientName: tableRes[0].clientName,
            count: tableRes.length,
            pax: tableRes.reduce((sum, r) => sum + (r.pax || 1), 0)
          }
        };
      } else if (tableRes.length > 0 && table.status === 'occupied') {
        return {
          ...table,
          reservationInfo: {
            time: tableRes[0].time,
            clientName: tableRes[0].clientName,
            count: tableRes.length,
            pax: tableRes.reduce((sum, r) => sum + (r.pax || 1), 0)
          }
        };
      }
      return table;
    });
  });

  readonly openOrders = computed(() => this.orders().filter(o => o.status === 'open'));

  readonly lastZClosureTimestamp = computed(() => {
    const closings = this.transactions().filter(t => t.type === 'closing');
    if (closings.length === 0) return null;
    return closings.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0]?.timestamp || null;
  });

  readonly activeShiftOrders = computed(() => {
    const lastZ = this.lastZClosureTimestamp();
    const all = this.orders();
    if (!lastZ) {
      const todayStr = new Date().toISOString().split('T')[0];
      return all.filter(o => (o.closedAt?.startsWith(todayStr) || o.createdAt.startsWith(todayStr)));
    }
    return all.filter(o => {
      const time = o.closedAt || o.createdAt;
      return time > lastZ;
    });
  });

  readonly closedTodayOrders = computed(() => {
    return this.activeShiftOrders().filter(o => o.status === 'closed');
  });

  readonly todaySalesTotal = computed(() => {
    return this.closedTodayOrders().reduce((acc, o) => acc + o.total, 0);
  });

  readonly activeTablesCount = computed(() => {
    return this.tables().filter(t => t.status === 'occupied').length;
  });

  readonly lowStockProducts = computed(() => {
    return this.products().filter(p => p.stock <= p.minStockAlert);
  });

  readonly topProducts = computed(() => {
    return [...this.products()].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5);
  });

  readonly leastSoldProducts = computed(() => {
    return [...this.products()].sort((a, b) => (a.soldCount || 0) - (b.soldCount || 0)).slice(0, 5);
  });

  readonly pendingKdsOrders = computed(() => {
    return this.openOrders().filter(o => o.items.some(i => i.kdsStatus === 'pending' || i.kdsStatus === 'preparing'));
  });

  readonly readyToPickupOrders = computed(() => {
    return this.openOrders().filter(o => o.items.some(i => i.kdsStatus === 'ready'));
  });

  isTableReadyToPickup(tableId: string): boolean {
    const order = this.orders().find(o => o.tableId === tableId && o.status === 'open');
    return !!order && order.items.some(i => i.kdsStatus === 'ready');
  }

  readonly reportsData = computed(() => {
    const totalSales = this.todaySalesTotal();
    const completedOrdersCount = this.closedTodayOrders().length;
    const averageTicket = completedOrdersCount > 0 ? totalSales / completedOrdersCount : 25.94;
    const kitchenAvgTimeMinutes = 14;
    return {
      totalSales,
      completedOrdersCount,
      averageTicket,
      kitchenAvgTimeMinutes
    };
  });

  readonly topProductsAnalytics = computed(() => {
    const products = this.products();
    const categories = this.categories();
    const orders = this.activeShiftOrders();
    const lastZ = this.lastZClosureTimestamp();

    const salesMap = new Map<string, { quantity: number; revenue: number }>();
    for (const order of orders) {
      for (const item of order.items) {
        const current = salesMap.get(item.productId) || { quantity: 0, revenue: 0 };
        current.quantity += item.quantity;
        current.revenue += item.total;
        salesMap.set(item.productId, current);
      }
    }

    const list = products.map(p => {
      const catName = categories.find(c => c.id === p.categoryId)?.name || 'General';
      const stats = salesMap.get(p.id) || { quantity: 0, revenue: 0 };
      const qty = lastZ ? stats.quantity : Math.max(stats.quantity, p.soldCount || 0);
      const rev = stats.revenue > 0 ? stats.revenue : qty * p.price;
      return {
        id: p.id,
        name: p.name,
        category: catName,
        quantity: qty,
        revenue: rev
      };
    });

    list.sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      return b.revenue - a.revenue;
    });

    return list.slice(0, 5);
  });

  readonly topCategoriesAnalytics = computed(() => {
    const products = this.products();
    const categories = this.categories();
    const orders = this.activeShiftOrders();

    const salesByCatMap = new Map<string, number>();
    let totalRevenue = 0;

    for (const order of orders) {
      for (const item of order.items) {
        const prod = products.find(p => p.id === item.productId);
        const catId = prod ? prod.categoryId : 'other';
        const current = salesByCatMap.get(catId) || 0;
        salesByCatMap.set(catId, current + item.total);
        totalRevenue += item.total;
      }
    }

    if (totalRevenue === 0 && categories.length > 0) {
      return categories.map(c => ({
        name: c.name,
        amount: 0,
        percent: 0
      }));
    }

    const result = categories.map(c => {
      const amount = salesByCatMap.get(c.id) || 0;
      const percent = totalRevenue > 0 ? Number(((amount / totalRevenue) * 100).toFixed(1)) : 0;
      return {
        name: c.name,
        amount,
        percent
      };
    }).filter(c => c.amount > 0 || totalRevenue === 0);

    result.sort((a, b) => b.amount - a.amount);
    return result;
  });

  private firestore = inject(Firestore, { optional: true });

  constructor(private mockService: MockDataService) {
    const savedUser = localStorage.getItem('restaurante_active_user');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {}
    }
    this.loadInitialState();
  }

  switchUser(staff: Staff): void {
    const exists = this.staff().some(s => s.id === staff.id || (s.name.toLowerCase().trim() === staff.name.toLowerCase().trim() && s.role === staff.role));
    if (!exists) {
      this.staff.update(list => [...list, staff]);
      this.saveToStorage();
    }
    this.currentUser.set(staff);
    localStorage.setItem('restaurante_active_user', JSON.stringify(staff));
  }

  private async loadInitialState(): Promise<void> {
    const saved = localStorage.getItem('restaurante_state_v1');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.salons.set(data.salons || this.mockService.getInitialSalons());
        this.tables.set(data.tables || this.mockService.getInitialTables());
        this.categories.set(data.categories || this.mockService.getInitialCategories());
        this.products.set(data.products || this.mockService.getInitialProducts());
        this.orders.set(data.orders || this.mockService.getInitialOrders());
        this.reservations.set(data.reservations || this.mockService.getInitialReservations());
        this.clients.set(data.clients || this.mockService.getInitialClients());
        this.staff.set(data.staff || this.mockService.getInitialStaff());
        this.transactions.set(data.transactions || this.mockService.getInitialTransactions());
      } catch (e) {
        console.warn('Error loading localStorage, falling back to mock data', e);
        this.resetToDefaultMockData();
      }
    } else {
      this.resetToDefaultMockData();
    }

    // Sincronización en vivo desde Cloud Firestore (Tiempo Real para conectar Mesero, Cocina y Caja)
    if (this.firestore) {
      try {
        const docRef = doc(this.firestore, 'restaurante_db', 'main_state');
        // onSnapshot escucha instantáneamente cualquier cambio hecho desde otra tablet o PC
        onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data && data['salons']) {
              this.salons.set(data['salons']);
              this.tables.set(data['tables'] || []);
              this.categories.set(data['categories'] || []);
              this.products.set(data['products'] || []);
              this.orders.set(data['orders'] || []);
              this.reservations.set(data['reservations'] || []);
              this.clients.set(data['clients'] || []);
              this.staff.set(data['staff'] || []);
              this.transactions.set(data['transactions'] || this.mockService.getInitialTransactions());
              localStorage.setItem('restaurante_state_v1', JSON.stringify(data));
              console.log('🔥 Sincronización en TIEMPO REAL con Firebase Cloud Firestore activa');
            }
          } else {
            console.log('ℹ️ Documento principal en Firestore aún no existe. Se creará al guardar el primer cambio en el POS o Salón.');
          }
        }, (error: any) => {
          console.error('❌ Error de escucha en Firestore:', error.message || error);
          if (String(error.message || '').includes('permission-denied') || error.code === 'permission-denied') {
            console.warn('⚠️ IMPORTANTE: Ve a la consola de Firebase -> Firestore Database -> Reglas (Rules) y cambia a "allow read, write: if true;" (o modo prueba) para permitir que los meseros y la cocina guarden datos.');
          }
        });
      } catch (e) {
        console.warn('Nota: Sincronización con Firestore pendiente o en modo offline:', e);
      }
    }
  }

  resetToDefaultMockData(): void {
    this.salons.set(this.mockService.getInitialSalons());
    this.tables.set(this.mockService.getInitialTables());
    this.categories.set(this.mockService.getInitialCategories());
    this.products.set(this.mockService.getInitialProducts());
    this.orders.set(this.mockService.getInitialOrders());
    this.reservations.set(this.mockService.getInitialReservations());
    this.clients.set(this.mockService.getInitialClients());
    this.staff.set(this.mockService.getInitialStaff());
    this.transactions.set(this.mockService.getInitialTransactions());
    this.saveToStorage();
  }

  private saveToStorage(): void {
    const state = {
      salons: this.salons(),
      tables: this.tables(),
      categories: this.categories(),
      products: this.products(),
      orders: this.orders(),
      reservations: this.reservations(),
      clients: this.clients(),
      staff: this.staff(),
      transactions: this.transactions()
    };
    localStorage.setItem('restaurante_state_v1', JSON.stringify(state));

    // Persistencia en Firebase Cloud Firestore
    if (this.firestore) {
      try {
        // Cloud Firestore rechaza sincrónicamente cualquier campo con valor undefined en JS/TS.
        // JSON.parse(JSON.stringify(state)) purga automáticamente todas las propiedades undefined de la jerarquía.
        const cleanState = JSON.parse(JSON.stringify(state));
        const docRef = doc(this.firestore, 'restaurante_db', 'main_state');
        setDoc(docRef, cleanState, { merge: true }).then(() => {
          console.log('✅ Estado guardado y sincronizado exitosamente en Firebase Cloud Firestore');
        }).catch((e: any) => {
          console.error('❌ Error al guardar en Firestore:', e.message || e);
          if (String(e.message || '').includes('permission-denied') || e.code === 'permission-denied') {
            console.warn('⚠️ IMPORTANTE: Tu base de datos Firestore tiene reglas bloqueadas. Ve a Firebase Console -> Firestore Database -> Reglas y pon "allow read, write: if true;"');
          }
        });
      } catch (err) {
        console.warn('Error al serializar o enviar estado a Firestore:', err);
      }
    }
  }

  // --- Salons & Tables management ---
  addSalon(name: string): void {
    const newSalon: Salon = {
      id: 'salon-' + Date.now(),
      name,
      order: this.salons().length + 1,
      isActive: true
    };
    this.salons.update(list => [...list, newSalon]);
    this.activeSalonId.set(newSalon.id);
    this.saveToStorage();
  }

  deleteSalon(salonId: string): void {
    if (salonId === 'main') return; // protect default salon
    this.salons.update(list => list.filter(s => s.id !== salonId));
    this.tables.update(list => list.filter(t => t.salonId !== salonId));
    if (this.activeSalonId() === salonId) {
      this.activeSalonId.set('main');
    }
    this.saveToStorage();
  }

  addTable(salonId: string, name: string, capacity: number = 4, orientation: 'horizontal' | 'vertical' = 'horizontal'): void {
    const newTable: Table = {
      id: 'table-' + Date.now(),
      salonId,
      name,
      x: Math.floor(Math.random() * 400) + 40,
      y: Math.floor(Math.random() * 300) + 40,
      capacity,
      orientation,
      status: 'available'
    };
    this.tables.update(list => [...list, newTable]);
    this.saveToStorage();
  }

  updateTableCapacity(tableId: string, capacity: number): void {
    this.tables.update(list => list.map(t => t.id === tableId ? { ...t, capacity } : t));
    this.saveToStorage();
  }

  updateTableOrientation(tableId: string, orientation: 'horizontal' | 'vertical'): void {
    this.tables.update(list => list.map(t => t.id === tableId ? { ...t, orientation } : t));
    this.saveToStorage();
  }

  updateTablePosition(tableId: string, x: number, y: number): void {
    this.tables.update(list => list.map(t => t.id === tableId ? { ...t, x, y } : t));
    this.saveToStorage();
  }

  deleteTable(tableId: string): void {
    this.tables.update(list => list.filter(t => t.id !== tableId));
    this.saveToStorage();
  }

  // --- POS & Order Operations ---
  openOrSelectTableOrder(tableId: string): Order {
    const table = this.tables().find(t => t.id === tableId);
    if (!table) throw new Error('Table not found');

    if (table.currentOrderId) {
      const existing = this.orders().find(o => o.id === table.currentOrderId);
      if (existing) {
        this.selectedTableId.set(tableId);
        this.selectedOrderId.set(existing.id);
        return existing;
      }
    }

    // Create new order
    const folioNumber = this.orders().length + 1;
    const folioStr = `#${folioNumber}`;
    const salon = this.salons().find(s => s.id === table.salonId);

    const newOrder: Order = {
      id: 'order-' + Date.now(),
      folio: folioStr,
      tableId: table.id,
      tableName: table.name,
      salonId: table.salonId,
      salonName: salon?.name || 'Main',
      clientName: 'Público General',
      waiterName: this.currentUser().name,
      status: 'open',
      items: [],
      subtotal: 0.00,
      total: 0.00,
      createdAt: new Date().toISOString()
    };

    this.orders.update(list => [newOrder, ...list]);
    this.tables.update(list => list.map(t => t.id === tableId ? {
      ...t,
      status: 'occupied',
      currentOrderId: newOrder.id,
      currentAmount: 0.00
    } : t));

    this.selectedTableId.set(tableId);
    this.selectedOrderId.set(newOrder.id);
    this.saveToStorage();
    return newOrder;
  }

  addItemToOrder(orderId: string, product: Product, quantity = 1, notes = ''): void {
    this.orders.update(list => list.map(order => {
      if (order.id !== orderId) return order;

      const existingIndex = order.items.findIndex(i => i.productId === product.id && i.notes === notes && i.kdsStatus === 'pending');
      let updatedItems = [...order.items];

      if (existingIndex > -1) {
        const item = updatedItems[existingIndex];
        const newQty = item.quantity + quantity;
        updatedItems[existingIndex] = {
          ...item,
          quantity: newQty,
          total: Number((newQty * item.price).toFixed(2))
        };
      } else {
        const newItem: OrderItem = {
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity,
          total: Number((quantity * product.price).toFixed(2)),
          notes,
          kdsStatus: 'pending'
        };
        updatedItems.push(newItem);
      }

      const newSubtotal = Number(updatedItems.reduce((acc, i) => acc + i.total, 0).toFixed(2));
      return {
        ...order,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal
      };
    }));

    const updatedOrder = this.orders().find(o => o.id === orderId);
    if (updatedOrder) {
      this.tables.update(list => list.map(t => t.id === updatedOrder.tableId ? {
        ...t,
        currentAmount: updatedOrder.total
      } : t));
    }
    this.saveToStorage();
  }

  updateOrderItemQuantity(orderId: string, itemId: string, delta: number): void {
    this.orders.update(list => list.map(order => {
      if (order.id !== orderId) return order;
      let updatedItems = order.items.map(i => {
        if (i.id !== itemId) return i;
        const newQty = i.quantity + delta;
        if (newQty <= 0) return null;
        return {
          ...i,
          quantity: newQty,
          total: Number((newQty * i.price).toFixed(2))
        };
      }).filter(Boolean) as OrderItem[];

      const newSubtotal = Number(updatedItems.reduce((acc, i) => acc + i.total, 0).toFixed(2));
      return {
        ...order,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal
      };
    }));

    const updatedOrder = this.orders().find(o => o.id === orderId);
    if (updatedOrder) {
      this.tables.update(list => list.map(t => t.id === updatedOrder.tableId ? {
        ...t,
        currentAmount: updatedOrder.total,
        status: updatedOrder.items.length === 0 ? 'available' : 'occupied'
      } : t));
    }
    this.saveToStorage();
  }

  updateOrderItemNotes(orderId: string, itemId: string, notes: string): void {
    this.orders.update(list => list.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        items: order.items.map(i => i.id === itemId ? { ...i, notes } : i)
      };
    }));
    this.saveToStorage();
  }

  updateOrderClient(orderId: string, clientName: string, clientId?: string): void {
    this.orders.update(list => list.map(order => {
      if (order.id !== orderId) return order;
      return {
        ...order,
        clientName,
        clientId
      };
    }));
    this.saveToStorage();
  }

  // --- KDS Kitchen status updates ---
  updateOrderItemKdsStatus(orderId: string, itemId: string, kdsStatus: KdsStatus): void {
    const currentChef = this.currentUser().name;
    const orderBefore = this.orders().find(o => o.id === orderId);
    const itemBefore = orderBefore?.items.find(i => i.id === itemId);

    this.orders.update(list => list.map(order => {
      if (order.id !== orderId) return order;
      const updatedItems = order.items.map(i => i.id === itemId ? { ...i, kdsStatus, chefName: currentChef } : i);
      return {
        ...order,
        chefName: currentChef,
        items: updatedItems
      };
    }));
    this.saveToStorage();

    if (kdsStatus === 'ready' && orderBefore && itemBefore) {
      const updatedOrder = this.orders().find(o => o.id === orderId);
      const allReady = updatedOrder?.items.every(i => i.kdsStatus === 'ready' || i.kdsStatus === 'delivered');
      if (allReady) {
        this.notify.success({
          title: '🔔 ¡PEDIDO COMPLETO LISTO PARA RECOGER!',
          message: `✨ El pedido ${orderBefore.folio} de ${orderBefore.tableName || 'Mesa'} ha sido completado al 100% por cocina (${currentChef}). ¡Listo en ventanilla para que ${orderBefore.waiterName || 'el mesero'} lo entregue!`,
          confirmText: '¡Avisado al Mesero!'
        });
      } else {
        this.notify.success({
          title: '🍽️ ¡PLATO LISTO PARA RECOGER!',
          message: `👨‍🍳 Cocina (${currentChef}) terminó: "${itemBefore.productName}" (Pedido ${orderBefore.folio} - ${orderBefore.tableName || 'Mesa'}). ¡Listo en ventanilla para ${orderBefore.waiterName || 'el mesero'}!`,
          confirmText: 'Aceptar'
        });
      }
    }
  }

  markOrderAsReady(orderId: string): void {
    const currentChef = this.currentUser().name;
    const order = this.orders().find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(i => 
      (i.kdsStatus === 'pending' || i.kdsStatus === 'preparing') ? { ...i, kdsStatus: 'ready' as const, chefName: currentChef } : i
    );

    this.orders.update(list => list.map(o => o.id === orderId ? { ...o, chefName: currentChef, items: updatedItems } : o));
    this.saveToStorage();

    this.notify.success({
      title: '🔔 ¡PEDIDO LISTO PARA RECOGER!',
      message: `✨ El pedido ${order.folio} (${order.tableName || 'Mesa'}) ha sido terminado al 100% por cocina (${currentChef}) y está listo en ventanilla para que el mesero (${order.waiterName || 'Mesero'}) lo lleve a la mesa.`,
      confirmText: '¡Notificado al Mesero!'
    });
  }

  // --- Cobrar / Checkout Order ---
  checkoutOrder(orderId: string, paymentMethod: PaymentMethod, receivedAmount: number): Order {
    const order = this.orders().find(o => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const changeAmount = Math.max(0, Number((receivedAmount - order.total).toFixed(2)));
    const now = new Date().toISOString();
    const currentCashier = this.currentUser().name;

    // Mark order closed
    const closedOrder: Order = {
      ...order,
      status: 'closed',
      paymentMethod,
      receivedAmount,
      changeAmount,
      closedAt: now,
      cashierName: currentCashier,
      items: order.items.map(i => ({ ...i, kdsStatus: 'delivered' as const }))
    };

    this.orders.update(list => list.map(o => o.id === orderId ? closedOrder : o));

    // Release table
    this.tables.update(list => list.map(t => t.id === order.tableId ? {
      ...t,
      status: 'available',
      currentOrderId: undefined,
      currentAmount: 0.00
    } : t));

    // Update product sold counts
    order.items.forEach(item => {
      this.products.update(list => list.map(p => p.id === item.productId ? {
        ...p,
        soldCount: (p.soldCount || 0) + item.quantity,
        stock: Math.max(0, p.stock - item.quantity)
      } : p));
    });

    // Register CashTransaction with full staff audit info
    const newTrans: CashTransaction = {
      id: 'trans-' + Date.now(),
      type: 'sale',
      amount: order.total,
      orderId: order.id,
      folio: order.folio || '#' + (order.orderNumber || order.id.slice(-4)),
      paymentMethod,
      timestamp: now,
      cashier: currentCashier,
      waiterName: order.waiterName,
      chefName: order.chefName,
      description: order.tableName || order.tableId || 'Mesa General'
    };
    this.transactions.update(list => [newTrans, ...list]);

    // Update CRM statistics if client matches
    this.clients.update(list => list.map(c => {
      const matchId = order.clientId ? c.id === order.clientId : (order.clientName && c.name.toLowerCase().trim() === order.clientName.toLowerCase().trim() && order.clientName.toLowerCase().trim() !== 'público general');
      if (!matchId) return c;
      const currentVisits = c.totalVisits || c.visitsCount || 0;
      const newVisits = currentVisits + 1;
      const newSpent = Number(((c.totalSpent || 0) + order.total).toFixed(2));
      const todayDate = new Date().toLocaleDateString('es-ES');
      return {
        ...c,
        totalVisits: newVisits,
        visitsCount: newVisits,
        totalSpent: newSpent,
        lastVisit: todayDate
      };
    }));

    this.saveToStorage();
    return closedOrder;
  }

  // --- Reservations ---
  addReservation(res: Omit<Reservation, 'id'>): void {
    const newRes: Reservation = {
      ...res,
      id: 'res-' + Date.now()
    };
    this.reservations.update(list => [...list, newRes]);
    this.saveToStorage();
  }

  deleteReservation(resId: string): void {
    this.reservations.update(list => list.filter(r => r.id !== resId));
    this.saveToStorage();
  }

  // --- Menu / Products Management ---
  addProduct(product: Omit<Product, 'id'>): void {
    const newProd: Product = {
      ...product,
      id: 'prod-' + Date.now()
    };
    this.products.update(list => [...list, newProd]);
    this.saveToStorage();
  }

  updateProduct(prodId: string, updated: Partial<Product>): void {
    this.products.update(list => list.map(p => p.id === prodId ? { ...p, ...updated } : p));
    this.saveToStorage();
  }

  deleteProduct(prodId: string): void {
    this.products.update(list => list.filter(p => p.id !== prodId));
    this.saveToStorage();
  }

  addCategory(name: string, icon: string = '🍔'): void {
    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name,
      icon
    };
    this.categories.update(list => [...list, newCat]);
    this.saveToStorage();
  }

  deleteCategory(catId: string): void {
    this.categories.update(list => list.filter(c => c.id !== catId));
    this.saveToStorage();
  }

  // --- Cash Transactions ---
  addCashTransaction(trans: Omit<CashTransaction, 'id' | 'timestamp'>): void {
    const newTrans: CashTransaction = {
      ...trans,
      id: 'trans-' + Date.now(),
      timestamp: new Date().toISOString()
    };
    this.transactions.update(list => [newTrans, ...list]);
    this.saveToStorage();
  }

  deleteCashTransaction(transId: string, orderId?: string): void {
    this.transactions.update(list => list.filter(t => t.id !== transId));
    if (orderId) {
      this.orders.update(list => list.filter(o => o.id !== orderId && o.folio !== orderId));
    }
    this.saveToStorage();
  }

  addClient(client: Omit<Client, 'id'>): void {
    const newClient: Client = {
      ...client,
      id: 'cli-' + Date.now()
    };
    this.clients.update(list => [...list, newClient]);
    this.saveToStorage();
  }

  deleteClient(clientId: string): void {
    this.clients.update(list => list.filter(c => c.id !== clientId));
    this.saveToStorage();
  }

  updateClient(clientId: string, updated: Partial<Client>): void {
    this.clients.update(list => list.map(c => c.id === clientId ? { ...c, ...updated } : c));
    this.saveToStorage();
  }
}

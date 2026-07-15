import { Injectable } from '@angular/core';
import { Salon, Table, Category, Product, Order, Reservation, Client, Staff, CashTransaction } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  getInitialSalons(): Salon[] {
    return [
      { id: 'main', name: 'Main', order: 1, isActive: true },
      { id: 'terraza', name: 'Terraza VIP', order: 2, isActive: true },
      { id: 'bar', name: 'Bar & Lounge', order: 3, isActive: true }
    ];
  }

  getInitialTables(): Table[] {
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'table-1',
        salonId: 'main',
        name: 'Mesa 1',
        x: 60,
        y: 60,
        capacity: 4,
        status: 'occupied',
        currentOrderId: 'order-101',
        currentAmount: 10.00
      },
      {
        id: 'table-2',
        salonId: 'main',
        name: 'Mesa 2',
        x: 220,
        y: 60,
        capacity: 6,
        status: 'reserved',
        reservationInfo: {
          time: '21:00',
          clientName: 'Familia Hidalgo',
          count: 1,
          pax: 4
        }
      },
      {
        id: 'table-3',
        salonId: 'main',
        name: 'Mesa 3',
        x: 380,
        y: 60,
        capacity: 4,
        status: 'occupied',
        currentOrderId: 'order-102',
        currentAmount: 3.50,
        reservationInfo: {
          time: '21:30',
          clientName: 'Luis Velez',
          count: 1,
          pax: 2
        }
      },
      {
        id: 'table-4',
        salonId: 'main',
        name: 'Mesa 4',
        x: 540,
        y: 60,
        capacity: 2,
        status: 'available'
      },
      {
        id: 'table-5',
        salonId: 'terraza',
        name: 'Mesa T1',
        x: 100,
        y: 100,
        capacity: 4,
        status: 'available'
      },
      {
        id: 'table-6',
        salonId: 'terraza',
        name: 'Mesa T2',
        x: 300,
        y: 100,
        capacity: 8,
        status: 'available'
      }
    ];
  }

  getInitialCategories(): Category[] {
    return [
      { id: 'cat-todo', name: 'Todo', icon: 'grid', order: 1 },
      { id: 'cat-bebidas', name: 'Bebidas', icon: 'coffee', order: 2 },
      { id: 'cat-desayunos', name: 'Desayunos', icon: 'utensils', order: 3 },
      { id: 'cat-platos', name: 'Platos Fuertes', icon: 'chef-hat', order: 4 },
      { id: 'cat-postres', name: 'Postres', icon: 'cake', order: 5 }
    ];
  }

  getInitialProducts(): Product[] {
    return [
      {
        id: 'prod-cafe',
        categoryId: 'cat-bebidas',
        name: 'Cafe',
        price: 1.50,
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
        barcode: '841000100001',
        stock: 45,
        minStockAlert: 5,
        soldCount: 14
      },
      {
        id: 'prod-bolon',
        categoryId: 'cat-desayunos',
        name: 'Bolon Chicharron',
        price: 3.50,
        imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80',
        barcode: '841000100002',
        stock: 28,
        minStockAlert: 5,
        soldCount: 12
      },
      {
        id: 'prod-jugo',
        categoryId: 'cat-bebidas',
        name: 'Jugo Naranja Fresco',
        price: 2.50,
        imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80',
        barcode: '841000100003',
        stock: 30,
        minStockAlert: 5,
        soldCount: 8
      },
      {
        id: 'prod-tigrillo',
        categoryId: 'cat-desayunos',
        name: 'Tigrillo Mixto',
        price: 5.00,
        imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=400&q=80',
        barcode: '841000100004',
        stock: 18,
        minStockAlert: 3,
        soldCount: 9
      },
      {
        id: 'prod-ceviche',
        categoryId: 'cat-platos',
        name: 'Ceviche Mixto Especial',
        price: 12.00,
        imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80',
        barcode: '841000100005',
        stock: 15,
        minStockAlert: 4,
        soldCount: 7
      },
      {
        id: 'prod-cappuccino',
        categoryId: 'cat-bebidas',
        name: 'Cappuccino Artesanal',
        price: 3.00,
        imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=400&q=80',
        barcode: '841000100006',
        stock: 40,
        minStockAlert: 5,
        soldCount: 11
      }
    ];
  }

  getInitialOrders(): Order[] {
    const todayStr = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'order-101',
        folio: '#2',
        tableId: 'table-1',
        tableName: 'Mesa 1',
        salonId: 'main',
        salonName: 'Main',
        clientName: 'Público General',
        waiterName: 'Administrador',
        status: 'open',
        items: [
          {
            id: 'item-1',
            productId: 'prod-bolon',
            productName: 'Bolon Chicharron',
            price: 3.50,
            quantity: 2,
            total: 7.00,
            notes: '',
            kdsStatus: 'ready'
          },
          {
            id: 'item-2',
            productId: 'prod-cafe',
            productName: 'Cafe',
            price: 1.50,
            quantity: 2,
            total: 3.00,
            notes: 'Bien caliente',
            kdsStatus: 'pending'
          }
        ],
        subtotal: 10.00,
        total: 10.00,
        createdAt: `${todayStr}T20:40:00Z`
      },
      {
        id: 'order-102',
        folio: '#3',
        tableId: 'table-3',
        tableName: 'Mesa 3',
        salonId: 'main',
        salonName: 'Main',
        clientName: 'Público General',
        waiterName: 'Administrador',
        status: 'open',
        items: [
          {
            id: 'item-3',
            productId: 'prod-bolon',
            productName: 'Bolon Chicharron',
            price: 3.50,
            quantity: 1,
            total: 3.50,
            notes: '',
            kdsStatus: 'ready'
          }
        ],
        subtotal: 3.50,
        total: 3.50,
        createdAt: `${todayStr}T20:40:00Z`
      },
      // Closed order for Dashboard ($5.00 Venta de hoy) & thermal ticket exact match
      {
        id: 'order-100',
        folio: '#000001',
        tableId: 'table-1',
        tableName: 'Mesa 1',
        salonId: 'main',
        salonName: 'Main',
        clientName: 'Público General',
        waiterName: 'Administrador',
        status: 'closed',
        items: [
          {
            id: 'item-01',
            productId: 'prod-cafe',
            productName: 'Cafe',
            price: 1.50,
            quantity: 1,
            total: 1.50,
            kdsStatus: 'delivered'
          },
          {
            id: 'item-02',
            productId: 'prod-bolon',
            productName: 'Bolon Chicharron',
            price: 3.50,
            quantity: 1,
            total: 3.50,
            kdsStatus: 'delivered'
          }
        ],
        subtotal: 5.00,
        total: 5.00,
        paymentMethod: 'CASH',
        receivedAmount: 5.00,
        changeAmount: 0.00,
        createdAt: `${todayStr}T20:15:00Z`,
        closedAt: `${todayStr}T20:29:00Z`
      }
    ];
  }

  getInitialReservations(): Reservation[] {
    const todayStr = new Date().toISOString().split('T')[0];
    return [
      {
        id: 'res-1',
        clientName: 'Familia Hidalgo',
        phone: 'Sin teléfono',
        date: todayStr,
        time: '21:00',
        pax: 5,
        tableId: 'table-2',
        tableName: 'Mesa 2',
        salonId: 'main',
        notes: '',
        status: 'confirmed'
      },
      {
        id: 'res-2',
        clientName: 'Luis Velez',
        phone: 'Sin teléfono',
        date: todayStr,
        time: '21:30',
        pax: 4,
        tableId: 'table-3',
        tableName: 'Mesa 3',
        salonId: 'main',
        notes: 'Silla de bebe',
        status: 'confirmed'
      }
    ];
  }

  getInitialClients(): Client[] {
    return [
      {
        id: 'cli-1',
        name: 'Familia Hidalgo',
        phone: '0991234567',
        email: 'hidalgo@gmail.com',
        visitsCount: 4,
        totalVisits: 4,
        totalSpent: 125.50,
        lastVisit: '2026-02-20',
        preferences: 'Mesa cerca de ventana'
      },
      {
        id: 'cli-2',
        name: 'Luis Velez',
        phone: '0987654321',
        email: 'lvelez@outlook.com',
        visitsCount: 6,
        totalVisits: 6,
        totalSpent: 210.00,
        lastVisit: '2026-02-18',
        preferences: 'Silla de bebe'
      },
      {
        id: 'cli-3',
        name: 'María García',
        phone: '0971112233',
        email: 'mgarcia@yahoo.com',
        visitsCount: 2,
        totalVisits: 2,
        totalSpent: 45.00,
        lastVisit: '2026-02-15',
        preferences: 'Sin picante'
      }
    ];
  }

  getInitialStaff(): Staff[] {
    return [
      {
        id: 'staff-1',
        name: 'Administrador',
        role: 'Administrador',
        avatar: 'A',
        salesTotal: 15.00
      },
      {
        id: 'staff-2',
        name: 'Mesero Principal',
        role: 'Mesero',
        avatar: 'M',
        salesTotal: 5.00
      },
      {
        id: 'staff-3',
        name: 'Chef Ejecutivo',
        role: 'Cocinero',
        avatar: 'C'
      }
    ];
  }

  getInitialTransactions(): CashTransaction[] {
    const todayStr = new Date().toISOString();
    return [
      {
        id: 'trans-open',
        type: 'opening',
        amount: 150.00,
        folio: 'AP-001',
        paymentMethod: 'CASH',
        timestamp: todayStr,
        cashier: 'Administrador',
        description: 'Apertura de Caja Inicial (Fondo de cambio)'
      },
      {
        id: 'trans-01',
        type: 'sale',
        amount: 5.00,
        orderId: 'order-closed-1',
        folio: '#000001',
        paymentMethod: 'CASH',
        timestamp: todayStr,
        cashier: 'Mesero Principal',
        description: 'Cobro Orden #000001 - Mesa 1'
      }
    ];
  }
}

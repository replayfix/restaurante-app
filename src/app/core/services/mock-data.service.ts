import { Injectable } from '@angular/core';
import { Salon, Table, Category, Product, Order, Reservation, Client, Staff, CashTransaction } from '../models';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  getInitialSalons(): Salon[] {
    return [
      { id: 'main', name: 'Salón Principal', order: 1, isActive: true }
    ];
  }

  getInitialTables(): Table[] {
    return [];
  }

  getInitialCategories(): Category[] {
    return [];
  }

  getInitialProducts(): Product[] {
    return [];
  }

  getInitialOrders(): Order[] {
    return [];
  }

  getInitialReservations(): Reservation[] {
    return [];
  }

  getInitialClients(): Client[] {
    return [];
  }

  getInitialStaff(): Staff[] {
    return [
      {
        id: 'admin',
        name: 'Administrador',
        role: 'Administrador',
        avatar: 'A'
      }
    ];
  }

  getInitialTransactions(): CashTransaction[] {
    return [];
  }
}

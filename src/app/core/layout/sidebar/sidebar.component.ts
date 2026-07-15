import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <!-- Brand Header -->
      <div class="brand">
        <div class="brand-icon">
          <span>🖥️</span>
        </div>
        <div class="brand-text">
          <h1>Mi Restaurante</h1>
          <span class="subtitle">Angular + Firebase</span>
        </div>
      </div>

      <!-- Navigation List -->
      <nav class="nav-list">
        <a *ngIf="canAccess('dashboard')" routerLink="/dashboard" routerLinkActive="active" class="nav-item">
          <span class="icon">📊</span>
          <span>Dashboard</span>
        </a>

        <a *ngIf="canAccess('reports')" routerLink="/reports" routerLinkActive="active" class="nav-item">
          <span class="icon">📈</span>
          <span>Reportes</span>
        </a>

        <div *ngIf="canAccess('pos') || canAccess('kds') || canAccess('cash-history')" class="nav-section-title">OPERACIONES</div>

        <a *ngIf="canAccess('pos')" routerLink="/pos" routerLinkActive="active" class="nav-item">
          <span class="icon">🛍️</span>
          <span>Punto de Venta</span>
        </a>

        <a *ngIf="canAccess('salon-design')" routerLink="/salon-design" routerLinkActive="active" class="nav-item">
          <span class="icon">📐</span>
          <span>Diseño de Salón</span>
        </a>

        <a *ngIf="canAccess('reservations')" routerLink="/reservations" routerLinkActive="active" class="nav-item">
          <span class="icon">📅</span>
          <span>Reservas</span>
        </a>

        <a *ngIf="canAccess('cash-history')" routerLink="/cash-history" routerLinkActive="active" class="nav-item">
          <span class="icon">🧾</span>
          <span>Caja / Historial</span>
        </a>

        <a *ngIf="canAccess('kds')" routerLink="/kds" routerLinkActive="active" class="nav-item">
          <span class="icon">🔥</span>
          <span>Cocina (KDS)</span>
        </a>

        <div *ngIf="canAccess('clients') || canAccess('menu')" class="nav-section-title">GESTIÓN</div>

        <a *ngIf="canAccess('clients')" routerLink="/clients" routerLinkActive="active" class="nav-item">
          <span class="icon">👥</span>
          <span>Clientes</span>
        </a>

        <a *ngIf="canAccess('menu')" routerLink="/menu" routerLinkActive="active" class="nav-item">
          <span class="icon">🍔</span>
          <span>Menú y Productos</span>
        </a>
      </nav>
      <!-- Footer system status -->
      <div class="sidebar-footer">
        <div class="status-indicator">
          <span class="pulse-dot"></span>
          <span>Firebase Online</span>
        </div>
        <div class="version">v2.0 PRO</div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background-color: var(--sidebar-bg);
      color: var(--sidebar-text);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      border-right: 1px solid rgba(255, 255, 255, 0.06);
      z-index: 50;
      user-select: none;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);

      .brand-icon {
        width: 42px;
        height: 42px;
        background: linear-gradient(135deg, #3B82F6, #4F46E5);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
      }

      .brand-text {
        h1 {
          color: #FFFFFF;
          font-size: 18px;
          font-weight: 700;
          font-family: var(--font-title);
          letter-spacing: -0.3px;
        }
        .subtitle {
          font-size: 11px;
          color: #64748B;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }
      }
    }

    .nav-list {
      flex: 1;
      padding: 16px 12px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-section-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--sidebar-section);
      letter-spacing: 1px;
      padding: 18px 12px 6px;
      text-transform: uppercase;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 11px 16px;
      border-radius: var(--radius-md);
      color: var(--sidebar-text);
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s ease;

      .icon {
        font-size: 18px;
        width: 24px;
        text-align: center;
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.06);
        color: var(--sidebar-text-hover);
        transform: translateX(3px);
      }

      &.active {
        background: linear-gradient(90deg, #4F46E5, #4338CA);
        color: var(--sidebar-active-text);
        font-weight: 600;
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
      }
    }

    .sidebar-footer {
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;

      .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #10B981;
        font-weight: 600;

        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: #10B981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10B981;
          animation: pulse 2s infinite;
        }
      }

      .version {
        color: #475569;
        font-weight: 600;
      }
    }

    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
  `]
})
export class SidebarComponent {
  restaurant = inject(RestaurantService);

  canAccess(module: string): boolean {
    const role = (this.restaurant.currentUser().role || '').toLowerCase();
    if (role === 'administrador' || role === 'admin') {
      return true;
    }
    if (role === 'mesero') {
      return ['pos', 'salon-design', 'reservations', 'clients'].includes(module);
    }
    if (role === 'cocinero' || role === 'chef') {
      return ['kds'].includes(module);
    }
    if (role === 'cajero') {
      return ['pos', 'salon-design', 'reservations', 'cash-history', 'clients'].includes(module);
    }
    return true;
  }
}

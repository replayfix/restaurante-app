import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Header -->
      <div class="page-header">
        <div>
          <h2>📊 Panel de Control y Operaciones</h2>
          <p class="subtitle">Bienvenido al sistema integrado "Mi Restaurante". Resumen en tiempo real del día.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" (click)="goToPos()">
            <span>🛒 Abrir Punto de Venta</span>
          </button>
        </div>
      </div>

      <!-- Top KPI Cards Grid -->
      <div class="kpi-grid">
        <div class="kpi-card card">
          <div class="kpi-header">
            <span>VENTA DE HOY</span>
            <span class="icon-tag green">💰</span>
          </div>
          <div class="kpi-body">
            <h3>S/. {{ restaurant.reportsData().totalSales.toFixed(2) }}</h3>
            <div class="progress-meta">
              <span>Meta diaria: S/. 1,500.00</span>
              <span class="percent badge badge-success">82%</span>
            </div>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-header">
            <span>MESAS ACTIVAS / OCUPADAS</span>
            <span class="icon-tag blue">🪑</span>
          </div>
          <div class="kpi-body">
            <h3>{{ occupiedTablesCount() }} / {{ restaurant.tables().length }}</h3>
            <div class="progress-meta">
              <span>Ocupación de salón</span>
              <span class="percent badge badge-info">{{ getOccupancyRate() }}%</span>
            </div>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-header">
            <span>PEDIDOS EN COCINA (KDS)</span>
            <span class="icon-tag yellow">🔥</span>
          </div>
          <div class="kpi-body">
            <h3>{{ restaurant.pendingKdsOrders().length }}</h3>
            <div class="progress-meta">
              <span>Pendientes y en preparación</span>
              <button class="btn-link" (click)="goToKds()">Ver KDS →</button>
            </div>
          </div>
        </div>

        <div class="kpi-card card">
          <div class="kpi-header">
            <span>RESERVAS PARA HOY</span>
            <span class="icon-tag purple">📅</span>
          </div>
          <div class="kpi-body">
            <h3>{{ restaurant.reservations().length }}</h3>
            <div class="progress-meta">
              <span>Visitas agendadas</span>
              <button class="btn-link" (click)="goToReservations()">Ver agenda →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Two Panels Grid -->
      <div class="dashboard-panels">
        <!-- Left Panel: Estado de Salones y Mesas -->
        <div class="card panel-card">
          <div class="panel-header">
            <h4>🗺️ Estado Rápido de Salones</h4>
            <button class="btn btn-secondary btn-sm" (click)="goToSalonDesign()">Configurar Plano</button>
          </div>
          
          <div class="salons-list">
            <div *ngFor="let salon of restaurant.salons()" class="salon-summary-box">
              <div class="salon-name-row">
                <strong>{{ salon.name }}</strong>
                <span class="badge badge-info">{{ getSalonTables(salon.id).length }} mesas</span>
              </div>
              <div class="salon-tables-chips">
                <div
                  *ngFor="let table of getSalonTables(salon.id)"
                  class="table-chip"
                  [ngClass]="table.status"
                  (click)="goToPosTable(table.id)">
                  <span class="t-name">{{ table.name }}</span>
                  <span class="t-status">
                    {{ table.status === 'occupied' ? 'S/. ' + (table.currentAmount || 0).toFixed(0) : (table.status === 'reserved' ? 'Res' : 'Libre') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Productos Estrella Más Vendidos -->
        <div class="card panel-card">
          <div class="panel-header">
            <h4>⭐ Más Vendidos del Día</h4>
            <button class="btn btn-secondary btn-sm" (click)="goToReports()">Ver Reportes</button>
          </div>

          <div class="top-list">
            <div *ngFor="let item of topSellers(); let i = index" class="top-row">
              <div class="rank-badge">#{{ i + 1 }}</div>
              <div class="item-info">
                <span class="name">{{ item.name }}</span>
                <span class="cat">{{ item.category }}</span>
              </div>
              <div class="stats">
                <span class="qty">{{ item.units }} uds</span>
                <span class="rev">S/. {{ item.revenue.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;

      h2 { font-size: 28px; font-weight: 700; font-family: var(--font-title); color: #0F172A; }
      .subtitle { font-size: 14px; color: var(--text-secondary); }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .kpi-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .kpi-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        font-weight: 800;
        color: #64748B;
        letter-spacing: 0.5px;

        .icon-tag {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          &.green { background-color: #D1FAE5; }
          &.blue { background-color: #DBEAFE; }
          &.yellow { background-color: #FEF3C7; }
          &.purple { background-color: #F3E8FF; }
        }
      }

      .kpi-body {
        h3 { font-size: 28px; font-weight: 800; color: #0F172A; font-family: var(--font-title); }

        .progress-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #64748B;
          margin-top: 4px;

          .btn-link {
            background: none;
            border: none;
            color: #3B82F6;
            font-weight: 700;
            cursor: pointer;
            &:hover { text-decoration: underline; }
          }
        }
      }
    }

    .dashboard-panels {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 24px;
    }

    .panel-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #F1F5F9;
        padding-bottom: 14px;
        h4 { font-size: 18px; font-weight: 700; color: #0F172A; }
      }
    }

    .salons-list {
      display: flex;
      flex-direction: column;
      gap: 18px;

      .salon-summary-box {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .salon-name-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 15px;
          color: #1E293B;
        }

        .salon-tables-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;

          .table-chip {
            padding: 8px 14px;
            border-radius: var(--radius-md);
            border: 2px solid #E2E8F0;
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 80px;

            &:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); }

            .t-name { font-weight: 700; font-size: 13px; color: #0F172A; }
            .t-status { font-size: 11px; font-weight: 800; margin-top: 2px; }

            &.available { background-color: #ECFDF5; border-color: #10B981; .t-status { color: #059669; } }
            &.occupied { background-color: #FEF2F2; border-color: #EF4444; .t-status { color: #DC2626; } }
            &.reserved { background-color: #FFFBEB; border-color: #F59E0B; .t-status { color: #D97706; } }
          }
        }
      }
    }

    .top-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .top-row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 14px;
        border-radius: var(--radius-md);
        background-color: #F8FAFC;
        border: 1px solid #F1F5F9;

        .rank-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #EFF6FF;
          color: #2563EB;
          font-weight: 800;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          .name { font-weight: 700; font-size: 14px; color: #0F172A; }
          .cat { font-size: 12px; color: #64748B; }
        }

        .stats {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          .qty { font-size: 12px; color: #64748B; }
          .rev { font-weight: 800; font-size: 15px; color: #10B981; }
        }
      }
    }
  `]
})
export class DashboardComponent {
  restaurant = inject(RestaurantService);
  private router = inject(Router);

  topSellers = computed(() => {
    return this.restaurant.topProductsAnalytics().map(p => ({
      name: p.name,
      category: p.category,
      units: p.quantity,
      revenue: p.revenue
    }));
  });

  occupiedTablesCount(): number {
    return this.restaurant.tables().filter(t => t.status === 'occupied').length;
  }

  getOccupancyRate(): number {
    const total = this.restaurant.tables().length;
    if (total === 0) return 0;
    return Math.round((this.occupiedTablesCount() / total) * 100);
  }

  getSalonTables(salonId: string) {
    return this.restaurant.tables().filter(t => t.salonId === salonId);
  }

  goToPos(): void { this.router.navigate(['/pos']); }
  goToKds(): void { this.router.navigate(['/kds']); }
  goToReservations(): void { this.router.navigate(['/reservations']); }
  goToSalonDesign(): void { this.router.navigate(['/salon-design']); }
  goToReports(): void { this.router.navigate(['/reports']); }
  goToPosTable(tableId: string): void {
    this.restaurant.openOrSelectTableOrder(tableId);
    this.router.navigate(['/pos', tableId]);
  }
}

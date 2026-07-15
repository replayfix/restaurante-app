import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { Table } from '../../../core/models';
import { TableIconComponent } from '../../../shared/components/table-icon/table-icon.component';

@Component({
  selector: 'app-pos-grid',
  standalone: true,
  imports: [CommonModule, TableIconComponent],
  template: `
    <div class="pos-grid-container">
      <!-- Title & Legend Header -->
      <div class="pos-header">
        <div>
          <h2>Punto de Venta</h2>
          <p class="subtitle">Selecciona una mesa para comenzar</p>
        </div>

        <div class="legend">
          <div class="legend-item"><span class="dot available"></span> Disponible</div>
          <div class="legend-item"><span class="dot occupied"></span> Con Consumo</div>
          <div class="legend-item"><span class="dot reserved"></span> Reservada</div>
        </div>
      </div>

      <!-- Salon/Zone Tabs Selector -->
      <div class="salon-selector">
        <button
          *ngFor="let salon of restaurant.salons()"
          class="zone-btn"
          [class.active]="salon.id === restaurant.activeSalonId()"
          (click)="restaurant.activeSalonId.set(salon.id)">
          {{ salon.name }}
        </button>
      </div>

      <!-- Tables Grid Area -->
      <div class="tables-board dotted-canvas">
        <div class="tables-grid">
          <div
            *ngFor="let table of restaurant.activeSalonTables()"
            class="table-card"
            [style.grid-column]="getGridSpan(table.capacity)"
            [ngClass]="table.status"
            (click)="onTableClick(table)">
            
            <!-- Table Header Name with Status Indicator -->
            <div class="table-card-header" [ngClass]="table.status">
              <span class="status-indicator-dot"></span>
              <span class="t-title">{{ table.name.toUpperCase() }}</span>
            </div>

            <!-- Table Center Icon & Status Info -->
            <div class="table-card-body" [ngClass]="table.status">
              <div class="table-icons-row" style="display: flex; gap: 8px; align-items: center; justify-content: center; margin-bottom: 6px;">
                <app-table-icon *ngFor="let i of getTableIconRange(table.capacity)" [status]="table.status" [size]="50"></app-table-icon>
              </div>

              <!-- If table has a reservation today, show clear reservation card -->
              <div *ngIf="table.reservationInfo && table.status === 'reserved'" class="res-card-center">
                <div class="res-time">⏰ {{ table.reservationInfo.time }}</div>
                <div class="res-client">👤 {{ table.reservationInfo.clientName }}</div>
                <div class="res-pax">{{ table.reservationInfo.pax || table.reservationInfo.count || 1 }} persona(s)</div>
              </div>

              <!-- Or if occupied / available, show clean status subtitle -->
              <div *ngIf="table.status !== 'reserved'" class="center-content">
                <div class="status-subtitle">
                  {{ table.status === 'occupied' ? 'Orden en Curso' : (table.capacity ? table.capacity + ' personas' : 'Mesa Lista') }}
                </div>
              </div>
            </div>

            <!-- Table Footer Status Badge -->
            <div class="table-card-footer">
              <span *ngIf="table.status === 'occupied'" class="status-bar occupied">
                🔴 CONSUMO: S/. {{ (table.currentAmount || 0).toFixed(2) }}
              </span>
              <span *ngIf="table.status === 'reserved'" class="status-bar reserved">
                🟡 RESERVADA ({{ table.reservationInfo?.pax || table.reservationInfo?.count || 1 }} PERS)
              </span>
              <span *ngIf="table.status === 'available'" class="status-bar available">
                🟢 LIBRE & DISPONIBLE
              </span>
            </div>
          </div>
        </div>

        <div *ngIf="restaurant.activeSalonTables().length === 0" class="empty-zone">
          <p>No hay mesas configuradas para esta zona. Ve a <strong>Diseño de Salón</strong> para agregar mesas.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pos-grid-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .pos-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;

      h2 {
        font-size: 26px;
        font-weight: 700;
        font-family: var(--font-title);
        color: #0F172A;
      }

      .subtitle {
        font-size: 14px;
        color: var(--text-secondary);
      }

      .legend {
        display: flex;
        align-items: center;
        gap: 18px;
        font-size: 13px;
        font-weight: 600;
        color: #334155;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;

          .dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            &.available { background-color: var(--success); }
            &.occupied { background-color: var(--danger); }
            &.reserved { background-color: var(--warning); }
          }
        }
      }
    }

    .salon-selector {
      display: flex;
      gap: 10px;

      .zone-btn {
        padding: 10px 26px;
        border-radius: var(--radius-md);
        font-weight: 600;
        font-size: 14px;
        background-color: #FFFFFF;
        color: #64748B;
        border: 1px solid var(--card-border);
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: var(--shadow-sm);

        &:hover {
          background-color: #F8FAFC;
          color: #0F172A;
        }

        &.active {
          background-color: #0066FF;
          color: #FFFFFF;
          border-color: #0066FF;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.35);
        }
      }
    }

    .tables-board {
      background-color: #FFFFFF;
      border: 1px solid var(--card-border);
      border-radius: var(--radius-lg);
      padding: 24px;
      min-height: 520px;
    }

    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 24px;
    }

    .table-card {
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;

      &:hover {
        transform: translateY(-4px) scale(1.02);
      }

      /* LIBRE / DISPONIBLE - EMERALD GREEN THEME */
      &.available {
        background: linear-gradient(180deg, #ECFDF5 0%, #FFFFFF 100%);
        border: 2px solid #10B981;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.15);

        &:hover {
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
          border-color: #059669;
        }

        .table-card-header {
          background-color: #D1FAE5;
          color: #065F46;
          border-bottom: 1px solid #A7F3D0;
          .status-indicator-dot { background-color: #10B981; }
        }

        .table-card-body {
          background: transparent;
          .monitor-icon { filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.25)); }
          .status-subtitle { color: #059669; font-weight: 600; }
        }
      }

      /* OCUPADA / CONSUMO - CRIMSON RED THEME */
      &.occupied {
        background: linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%);
        border: 2px solid #EF4444;
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.2);

        &:hover {
          box-shadow: 0 8px 26px rgba(239, 68, 68, 0.35);
          border-color: #DC2626;
        }

        .table-card-header {
          background-color: #FEE2E2;
          color: #991B1B;
          border-bottom: 1px solid #FECACA;
          .status-indicator-dot {
            background-color: #EF4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.3);
            animation: pulse-red 1.5s infinite;
          }
        }

        .table-card-body {
          background: transparent;
          .monitor-icon { filter: drop-shadow(0 2px 6px rgba(239, 68, 68, 0.3)); }
          .status-subtitle { color: #DC2626; font-weight: 700; }
        }
      }

      /* RESERVADA - AMBER GOLD THEME */
      &.reserved {
        background: linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 100%);
        border: 2px solid #F59E0B;
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.18);

        &:hover {
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35);
          border-color: #D97706;
        }

        .table-card-header {
          background-color: #FEF3C7;
          color: #92400E;
          border-bottom: 1px solid #FDE68A;
          .status-indicator-dot { background-color: #F59E0B; }
        }

        .table-card-body {
          background: transparent;
        }
      }

      .table-card-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 12px;
        font-size: 13px;
        font-weight: 800;
        letter-spacing: 0.5px;

        .status-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      }

      .table-card-body {
        padding: 16px 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 110px;

        .center-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .res-card-center {
          background: #FEF3C7;
          border: 1px dashed #F59E0B;
          border-radius: 8px;
          padding: 8px 12px;
          text-align: center;
          width: 95%;

          .res-time { font-size: 14px; font-weight: 800; color: #92400E; margin-bottom: 2px; }
          .res-client { font-size: 12px; font-weight: 700; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .res-pax { font-size: 11px; color: #78350F; margin-top: 2px; }
        }

        .monitor-icon {
          font-size: 40px;
          line-height: 1;
        }

        .status-subtitle {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      .table-card-footer {
        display: flex;

        .status-bar {
          width: 100%;
          text-align: center;
          padding: 10px 6px;
          font-size: 12px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: 0.5px;

          &.occupied {
            background: linear-gradient(90deg, #DC2626 0%, #EF4444 100%);
          }
          &.reserved {
            background: linear-gradient(90deg, #D97706 0%, #F59E0B 100%);
            color: #FFFFFF;
          }
          &.available {
            background: linear-gradient(90deg, #059669 0%, #10B981 100%);
          }
        }
      }
    }

    @keyframes pulse-red {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.25); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    .empty-zone {
      text-align: center;
      padding: 60px 20px;
      color: #94A3B8;
    }
  `]
})
export class PosGridComponent {
  restaurant = inject(RestaurantService);
  private router = inject(Router);

  onTableClick(table: Table): void {
    this.restaurant.openOrSelectTableOrder(table.id);
    this.router.navigate(['/pos', table.id]);
  }

  getGridSpan(capacity?: number): string {
    const pax = capacity || 4;
    const span = Math.min(4, Math.max(1, Math.ceil(pax / 4)));
    return `span ${span}`;
  }

  getTableIconRange(capacity?: number): number[] {
    const pax = capacity || 4;
    const count = Math.min(4, Math.max(1, Math.ceil(pax / 4)));
    return Array.from({ length: count }, (_, i) => i);
  }
}

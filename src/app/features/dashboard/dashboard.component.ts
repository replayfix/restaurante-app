import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

      <!-- Role / Mode Selection Hero Section -->
      <div class="role-selector-section">
        <div class="role-selector-header">
          <div class="header-text">
            <h3>🚀 ¿Cómo vas a operar hoy? Elige tu Modo de Sesión</h3>
            <p>Selecciona tu estación o rol y asigna tu nombre al iniciar en el sistema para trazabilidad en pedidos, propinas y caja:</p>
          </div>
          <div class="active-user-chip" *ngIf="restaurant.currentUser() as user">
            <span class="user-avatar">{{ user.avatar || '👤' }}</span>
            <div class="user-detail">
              <span class="u-label">Sesión actual:</span>
              <span class="u-name">{{ user.name }}</span>
              <span class="u-role badge" [ngClass]="getRoleBadgeClass(user.role)">{{ user.role }}</span>
            </div>
          </div>
        </div>

        <div class="role-cards-grid">
          <!-- Modo Mesero -->
          <div class="role-card card-mesero" [class.active-card]="restaurant.currentUser().role === 'Mesero'" (click)="openRoleModal('Mesero')">
            <div class="role-icon-wrapper">
              <span class="role-emoji">🍽️</span>
            </div>
            <div class="role-card-content">
              <div class="role-title-row">
                <h4>Modo Mesero</h4>
                <span class="role-arrow">➔</span>
              </div>
              <p>Asigna tu nombre (Ej. Carlos, Jonathan) para tomar pedidos y trazabilidad en Salón.</p>
            </div>
          </div>

          <!-- Modo Cajero / Admin -->
          <div class="role-card card-admin" [class.active-card]="restaurant.currentUser().role === 'Administrador' || restaurant.currentUser().role === 'Cajero'" (click)="openRoleModal('Administrador')">
            <div class="role-icon-wrapper">
              <span class="role-emoji">💻</span>
            </div>
            <div class="role-card-content">
              <div class="role-title-row">
                <h4>Modo Cajero / Admin</h4>
                <span class="role-arrow">➔</span>
              </div>
              <p>Asigna quién cobra en caja, gestiona reportes y cierres de turno.</p>
            </div>
          </div>

          <!-- Modo Cocinero (KDS) -->
          <div class="role-card card-cocinero" [class.active-card]="restaurant.currentUser().role === 'Cocinero'" (click)="openRoleModal('Cocinero')">
            <div class="role-icon-wrapper">
              <span class="role-emoji">🔥</span>
            </div>
            <div class="role-card-content">
              <div class="role-title-row">
                <h4>Modo Cocinero (KDS)</h4>
                <span class="role-arrow">➔</span>
              </div>
              <p>Pantalla de cocina para recibir, preparar y marcar platos como listos.</p>
            </div>
          </div>
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

      <!-- Modal de Identificación y Selección de Rol -->
      <div class="modal-backdrop" *ngIf="showRoleModal()">
        <div class="modal-card role-modal-card">
          <div class="modal-header-row">
            <div class="modal-title-with-icon">
              <span class="m-icon">{{ getRoleModalIcon() }}</span>
              <h3>{{ getRoleModalTitle() }}</h3>
            </div>
            <button class="btn-close-x" (click)="closeRoleModal()">×</button>
          </div>

          <p class="role-modal-desc">{{ getRoleModalDesc() }}</p>

          <!-- Sugerencias de usuarios guardados -->
          <div class="quick-staff-list" *ngIf="getStaffByRole(selectedRole()).length > 0">
            <label class="section-label">⚡ Seleccionar de perfiles guardados:</label>
            <div class="chips-container">
              <button
                *ngFor="let s of getStaffByRole(selectedRole())"
                class="staff-chip"
                [class.selected]="staffNameInput === s.name"
                (click)="selectQuickStaff(s)">
                <span class="chip-avatar">{{ s.avatar }}</span>
                <span class="chip-name">{{ s.name }}</span>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="section-label">{{ getRoleInputLabel() }}</label>
            <input
              type="text"
              [(ngModel)]="staffNameInput"
              [placeholder]="getRoleInputPlaceholder()"
              class="form-input role-input"
              (keyup.enter)="confirmRoleSelection()"
              autofocus
            />
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="closeRoleModal()">Cancelar</button>
            <button class="btn btn-primary btn-launch-role" [disabled]="!staffNameInput.trim()" (click)="confirmRoleSelection()">
              <span>🚀 Continuar al {{ getTargetRouteName() }} →</span>
            </button>
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

    /* Estilos para el Selector de Rol en el Dashboard */
    .role-selector-section {
      background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
      border: 1px solid #E2E8F0;
      border-radius: 20px;
      padding: 26px 28px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);

      .role-selector-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 16px;

        .header-text {
          h3 { font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 6px 0; display: flex; align-items: center; gap: 8px; }
          p { font-size: 14px; color: #64748B; margin: 0; max-width: 650px; line-height: 1.5; }
        }

        .active-user-chip {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: #EFF6FF;
          border: 1.5px solid #BFDBFE;
          border-radius: 14px;

          .user-avatar {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: #2563EB;
            color: white;
            font-weight: 800;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .user-detail {
            display: flex;
            flex-direction: column;
            .u-label { font-size: 11px; color: #64748B; font-weight: 600; text-transform: uppercase; }
            .u-name { font-size: 14px; font-weight: 800; color: #1E3A8A; }
            .u-role { font-size: 11px; margin-top: 2px; }
          }
        }
      }

      .role-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 18px;
        margin-top: 22px;

        .role-card {
          display: flex;
          align-items: flex-start;
          gap: 18px;
          padding: 20px;
          border-radius: 16px;
          background: white;
          border: 2px solid #E2E8F0;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          position: relative;
          overflow: hidden;

          &:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
          }

          .role-icon-wrapper {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            background: #F1F5F9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            transition: all 0.25s ease;
            flex-shrink: 0;
          }

          .role-card-content {
            flex: 1;
            min-width: 0;

            .role-title-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 6px;

              h4 { font-size: 17px; font-weight: 800; color: #0F172A; margin: 0; }
              .role-arrow { font-size: 18px; font-weight: 800; color: #94A3B8; transition: transform 0.2s; }
            }

            p { font-size: 13px; color: #64748B; margin: 0; line-height: 1.45; }
          }

          &.card-mesero {
            &:hover, &.active-card {
              border-color: #3B82F6;
              background: linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%);
              .role-icon-wrapper { background: #3B82F6; color: white; transform: scale(1.08) rotate(-5deg); }
              .role-arrow { transform: translateX(5px); color: #2563EB; }
            }
          }

          &.card-admin {
            &:hover, &.active-card {
              border-color: #10B981;
              background: linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%);
              .role-icon-wrapper { background: #10B981; color: white; transform: scale(1.08) rotate(5deg); }
              .role-arrow { transform: translateX(5px); color: #059669; }
            }
          }

          &.card-cocinero {
            &:hover, &.active-card {
              border-color: #F59E0B;
              background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%);
              .role-icon-wrapper { background: #F59E0B; color: white; transform: scale(1.08) rotate(-5deg); }
              .role-arrow { transform: translateX(5px); color: #D97706; }
            }
          }
        }
      }
    }

    /* Modal Estilos */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 20px;

      .role-modal-card {
        background: white;
        border-radius: 20px;
        padding: 28px;
        width: 100%;
        max-width: 520px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);

        .modal-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;

          .modal-title-with-icon {
            display: flex;
            align-items: center;
            gap: 12px;
            .m-icon { font-size: 26px; }
            h3 { font-size: 20px; font-weight: 800; color: #0F172A; margin: 0; }
          }

          .btn-close-x {
            background: #F1F5F9;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            font-size: 22px;
            color: #64748B;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            &:hover { background: #E2E8F0; color: #0F172A; }
          }
        }

        .role-modal-desc {
          font-size: 14px;
          color: #475569;
          line-height: 1.5;
          margin: 0 0 20px 0;
          padding-bottom: 16px;
          border-bottom: 1px solid #F1F5F9;
        }

        .quick-staff-list {
          margin-bottom: 20px;
          .section-label { font-size: 13px; font-weight: 700; color: #334155; display: block; margin-bottom: 10px; }
          
          .chips-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;

            .staff-chip {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 8px 14px;
              border-radius: 12px;
              border: 1.5px solid #E2E8F0;
              background: #F8FAFC;
              cursor: pointer;
              transition: all 0.2s;

              &:hover { background: #EFF6FF; border-color: #BFDBFE; }
              &.selected { background: #2563EB; border-color: #2563EB; color: white; .chip-avatar { background: white; color: #2563EB; } }

              .chip-avatar {
                width: 24px;
                height: 24px;
                border-radius: 6px;
                background: #E2E8F0;
                color: #334155;
                font-weight: 800;
                font-size: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
              }

              .chip-name { font-size: 13px; font-weight: 700; }
            }
          }
        }

        .form-group {
          margin-bottom: 24px;
          .section-label { font-size: 14px; font-weight: 700; color: #1E293B; display: block; margin-bottom: 8px; }
          .role-input {
            width: 100%;
            padding: 14px 16px;
            font-size: 16px;
            font-weight: 600;
            border: 2px solid #CBD5E1;
            border-radius: 12px;
            outline: none;
            transition: border-color 0.2s;
            &:focus { border-color: #2563EB; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
          }
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;

          .btn-launch-role {
            padding: 12px 24px;
            font-size: 15px;
            font-weight: 700;
            border-radius: 12px;
          }
        }
      }
    }

    @keyframes modalSlideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
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

  // --- Role / Session Selection Methods ---
  showRoleModal = signal(false);
  selectedRole = signal<'Mesero' | 'Administrador' | 'Cajero' | 'Cocinero'>('Mesero');
  staffNameInput = '';

  openRoleModal(role: 'Mesero' | 'Administrador' | 'Cajero' | 'Cocinero'): void {
    this.selectedRole.set(role);
    if (role === 'Mesero') {
      this.staffNameInput = 'Carlos';
    } else if (role === 'Cocinero') {
      this.staffNameInput = 'Chef Principal';
    } else {
      this.staffNameInput = 'Administrador';
    }
    const current = this.restaurant.currentUser();
    if (current && (current.role === role || (role === 'Administrador' && current.role === 'Cajero'))) {
      this.staffNameInput = current.name;
    }
    this.showRoleModal.set(true);
  }

  closeRoleModal(): void {
    this.showRoleModal.set(false);
  }

  getStaffByRole(role: string) {
    return this.restaurant.staff().filter(s => {
      if (role === 'Administrador' || role === 'Cajero') {
        return s.role === 'Administrador' || s.role === 'Cajero';
      }
      return s.role === role;
    });
  }

  selectQuickStaff(staff: any): void {
    this.staffNameInput = staff.name;
  }

  getRoleModalIcon(): string {
    const role = this.selectedRole();
    if (role === 'Mesero') return '🍽️';
    if (role === 'Cocinero') return '🔥';
    return '💻';
  }

  getRoleModalTitle(): string {
    const role = this.selectedRole();
    if (role === 'Mesero') return 'Iniciar como Mesero (Atención en Salón)';
    if (role === 'Cocinero') return 'Iniciar como Cocinero (Monitor KDS)';
    return 'Iniciar en Caja / Administración';
  }

  getRoleModalDesc(): string {
    const role = this.selectedRole();
    if (role === 'Mesero') return 'Al ingresar tu nombre, las cuentas y tickets que abras en el Salón registrarán que tú las estás atendiendo para el historial y propinas.';
    if (role === 'Cocinero') return 'Entra al monitor en vivo para visualizar, preparar y notificar platos listos al equipo de meseros.';
    return 'Tendrás control de cobro de mesas, cortes de caja y métricas generales del restaurante.';
  }

  getRoleInputLabel(): string {
    const role = this.selectedRole();
    if (role === 'Mesero') return '👤 ¿Cuál es tu nombre de Mesero?';
    if (role === 'Cocinero') return '👨‍🍳 Nombre del Chef / Estación:';
    return '💼 Nombre de Cajero o Administrador:';
  }

  getRoleInputPlaceholder(): string {
    const role = this.selectedRole();
    if (role === 'Mesero') return 'Ej. Carlos, Jonathan, Sofía...';
    if (role === 'Cocinero') return 'Ej. Chef Jonathan, Cocina Caliente...';
    return 'Ej. Jonathan, Administrador Principal...';
  }

  getTargetRouteName(): string {
    const role = this.selectedRole();
    if (role === 'Mesero') return 'Mapa de Mesas (POS)';
    if (role === 'Cocinero') return 'Monitor de Cocina (KDS)';
    return 'Panel y Caja';
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'Mesero') return 'badge-info';
    if (role === 'Cocinero') return 'badge-warning';
    return 'badge-success';
  }

  confirmRoleSelection(): void {
    const name = this.staffNameInput.trim();
    if (!name) return;

    const role = this.selectedRole();
    let existing = this.restaurant.staff().find(s => s.name.toLowerCase() === name.toLowerCase() && (s.role === role || (role === 'Administrador' && s.role === 'Cajero')));
    if (!existing) {
      existing = {
        id: 'staff-' + Date.now(),
        name: name,
        role: role as any,
        avatar: role === 'Cocinero' ? '👨‍🍳' : (role === 'Mesero' ? '🍽️' : name.charAt(0).toUpperCase())
      };
    }

    this.restaurant.switchUser(existing);
    this.showRoleModal.set(false);

    if (role === 'Mesero') {
      this.router.navigate(['/pos']);
    } else if (role === 'Cocinero') {
      this.router.navigate(['/kds']);
    } else {
      this.restaurant.notify.success({
        title: '💻 Sesión de Admin / Cajero Activa',
        message: `Has ingresado como "${name}" (${role}). Tienes acceso total a caja, reportes y configuración del sistema.`,
        confirmText: '¡Aceptar!'
      });
    }
  }
}

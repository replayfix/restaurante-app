import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RestaurantService } from '../../services/restaurant.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="topbar">
      <div class="topbar-left">
        <div class="badge-system">
          <span>Sistema de Restaurante</span>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Quick stats / alerts indicator -->
        <div class="alert-badge" *ngIf="restaurant.lowStockProducts().length > 0">
          <span class="icon">📦</span>
          <span>Alertas de Stock: {{ restaurant.lowStockProducts().length }}</span>
        </div>

        <div class="user-profile" (click)="showProfileModal = true">
          <div class="user-info">
            <span class="user-name">{{ restaurant.currentUser().name }}</span>
            <span class="user-role">{{ restaurant.currentUser().role }}</span>
          </div>
          <div class="user-avatar">
            <span>{{ restaurant.currentUser().avatar || 'A' }}</span>
          </div>
          <span class="dropdown-chevron">﹀</span>
        </div>
      </div>
    </header>

    <!-- Modal Elegante para Cambiar de Puesto / Terminal / Login inicial -->
    <div class="profile-modal-backdrop" *ngIf="showProfileModal" (click)="closeProfileModal()">
      <div class="profile-modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-title">
            <h3>📱 Modo de Operación y Usuario</h3>
            <button class="btn-close" (click)="closeProfileModal()">×</button>
          </div>
          <p *ngIf="!selectedRoleMode">Selecciona el modo o puesto con el que vas a operar hoy en el sistema:</p>
          <p *ngIf="selectedRoleMode === 'Mesero'">👤 Escribe el nombre del <strong>Mesero</strong> que operará en este turno o elige uno existente:</p>
          <p *ngIf="selectedRoleMode === 'Cajero'">💻 Escribe el nombre del <strong>Cajero / Administrador</strong> o elige uno existente:</p>
          <p *ngIf="selectedRoleMode === 'Cocinero'">🔥 Escribe el nombre del <strong>Chef / Estación de Cocina</strong> o elige uno existente:</p>
        </div>

        <!-- Paso 1: Botones de Modo / Puesto -->
        <div class="role-modes-grid" *ngIf="!selectedRoleMode">
          <div class="role-mode-card mesero" (click)="chooseRoleMode('Mesero')">
            <span class="mode-icon">🍽️</span>
            <div class="mode-text">
              <h4>Modo Mesero</h4>
              <p>Asigna tu nombre (Ej. Carlos, Jonathan) para tomar pedidos y trazabilidad en Salón.</p>
            </div>
            <span class="mode-arrow">➔</span>
          </div>

          <div class="role-mode-card cajero" (click)="chooseRoleMode('Cajero')">
            <span class="mode-icon">💻</span>
            <div class="mode-text">
              <h4>Modo Cajero / Admin</h4>
              <p>Asigna quién cobra en caja, gestiona reportes y cierres de turno.</p>
            </div>
            <span class="mode-arrow">➔</span>
          </div>

          <div class="role-mode-card cocinero" (click)="chooseRoleMode('Cocinero')">
            <span class="mode-icon">🔥</span>
            <div class="mode-text">
              <h4>Modo Cocinero (KDS)</h4>
              <p>Pantalla de cocina para recibir, preparar y marcar platos como listos.</p>
            </div>
            <span class="mode-arrow">➔</span>
          </div>
        </div>

        <!-- Paso 2: Asignar o Elegir Nombre exacto (Mesero / Cajero / Cocinero) -->
        <div class="assign-name-section" *ngIf="selectedRoleMode">
          <div class="custom-name-box">
            <label>✍️ Nombre del {{ selectedRoleMode }}:</label>
            <div class="input-confirm-row">
              <input
                type="text"
                [(ngModel)]="customStaffName"
                [placeholder]="selectedRoleMode === 'Mesero' ? 'Ej. Carlos, Jonathan, María...' : (selectedRoleMode === 'Cocinero' ? 'Ej. Chef Carlos, Cocina Principal...' : 'Ej. Administrador, Jonathan, Sara...')"
                class="name-input"
                (keyup.enter)="confirmCustomUser()"
                #nameInput
              />
              <button class="btn-confirm" [disabled]="!customStaffName.trim()" (click)="confirmCustomUser()">
                <span>🚀 Entrar</span>
              </button>
            </div>
          </div>

          <div class="existing-users-section" *ngIf="filteredStaffByRole().length > 0">
            <label class="section-subtitle">O elige un {{ selectedRoleMode.toLowerCase() }} registrado anteriormente:</label>
            <div class="profile-options-list">
              <div 
                *ngFor="let member of filteredStaffByRole()" 
                class="profile-option-item"
                [class.active]="restaurant.currentUser().id === member.id"
                (click)="selectUser(member)">
                <div class="option-avatar" [ngClass]="(member.role || '').toLowerCase()">{{ member.avatar || member.name.charAt(0) }}</div>
                <div class="option-info">
                  <span class="option-name">{{ member.name }}</span>
                  <span class="option-role">{{ member.role }}</span>
                </div>
                <span class="option-check" *ngIf="restaurant.currentUser().id === member.id">✓</span>
              </div>
            </div>
          </div>

          <div class="back-link-row">
            <button class="btn-back" (click)="selectedRoleMode = null; customStaffName = ''">← Volver a elegir puesto</button>
          </div>
        </div>

        <div class="modal-footer">
          <p class="role-hint">💡 <strong>Tip en vivo:</strong> Cada mesero o cajero quedará registrado con su nombre en todas las órdenes, cuentas y boletas que procese desde su dispositivo.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .topbar {
      height: 72px;
      background-color: #FFFFFF;
      border-bottom: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      position: sticky;
      top: 0;
      z-index: 40;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
    }

    .badge-system {
      background-color: #F1F5F9;
      color: #334155;
      font-weight: 600;
      font-size: 15px;
      padding: 8px 18px;
      border-radius: var(--radius-md);
      border: 1px solid #E2E8F0;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .alert-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: var(--danger-bg);
      color: var(--danger);
      font-weight: 600;
      font-size: 13px;
      padding: 6px 14px;
      border-radius: 9999px;
      border: 1px solid #FCA5A5;
      animation: bounce 2s infinite;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 6px 12px;
      border-radius: var(--radius-md);
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #F8FAFC;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        text-align: right;

        .user-name {
          font-weight: 700;
          font-size: 14px;
          color: #1E293B;
          line-height: 1.2;
        }

        .user-role {
          font-size: 12px;
          color: #64748B;
        }
      }

      .user-avatar {
        width: 40px;
        height: 40px;
        background-color: #EC4899;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 16px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(236, 72, 153, 0.35);
      }

      .dropdown-chevron {
        font-size: 10px;
        color: #94A3B8;
        margin-left: 2px;
      }
    }

    .profile-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(4px);
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.15s ease;
    }

    .profile-modal-card {
      background: #FFFFFF;
      width: 100%;
      max-width: 420px;
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .modal-header {
      .header-title {
        display: flex;
        align-items: center;
        justify-content: space-between;

        h3 {
          font-size: 18px;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #94A3B8;
          cursor: pointer;
          line-height: 1;
          &:hover { color: #1E293B; }
        }
      }

      p {
        font-size: 13px;
        color: #64748B;
        margin: 6px 0 0 0;
        line-height: 1.4;
      }
    }

    .role-modes-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px 0 10px 0;
    }

    .role-mode-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
      border-radius: var(--radius-lg);
      border: 1.5px solid #E2E8F0;
      background: #FFFFFF;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      }

      .mode-icon { font-size: 28px; }
      .mode-text {
        flex: 1;
        h4 { margin: 0; font-size: 16px; font-weight: 700; color: #0F172A; }
        p { margin: 3px 0 0 0; font-size: 13px; color: #64748B; }
      }
      .mode-arrow { font-size: 18px; color: #94A3B8; font-weight: bold; }

      &.mesero:hover { border-color: #10B981; background: #ECFDF5; .mode-arrow { color: #10B981; } }
      &.cajero:hover { border-color: #8B5CF6; background: #F5F3FF; .mode-arrow { color: #8B5CF6; } }
      &.cocinero:hover { border-color: #F59E0B; background: #FFFBEB; .mode-arrow { color: #F59E0B; } }
    }

    .assign-name-section {
      padding: 16px 0 8px 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .custom-name-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: var(--radius-lg);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      label { font-weight: 700; font-size: 14px; color: #1E293B; }
    }

    .input-confirm-row {
      display: flex;
      gap: 10px;

      .name-input {
        flex: 1;
        padding: 10px 14px;
        border-radius: var(--radius-md);
        border: 1.5px solid #CBD5E1;
        font-size: 15px;
        color: #0F172A;
        outline: none;
        &:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
      }

      .btn-confirm {
        background: #3B82F6;
        color: #FFF;
        border: none;
        border-radius: var(--radius-md);
        padding: 0 20px;
        font-weight: 700;
        font-size: 15px;
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: background 0.2s;
        &:hover:not(:disabled) { background: #2563EB; }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }
    }

    .existing-users-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      .section-subtitle { font-size: 13px; font-weight: 700; color: #64748B; }
    }

    .back-link-row {
      display: flex;
      justify-content: flex-start;
      margin-top: 4px;

      .btn-back {
        background: none;
        border: none;
        color: #64748B;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        &:hover { background: #F1F5F9; color: #0F172A; }
      }
    }

    .profile-options-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 240px;
      overflow-y: auto;
    }

    .profile-option-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: var(--radius-md);
      border: 1.5px solid #E2E8F0;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: #3B82F6;
        background-color: #EFF6FF;
      }

      &.active {
        border-color: #3B82F6;
        background-color: #EFF6FF;
        box-shadow: 0 2px 6px rgba(59, 130, 246, 0.12);
      }

      .option-avatar {
        width: 42px;
        height: 42px;
        border-radius: 50%;
        background-color: #3B82F6;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.administrador { background-color: #EC4899; }
        &.mesero { background-color: #10B981; }
        &.cocinero { background-color: #F59E0B; }
        &.cajero { background-color: #8B5CF6; }
      }

      .option-info {
        display: flex;
        flex-direction: column;
        flex: 1;

        .option-name {
          font-weight: 700;
          font-size: 15px;
          color: #1E293B;
        }

        .option-role {
          font-size: 12px;
          color: #64748B;
          font-weight: 600;
        }
      }

      .option-check {
        font-size: 18px;
        font-weight: 800;
        color: #3B82F6;
      }
    }

    .modal-footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 14px;

      .role-hint {
        font-size: 12px;
        color: #64748B;
        margin: 0;
        line-height: 1.4;
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
  `]
})
export class TopbarComponent implements OnInit {
  restaurant = inject(RestaurantService);
  router = inject(Router);
  showProfileModal = false;
  selectedRoleMode: string | null = null;
  customStaffName: string = '';

  ngOnInit(): void {
    if (!sessionStorage.getItem('restaurante_session_mode_selected')) {
      setTimeout(() => {
        this.showProfileModal = true;
      }, 300);
    }
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    this.selectedRoleMode = null;
    this.customStaffName = '';
  }

  chooseRoleMode(role: string): void {
    this.selectedRoleMode = role;
    this.customStaffName = '';
  }

  selectDirectChef(): void {
    const chef = this.restaurant.staff().find(s => (s.role || '').toLowerCase() === 'cocinero' || (s.role || '').toLowerCase() === 'chef') || {
      id: 'staff-3',
      name: 'Chef Ejecutivo',
      role: 'Cocinero',
      avatar: 'C'
    };
    this.selectUser(chef);
  }

  filteredStaffByRole(): any[] {
    if (!this.selectedRoleMode) return [];
    const target = this.selectedRoleMode.toLowerCase();
    return this.restaurant.staff().filter(s => {
      const r = (s.role || '').toLowerCase();
      if (target === 'mesero') return r === 'mesero';
      if (target === 'cajero') return r === 'cajero' || r === 'administrador';
      if (target === 'cocinero') return r === 'cocinero' || r === 'chef';
      return false;
    });
  }

  confirmCustomUser(): void {
    const name = this.customStaffName.trim();
    if (!name || !this.selectedRoleMode) return;

    const idPrefix = this.selectedRoleMode.toLowerCase() === 'mesero' ? 'mesero-' : (this.selectedRoleMode.toLowerCase() === 'cocinero' ? 'cocinero-' : 'cajero-');
    const cleanId = idPrefix + name.toLowerCase().replace(/\s+/g, '-');
    const roleName = this.selectedRoleMode === 'Mesero' ? 'Mesero' : (this.selectedRoleMode === 'Cocinero' ? 'Cocinero' : (name.toLowerCase().includes('admin') ? 'Administrador' : 'Cajero'));

    const newStaff = {
      id: cleanId,
      name: name,
      role: roleName,
      avatar: roleName === 'Cocinero' ? '👨‍🍳' : (roleName === 'Mesero' ? '🍽️' : name.charAt(0).toUpperCase())
    };

    this.selectUser(newStaff);
  }

  selectUser(member: any): void {
    sessionStorage.setItem('restaurante_session_mode_selected', 'true');
    this.restaurant.switchUser(member);
    this.closeProfileModal();
    const role = (member.role || '').toLowerCase();
    if (role === 'cocinero' || role === 'chef') {
      this.router.navigate(['/kds']);
    } else if (role === 'mesero' && (this.router.url.includes('dashboard') || this.router.url.includes('reports') || this.router.url.includes('menu'))) {
      this.router.navigate(['/salon-design']);
    } else if ((role === 'cajero' || role === 'administrador') && (this.router.url.includes('menu') || this.router.url.includes('kds'))) {
      this.router.navigate(['/pos']);
    }
  }
}

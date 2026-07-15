import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';
import { PrintService } from '../../core/services/print.service';
import { NotificationModalService } from '../../core/services/notification-modal.service';
import { CashTransaction, PaymentMethod } from '../../core/models';

@Component({
  selector: 'app-cash-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cash-page animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">🧾 Caja y Registro de Historial</h2>
          <p class="page-subtitle">Control financiero en vivo, balance por método de pago (S/.) y auditoría de turnos</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="showNewTransModal.set(true)">
            <span>➕ Registrar Movimiento</span>
          </button>
          <button class="btn btn-danger" (click)="openZReportModal()">
            <span>🔒 Cierre de Caja (Z)</span>
          </button>
        </div>
      </div>

      <!-- Financial Summary Cards -->
      <div class="stats-grid">
        <div class="stat-card card border-l-green">
          <div class="stat-icon bg-green-light">💵</div>
          <div class="stat-content">
            <span class="stat-label">Efectivo en Caja</span>
            <span class="stat-value">S/. {{ cashBalance().toFixed(2) }}</span>
            <span class="stat-detail">Apertura: S/. {{ openingBalance().toFixed(2) }} + Ventas y Egresos</span>
          </div>
        </div>

        <div class="stat-card card border-l-blue">
          <div class="stat-icon bg-blue-light">💳</div>
          <div class="stat-content">
            <span class="stat-label">Ventas con Tarjeta</span>
            <span class="stat-value">S/. {{ cardTotal().toFixed(2) }}</span>
            <span class="stat-detail">Visa, Mastercard y Amex directas</span>
          </div>
        </div>

        <div class="stat-card card border-l-purple">
          <div class="stat-icon bg-purple-light">📱</div>
          <div class="stat-content">
            <span class="stat-label">Transferencias / QR</span>
            <span class="stat-value">S/. {{ transferTotal().toFixed(2) }}</span>
            <span class="stat-detail">Yape, Plin y transferencias bancarias</span>
          </div>
        </div>

        <div class="stat-card card border-l-gold">
          <div class="stat-icon bg-gold-light">💰</div>
          <div class="stat-content">
            <span class="stat-label">Total Ingresos Turno</span>
            <span class="stat-value text-gold">S/. {{ totalIncome().toFixed(2) }}</span>
            <span class="stat-detail">{{ transactions().length }} movimientos registrados</span>
          </div>
        </div>
      </div>

      <!-- Filter Tabs & Search -->
      <div class="controls-bar card">
        <div class="filter-tabs">
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'all'" 
            (click)="activeTab.set('all')">
            Todos ({{ transactions().length }})
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'sale'" 
            (click)="activeTab.set('sale')">
            Ventas / Cobros
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'opening'" 
            (click)="activeTab.set('opening')">
            Aperturas
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'expense'" 
            (click)="activeTab.set('expense')">
            Egresos / Gastos
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'closing'" 
            (click)="activeTab.set('closing')">
            Cierres (Z)
          </button>
        </div>

        <div class="search-box">
          <input 
            type="text" 
            [ngModel]="searchQuery()" 
            (ngModelChange)="searchQuery.set($event)"
            placeholder="🔍 Buscar por folio, cajero o descripción..."
            class="search-input" />
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="table-container card">
        <table class="data-table">
          <thead>
            <tr>
              <th>FOLIO / ID</th>
              <th>TIPO</th>
              <th>DESCRIPCIÓN</th>
              <th>MÉTODO PAGO</th>
              <th>RESPONSABLES (COBRÓ / ATENDIÓ)</th>
              <th>FECHA Y HORA</th>
              <th class="text-right">MONTO</th>
              <th class="text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            @for (trans of filteredTransactions(); track trans.id) {
              <tr class="table-row">
                <td class="font-mono font-bold text-accent">{{ trans.folio || trans.id.slice(-6) }}</td>
                <td>
                  <span class="badge" [ngClass]="getTypeBadgeClass(trans.type)">
                    {{ getTypeLabel(trans.type) }}
                  </span>
                <td class="desc-cell">{{ formatDescription(trans) }}</td>
                <td>
                  <span class="pay-badge" [ngClass]="trans.paymentMethod.toLowerCase()">
                    {{ trans.paymentMethod }}
                  </span>
                </td>
                <td>
                  <div class="staff-audit-cell">
                    <div class="staff-tag cashier">
                      <div class="avatar-mini cashier-bg">{{ (trans.cashier || 'C').charAt(0) }}</div>
                      <span><strong>Cobró:</strong> {{ trans.cashier }}</span>
                    </div>
                    @if (trans.waiterName) {
                      <div class="staff-tag waiter">
                        <div class="avatar-mini waiter-bg">{{ trans.waiterName.charAt(0) }}</div>
                        <span><strong>Atendió:</strong> {{ trans.waiterName }}</span>
                      </div>
                    }
                  </div>
                </td>
                <td class="time-cell">{{ formatTime(trans.timestamp) }}</td>
                <td class="text-right font-bold" [ngClass]="trans.type === 'expense' ? 'text-red' : 'text-green'">
                  {{ trans.type === 'expense' ? '-' : '+' }} S/. {{ trans.amount.toFixed(2) }}
                </td>
                <td class="text-center actions-cell">
                  @if (trans.orderId) {
                    <button class="btn-action" title="Ver Recibo" (click)="viewOrderReceipt(trans.orderId)">
                      📄
                    </button>
                  }
                  <button class="btn-action" title="Imprimir Comprobante" (click)="printTransaction(trans)">
                    🖨️
                  </button>
                  <button class="btn-action delete-btn" title="Eliminar por confusión" (click)="deleteTransaction(trans)">
                    🗑️
                  </button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-cell">
                  <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <p>No se encontraron transacciones con el filtro actual.</p>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Registrar Movimiento -->
    @if (showNewTransModal()) {
      <div class="modal-overlay animate-fade-in" (click)="showNewTransModal.set(false)">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>➕ Registrar Movimiento de Caja</h3>
            <button class="close-btn" (click)="showNewTransModal.set(false)">✖</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Tipo de Movimiento</label>
              <select [(ngModel)]="newType" class="form-input">
                <option value="expense">Egreso / Gasto de Caja</option>
                <option value="opening">Ingreso Adicional / Fondo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Monto (S/. Soles)</label>
              <input type="number" step="0.50" [(ngModel)]="newAmount" class="form-input" placeholder="Ej. 50.00" />
            </div>
            <div class="form-group">
              <label>Método de Pago</label>
              <select [(ngModel)]="newPayment" class="form-input">
                <option value="CASH">CASH (Efectivo / Soles)</option>
                <option value="CARD">CARD (Tarjeta)</option>
                <option value="TRANSFER">TRANSFER (Transferencia / Yape / Plin)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Descripción / Concepto</label>
              <input type="text" [(ngModel)]="newDesc" class="form-input" placeholder="Ej. Pago de hielo extra o proveedor" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showNewTransModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="saveNewTransaction()">Guardar Movimiento</button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Reporte Z (Cierre de Caja) -->
    @if (showZModal()) {
      <div class="modal-overlay animate-fade-in" (click)="showZModal.set(false)">
        <div class="modal-content card z-report-modal" (click)="$event.stopPropagation()">
          <div class="modal-header bg-slate">
            <h3>🔒 Cierre de Turno - Reporte Z</h3>
            <button class="close-btn" (click)="showZModal.set(false)">✖</button>
          </div>
          <div class="modal-body font-mono">
            <div class="z-header">
              <h4>MI RESTAURANTE - TURNO GENERAL</h4>
              <p>Fecha de Cierre: {{ currentDateStr }}</p>
            </div>
            <hr class="dashed-hr" />
            <div class="z-row">
              <span>(+) Fondo Inicial Apertura:</span>
              <span>S/. {{ openingBalance().toFixed(2) }}</span>
            </div>
            <div class="z-row">
              <span>(+) Total Ventas Efectivo:</span>
              <span>S/. {{ cashSalesTotal().toFixed(2) }}</span>
            </div>
            <div class="z-row">
              <span>(+) Total Ventas Tarjeta:</span>
              <span>S/. {{ cardTotal().toFixed(2) }}</span>
            </div>
            <div class="z-row">
              <span>(+) Total Transferencias/QR:</span>
              <span>S/. {{ transferTotal().toFixed(2) }}</span>
            </div>
            <div class="z-row text-red">
              <span>(-) Egresos / Gastos Caja:</span>
              <span>- S/. {{ totalExpenses().toFixed(2) }}</span>
            </div>
            <hr class="dashed-hr" />
            <div class="z-row total-z">
              <span>EFECTIVO A DECLARAR EN CAJA:</span>
              <span>S/. {{ cashBalance().toFixed(2) }}</span>
            </div>
            <div class="z-row grand-total">
              <span>VENTA TOTAL DEL TURNO:</span>
              <span>S/. {{ (cashSalesTotal() + cardTotal() + transferTotal()).toFixed(2) }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showZModal.set(false)">Cerrar sin Imprimir</button>
            <button class="btn btn-danger" (click)="executeZClosure()">Confirmar e Imprimir Reporte Z</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cash-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      color: #334155;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: #0F172A;
      font-family: var(--font-title);
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      color: #64748B;
      font-size: 14px;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 14px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-secondary {
      background: #FFFFFF;
      color: #334155;
      border: 1px solid #E2E8F0;
    }
    .btn-secondary:hover {
      background: #F8FAFC;
      border-color: #CBD5E1;
    }

    .btn-primary {
      background: #3B82F6;
      color: #FFF;
    }
    .btn-primary:hover {
      background: #2563EB;
      transform: translateY(-2px);
    }

    .btn-danger {
      background: #EF4444;
      color: #FFF;
    }
    .btn-danger:hover {
      background: #DC2626;
      transform: translateY(-2px);
    }

    .card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      gap: 16px;
    }

    .border-l-green { border-left: 5px solid #10B981; }
    .border-l-blue { border-left: 5px solid #3B82F6; }
    .border-l-purple { border-left: 5px solid #8B5CF6; }
    .border-l-gold { border-left: 5px solid #F59E0B; }

    .stat-icon {
      width: 54px;
      height: 54px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .bg-green-light { background: #D1FAE5; }
    .bg-blue-light { background: #DBEAFE; }
    .bg-purple-light { background: #F3E8FF; }
    .bg-gold-light { background: #FEF3C7; }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-label {
      font-size: 11px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 800;
    }

    .stat-value {
      font-size: 26px;
      font-weight: 800;
      color: #0F172A;
      margin: 4px 0;
      font-family: var(--font-title);
    }

    .stat-detail {
      font-size: 12px;
      color: #64748B;
    }

    .text-gold { color: #D97706; }

    .controls-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
      color: #64748B;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      background: #F1F5F9;
      color: #334155;
    }

    .tab-btn.active {
      background: #3B82F6;
      color: #FFF;
      border-color: #3B82F6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }

    .search-box {
      flex: 1;
      max-width: 340px;
    }

    .search-input {
      width: 100%;
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid #E2E8F0;
      background: #FFFFFF;
      color: #0F172A;
      font-size: 14px;
      outline: none;
    }
    .search-input:focus {
      border-color: #3B82F6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .table-container {
      overflow-x: auto;
      padding: 0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table thead {
      background-color: #F8FAFC;
      border-bottom: 2px solid #E2E8F0;
    }

    .data-table th {
      padding: 14px 20px;
      font-size: 11px;
      font-weight: 800;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table td {
      padding: 16px 20px;
      font-size: 14px;
      border-bottom: 1px solid #F1F5F9;
      color: #334155;
    }

    .table-row:hover td {
      background: #FAFAFA;
    }

    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .text-accent { color: #2563EB; }
    .text-green { color: #10B981; }
    .text-red { color: #EF4444; }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
    }

    .badge-sale { background: #D1FAE5; color: #065F46; }
    .badge-opening { background: #DBEAFE; color: #1E40AF; }
    .badge-expense { background: #FEE2E2; color: #991B1B; }
    .badge-closing { background: #FEF3C7; color: #92400E; }

    .desc-cell { font-weight: 600; color: #0F172A; max-width: 260px; }

    .pay-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .pay-badge.cash { background: #D1FAE5; color: #065F46; }
    .pay-badge.card { background: #DBEAFE; color: #1E40AF; }
    .pay-badge.transfer { background: #F3E8FF; color: #5B21B6; }

    .staff-audit-cell {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 6px 0;
    }

    .staff-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #1E293B;

      strong { font-weight: 700; color: #475569; }
    }

    .avatar-mini {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      color: #FFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12px;
      flex-shrink: 0;
      background: #3B82F6;

      &.cashier-bg { background: #8B5CF6; }
      &.waiter-bg { background: #10B981; }
      &.chef-bg { background: #F59E0B; }
    }

    .time-cell { color: #64748B; font-size: 13px; }
    .actions-cell { display: flex; justify-content: center; gap: 6px; }

    .btn-action {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-action:hover { background: #EFF6FF; border-color: #BFDBFE; transform: scale(1.05); }
    .btn-action.delete-btn:hover { background: #FEF2F2; border-color: #FECACA; }

    .empty-cell { text-align: center; padding: 48px 20px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; color: #94A3B8; }
    .empty-icon { font-size: 40px; margin-bottom: 12px; }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      width: 100%;
      max-width: 460px;
      background: #FFFFFF;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: var(--shadow-xl);
    }

    .z-report-modal { max-width: 420px; }

    .modal-header {
      padding: 20px 24px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: #0F172A; }
    .close-btn { background: none; border: none; color: #64748B; font-size: 18px; cursor: pointer; }

    .modal-body { padding: 24px; }

    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
    
    .form-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
      background: #FFFFFF;
      color: #0F172A;
      font-size: 14px;
      box-sizing: border-box;
    }
    .form-input:focus { border-color: #3B82F6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }

    .modal-footer {
      padding: 16px 24px;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .z-header { text-align: center; margin-bottom: 16px; }
    .z-header h4 { margin: 0 0 6px 0; font-size: 16px; color: #0F172A; font-weight: 800; }
    .z-header p { margin: 0; font-size: 13px; color: #64748B; }

    .dashed-hr { border: none; border-top: 1px dashed #CBD5E1; margin: 16px 0; }
    .z-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; color: #334155; }
    .total-z { font-weight: 800; font-size: 16px; color: #10B981; }
    .grand-total { font-weight: 800; font-size: 18px; color: #2563EB; margin-top: 8px; }

    .animate-fade-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class CashHistoryComponent {
  restaurant = inject(RestaurantService);
  printService = inject(PrintService);
  notify = inject(NotificationModalService);

  activeTab = signal<'all' | 'sale' | 'opening' | 'expense' | 'closing'>('all');
  searchQuery = signal('');

  showNewTransModal = signal(false);
  showZModal = signal(false);

  newType: 'expense' | 'opening' = 'expense';
  newAmount = 0;
  newPayment: PaymentMethod = 'CASH';
  newDesc = '';

  currentDateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  transactions = computed(() => this.restaurant.transactions());

  filteredTransactions = computed(() => {
    const list = this.transactions();
    const tab = this.activeTab();
    const q = this.searchQuery().toLowerCase().trim();

    return list.filter(t => {
      const matchTab = tab === 'all' || t.type === tab;
      const matchSearch = !q || 
        (t.description && t.description.toLowerCase().includes(q)) || 
        (t.cashier && t.cashier.toLowerCase().includes(q)) || 
        (t.folio && t.folio.toLowerCase().includes(q)) ||
        (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q));
      return matchTab && matchSearch;
    });
  });

  activeShiftTransactions = computed(() => {
    const list = this.transactions();
    const lastZ = this.restaurant.lastZClosureTimestamp();
    if (!lastZ) return list;
    return list.filter(t => t.timestamp > lastZ && t.type !== 'closing');
  });

  openingBalance = computed(() => {
    return this.activeShiftTransactions()
      .filter(t => t.type === 'opening')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  cashSalesTotal = computed(() => {
    return this.activeShiftTransactions()
      .filter(t => t.type === 'sale' && t.paymentMethod === 'CASH')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  cardTotal = computed(() => {
    return this.activeShiftTransactions()
      .filter(t => t.type === 'sale' && t.paymentMethod === 'CARD')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  transferTotal = computed(() => {
    return this.activeShiftTransactions()
      .filter(t => t.type === 'sale' && t.paymentMethod === 'TRANSFER')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  totalExpenses = computed(() => {
    return this.activeShiftTransactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  cashBalance = computed(() => {
    return this.openingBalance() + this.cashSalesTotal() - this.totalExpenses();
  });

  totalIncome = computed(() => {
    return this.cashSalesTotal() + this.cardTotal() + this.transferTotal();
  });

  getTypeLabel(type: string): string {
    switch (type) {
      case 'sale': return 'VENTA / COBRO';
      case 'opening': return 'APERTURA / FONDO';
      case 'expense': return 'EGRESO / GASTO';
      case 'closing': return 'CIERRE (Z)';
      default: return type.toUpperCase();
    }
  }

  getTypeBadgeClass(type: string): string {
    return `badge-${type}`;
  }

  formatTime(isoStr: string): string {
    if (!isoStr) return '--:--';
    try {
      return new Date(isoStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  }

  formatDescription(trans: CashTransaction): string {
    if (!trans.description) return '';
    if (trans.type === 'sale') {
      let desc = trans.description;
      if (desc.includes(' - Mesa ')) {
        const parts = desc.split(' - Mesa ');
        if (parts[1]) {
          let tablePart = parts[1].split(' (Atendió:')[0].trim();
          if (tablePart.startsWith('Mesa ')) {
            return tablePart;
          }
          return 'Mesa ' + tablePart;
        }
      } else if (desc.startsWith('Venta Orden ')) {
        const order = this.restaurant.orders().find(o => o.id === trans.orderId || o.folio === trans.folio);
        if (order && order.tableName) return order.tableName;
        const parts = desc.split(' - ');
        if (parts[1]) return parts[1].split(' (')[0].trim();
      }
    }
    return trans.description;
  }

  saveNewTransaction(): void {
    if (this.newAmount <= 0 || !this.newDesc.trim()) {
      this.notify.alert({ title: 'Datos Inválidos', message: 'Por favor ingrese un monto mayor a 0 y una descripción para el movimiento.' });
      return;
    }
    const typeLabel = this.newType === 'expense' ? 'Egreso / Gasto' : 'Fondo / Apertura';
    const amount = this.newAmount;
    this.restaurant.addCashTransaction({
      type: this.newType,
      amount: amount,
      paymentMethod: this.newPayment,
      cashier: this.restaurant.currentUser().name,
      description: this.newDesc.trim(),
      folio: this.newType === 'expense' ? `EG-${Date.now().toString().slice(-4)}` : `ING-${Date.now().toString().slice(-4)}`
    });
    this.newAmount = 0;
    this.newDesc = '';
    this.showNewTransModal.set(false);
    this.notify.success({
      title: '¡Movimiento Registrado!',
      message: `Se ha registrado el ${typeLabel} por S/. ${amount.toFixed(2)} correctamente en la caja.`,
      confirmText: 'Listo'
    });
  }

  openZReportModal(): void {
    this.currentDateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    this.showZModal.set(true);
  }

  executeZClosure(): void {
    const folio = `Z-${Date.now().toString().slice(-4)}`;
    this.restaurant.addCashTransaction({
      type: 'closing',
      amount: this.cashBalance(),
      paymentMethod: 'CASH',
      cashier: this.restaurant.currentUser().name,
      description: `Cierre de Caja Turno - Declarado S/. ${this.cashBalance().toFixed(2)}`,
      folio
    });
    this.restaurant.stopAndClearShiftTimer();
    this.showZModal.set(false);
    
    this.printService.printZReport({
      folio,
      date: new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      opening: this.openingBalance(),
      cashSales: this.cashSalesTotal(),
      cardSales: this.cardTotal(),
      transferSales: this.transferTotal(),
      expenses: this.totalExpenses(),
      cashBalance: this.cashBalance(),
      totalTurno: this.cashSalesTotal() + this.cardTotal() + this.transferTotal()
    });
    this.notify.success({
      title: '¡Cierre Z Completado!',
      message: `El turno de caja fue cerrado con balance S/. ${this.cashBalance().toFixed(2)} y el reporte Z fue enviado a la impresora.`,
      confirmText: 'Aceptar'
    });
  }

  viewOrderReceipt(orderId: string): void {
    const order = this.restaurant.orders().find(o => o.id === orderId || o.folio === orderId);
    if (order) {
      this.printService.printThermalTicket(order);
    } else {
      this.notify.alert({ title: 'Orden No Encontrada', message: `No se encontró el detalle completo en memoria para la Orden ${orderId}.` });
    }
  }

  printTransaction(trans: CashTransaction): void {
    if (trans.orderId || trans.type === 'sale') {
      const order = this.restaurant.orders().find(o => 
        o.id === trans.orderId || 
        o.folio === trans.folio || 
        (trans.description && trans.description.includes(o.folio || '---'))
      );
      if (order) {
        this.printService.printThermalTicket(order);
        return;
      }
    }
    this.printService.printTransactionReceipt(trans);
  }

  async deleteTransaction(trans: CashTransaction): Promise<void> {
    const confirmed = await this.notify.confirm({
      title: '¿Eliminar Registro de Caja?',
      message: `Vas a remover este ${this.getTypeLabel(trans.type)} de S/. ${trans.amount.toFixed(2)}. Si fue por error de digitación, el balance general de caja y reportes asociados se recalcularán al instante.`,
      confirmText: 'Eliminar Registro',
      cancelText: 'Cancelar',
      isDanger: true
    });
    if (confirmed) {
      this.restaurant.deleteCashTransaction(trans.id, trans.orderId);
    }
  }
}

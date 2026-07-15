import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { PrintService } from '../../../core/services/print.service';
import { NotificationModalService } from '../../../core/services/notification-modal.service';
import { Order, PaymentMethod } from '../../../core/models';

@Component({
  selector: 'app-thermal-ticket-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop">
      <div class="payment-modal-card">
        <!-- Header -->
        <div class="modal-header">
          <div>
            <h3>💸 Cobrar Pedido {{ order.folio }}</h3>
            <p class="table-subtitle">{{ order.tableName }} - {{ order.clientName }}</p>
          </div>
          <button class="btn-close" (click)="close.emit()">×</button>
        </div>

        <!-- Total Display -->
        <div class="total-banner">
          <span>TOTAL A COBRAR:</span>
          <span class="total-big">S/. {{ order.total.toFixed(2) }}</span>
        </div>

        <!-- Payment Method Select -->
        <div class="payment-methods">
          <button
            class="method-btn"
            [class.active]="paymentMethod === 'CASH'"
            (click)="paymentMethod = 'CASH'">
            <span class="method-icon">💵</span>
            <span>Efectivo (CASH)</span>
          </button>
          <button
            class="method-btn"
            [class.active]="paymentMethod === 'CARD'"
            (click)="paymentMethod = 'CARD'">
            <span class="method-icon">💳</span>
            <span>Tarjeta de Débito/Crédito</span>
          </button>
          <button
            class="method-btn"
            [class.active]="paymentMethod === 'TRANSFER'"
            (click)="paymentMethod = 'TRANSFER'">
            <span class="method-icon">📱</span>
            <span>Transferencia / Yape / Plin</span>
          </button>
        </div>

        <!-- Cash received & Change calculator -->
        <div class="calculator-section" *ngIf="paymentMethod === 'CASH'">
          <div class="form-group">
            <label>Monto Recibido del Cliente:</label>
            <div class="input-money-wrapper">
              <span>S/.</span>
              <input
                type="number"
                [(ngModel)]="receivedAmount"
                class="money-input"
                step="0.50"
                min="0"
              />
            </div>
          </div>

          <!-- Quick cash buttons -->
          <div class="quick-cash-row">
            <button class="btn-quick" (click)="receivedAmount = order.total">Exacto (S/. {{ order.total.toFixed(2) }})</button>
            <button class="btn-quick" (click)="receivedAmount = 10">S/. 10.00</button>
            <button class="btn-quick" (click)="receivedAmount = 20">S/. 20.00</button>
            <button class="btn-quick" (click)="receivedAmount = 50">S/. 50.00</button>
            <button class="btn-quick" (click)="receivedAmount = 100">S/. 100.00</button>
          </div>

          <!-- Change display -->
          <div class="change-display" [class.negative]="receivedAmount < order.total">
            <span>Vuelto / Cambio a devolver:</span>
            <span class="change-amount">S/. {{ Math.max(0, Number(receivedAmount) - order.total).toFixed(2) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close.emit()">Cancelar</button>
          <button
            class="btn btn-success btn-pay"
            [disabled]="paymentMethod === 'CASH' && (Number(receivedAmount) < order.total)"
            (click)="executePayment()">
            <span>🖨️ Confirmar Pago e Imprimir Ticket {{ order.folio }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 150;
    }

    .payment-modal-card {
      background-color: #FFFFFF;
      width: 100%;
      max-width: 480px;
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: modalFadeIn 0.2s ease;
    }

    @keyframes modalFadeIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--card-border);

      h3 { font-size: 20px; font-weight: 700; color: #0F172A; }
      .table-subtitle { font-size: 13px; color: #64748B; }

      .btn-close {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background-color: #F1F5F9;
        color: #64748B;
        font-size: 20px;
        cursor: pointer;
        &:hover { background-color: #E2E8F0; color: #0F172A; }
      }
    }

    .total-banner {
      background: linear-gradient(135deg, #0F172A, #1E293B);
      color: #FFFFFF;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 700;

      span:first-child { font-size: 14px; letter-spacing: 0.5px; opacity: 0.8; }
      .total-big { font-size: 28px; color: #38BDF8; }
    }

    .payment-methods {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding: 20px 24px;
      background-color: #F8FAFC;
      border-bottom: 1px solid var(--card-border);
    }

    .method-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 14px 8px;
      border-radius: var(--radius-lg);
      border: 2px solid #E2E8F0;
      background-color: #FFFFFF;
      cursor: pointer;
      transition: all 0.2s;
      font-weight: 600;
      font-size: 12px;
      color: #475569;

      .method-icon { font-size: 24px; }

      &:hover { border-color: #CBD5E1; background-color: #F1F5F9; }
      &.active {
        border-color: #3B82F6;
        background-color: #EFF6FF;
        color: #1D4ED8;
      }
    }

    .calculator-section {
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 8px;

        label { font-weight: 600; font-size: 13px; color: #334155; }
      }

      .input-money-wrapper {
        display: flex;
        align-items: center;
        border: 2px solid #CBD5E1;
        border-radius: var(--radius-md);
        padding: 0 16px;
        background-color: #FFFFFF;
        transition: border-color 0.2s;

        &:focus-within { border-color: #3B82F6; }

        span { font-size: 20px; font-weight: 700; color: #64748B; margin-right: 8px; }
        .money-input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 24px;
          font-weight: 700;
          color: #0F172A;
          padding: 10px 0;
        }
      }

      .quick-cash-row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .btn-quick {
          flex: 1;
          min-width: 70px;
          padding: 8px 10px;
          border-radius: var(--radius-md);
          border: 1px solid #CBD5E1;
          background-color: #F8FAFC;
          font-weight: 600;
          font-size: 13px;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;

          &:hover { background-color: #E2E8F0; border-color: #94A3B8; }
        }
      }

      .change-display {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background-color: #F0FDF4;
        border: 1px solid #BBF7D0;
        border-radius: var(--radius-md);
        color: #166534;
        font-weight: 600;
        font-size: 15px;

        .change-amount { font-size: 22px; font-weight: 800; color: #15803D; }

        &.negative {
          background-color: #FEF2F2;
          border-color: #FECACA;
          color: #991B1B;
          .change-amount { color: #DC2626; }
        }
      }
    }

    .modal-footer {
      padding: 16px 24px;
      background-color: #F8FAFC;
      border-top: 1px solid var(--card-border);
      display: flex;
      justify-content: flex-end;
      gap: 12px;

      .btn-pay {
        padding: 12px 24px;
        font-size: 15px;
        font-weight: 700;
      }
    }
  `]
})
export class ThermalTicketModalComponent {
  @Input({ required: true }) order!: Order;
  @Output() close = new EventEmitter<void>();
  @Output() charged = new EventEmitter<void>();

  restaurant = inject(RestaurantService);
  printService = inject(PrintService);
  notify = inject(NotificationModalService);

  paymentMethod: PaymentMethod = 'CASH';
  receivedAmount = 10.00;
  Math = Math;
  Number = Number;

  ngOnInit() {
    this.receivedAmount = this.order.total;
  }

  executePayment(): void {
    try {
      const numericReceived = Number(this.receivedAmount) || this.order.total;
      const closedOrder = this.restaurant.checkoutOrder(this.order.id, this.paymentMethod, numericReceived);
      // 1. Abrir diálogo de impresión de la boleta EXACTA de manera directa y sincrónica al clic
      this.printService.printThermalTicket(closedOrder);
      // 2. Emitir el evento charged para redirigir y cerrar el modal
      this.charged.emit();
    } catch (error: any) {
      console.error('Error al ejecutar el cobro de la orden:', error);
      this.notify.alert({ title: 'Error en Cobro', message: 'No se pudo completar el cobro: ' + (error?.message || error) });
    }
  }
}

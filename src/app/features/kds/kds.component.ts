import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantService } from '../../core/services/restaurant.service';
import { Order, OrderItem, KdsStatus } from '../../core/models';

@Component({
  selector: 'app-kds',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kds-page">
      <!-- Header exact to screenshot 6 -->
      <div class="page-header">
        <div>
          <h2>🔥 Monitor de Cocina (KDS)</h2>
          <p class="subtitle">Pedidos pendientes de preparación en tiempo real</p>
        </div>

        <div class="kds-status-bar">
          <div class="legend-item">
            <span class="dot pending"></span>
            <span>Pendiente</span>
          </div>
          <div class="legend-item">
            <span class="dot preparing"></span>
            <span>Preparando</span>
          </div>
          <div class="live-clock">
            {{ currentTime() }}
          </div>
        </div>
      </div>

      <!-- KDS Cards Grid exact to screenshot 6 -->
      <div class="kds-grid">
        <div *ngFor="let order of restaurant.pendingKdsOrders()" class="kds-card">
          
          <!-- Yellow Top Header: Mesa: Mesa 1 | Folio #2 | 20:40 -->
          <div class="kds-card-header">
            <div class="header-left">
              <h4>Mesa: {{ order.tableName }}</h4>
              <span class="folio-tag">Folio {{ order.folio }}</span>
            </div>
            <div class="header-right">
              <span class="time-tag">🕒 {{ formatOrderTime(order.createdAt) }}</span>
            </div>
          </div>

          <!-- Items List inside card body -->
          <div class="kds-card-body">
            <div
              *ngFor="let item of getPendingItems(order)"
              class="kds-item-row"
              [class.preparing]="item.kdsStatus === 'preparing'">
              
              <!-- Quantity circle badge -->
              <div class="qty-circle">{{ item.quantity }}</div>

              <!-- Product Name & Notes -->
              <div class="item-details">
                <span class="item-name">{{ item.productName }}</span>
                <span *ngIf="item.notes" class="item-notes">📝 {{ item.notes }}</span>
              </div>

              <!-- Action Status button exact to screenshot 6 -->
              <div class="item-action">
                <button
                  *ngIf="item.kdsStatus === 'pending'"
                  class="btn-empezar"
                  (click)="updateStatus(order.id, item.id, 'preparing')">
                  Empezar
                </button>

                <button
                  *ngIf="item.kdsStatus === 'preparing'"
                  class="btn-listo"
                  (click)="updateStatus(order.id, item.id, 'ready')">
                  <span>✓</span> Listo
                </button>
              </div>
            </div>

            <!-- Complete order ready button if all preparing -->
            <div class="card-actions-footer" *ngIf="getPendingItems(order).length > 0">
              <button class="btn-mark-all" (click)="markAllReady(order)">
                ✓ Marcar Pedido {{ order.folio }} Completo
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="restaurant.pendingKdsOrders().length === 0" class="empty-kds">
          <div class="empty-icon">👨‍🍳</div>
          <h3>¡Todo al día en cocina!</h3>
          <p>No hay pedidos pendientes o en preparación en este momento.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kds-page {
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

      h2 { font-size: 26px; font-weight: 700; font-family: var(--font-title); color: #0F172A; }
      .subtitle { font-size: 14px; color: var(--text-secondary); }
    }

    .kds-status-bar {
      display: flex;
      align-items: center;
      gap: 22px;
      font-size: 14px;
      font-weight: 600;
      color: #334155;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          &.pending { background-color: var(--danger); }
          &.preparing { background-color: var(--warning); }
        }
      }

      .live-clock {
        font-family: 'Courier New', Courier, monospace;
        font-size: 28px;
        font-weight: 800;
        color: #0F172A;
        letter-spacing: -0.5px;
        background-color: #FFFFFF;
        padding: 4px 14px;
        border-radius: var(--radius-md);
        border: 1px solid var(--card-border);
        box-shadow: var(--shadow-sm);
      }
    }

    .kds-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      align-items: start;
    }

    .kds-card {
      background-color: #FFFFFF;
      border: 1px solid var(--card-border);
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-md);
      transition: all 0.2s ease;

      &:hover {
        box-shadow: var(--shadow-lg);
      }

      /* Yellow Top Header exactly like screenshot 6 */
      .kds-card-header {
        background: linear-gradient(135deg, #F59E0B, #D97706);
        color: #FFFFFF;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
          h4 { font-size: 18px; font-weight: 800; color: #FFFFFF; line-height: 1.1; }
          .folio-tag { font-size: 12px; font-weight: 700; opacity: 0.95; }
        }

        .header-right {
          .time-tag { font-size: 14px; font-weight: 700; background: rgba(0,0,0,0.15); padding: 4px 10px; border-radius: 6px; }
        }
      }

      .kds-card-body {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
    }

    .kds-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 12px;
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: var(--radius-md);
      transition: background-color 0.2s ease;

      &.preparing {
        background-color: #FEF3C7;
        border-color: #FCD34D;
      }

      .qty-circle {
        width: 32px;
        height: 32px;
        background-color: #475569;
        color: #FFFFFF;
        font-weight: 800;
        font-size: 14px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .item-details {
        flex: 1;
        display: flex;
        flex-direction: column;

        .item-name {
          font-weight: 700;
          font-size: 15px;
          color: #0F172A;
          line-height: 1.2;
        }

        .item-notes {
          font-size: 12px;
          color: #DC2626;
          font-weight: 600;
          margin-top: 4px;
        }
      }

      .item-action {
        .btn-empezar {
          background: none;
          border: none;
          color: #EF4444; /* Red exact to screenshot 6 [Empezar] */
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 6px;
          &:hover { background-color: #FEE2E2; }
        }

        .btn-listo {
          background-color: #F59E0B; /* Yellow circle button exact to screenshot 6 [✓ Listo] */
          color: #1E293B;
          border: none;
          font-weight: 800;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 9999px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);

          &:hover {
            background-color: #D97706;
            color: #FFFFFF;
          }
        }
      }
    }

    .card-actions-footer {
      border-top: 1px solid #F1F5F9;
      padding-top: 12px;

      .btn-mark-all {
        width: 100%;
        padding: 10px;
        border-radius: var(--radius-md);
        background-color: #F1F5F9;
        color: #334155;
        border: none;
        font-weight: 700;
        font-size: 13px;
        cursor: pointer;
        &:hover { background-color: #10B981; color: #FFFFFF; }
      }
    }

    .empty-kds {
      grid-column: 1 / -1;
      text-align: center;
      padding: 80px 20px;
      background-color: #FFFFFF;
      border-radius: var(--radius-xl);
      border: 1px solid var(--card-border);

      .empty-icon { font-size: 64px; margin-bottom: 12px; }
      h3 { font-size: 22px; font-weight: 700; color: #0F172A; }
      p { color: #64748B; margin-top: 4px; }
    }
  `]
})
export class KdsComponent implements OnInit, OnDestroy {
  restaurant = inject(RestaurantService);

  currentTime = signal<string>(this.getFormattedClock());
  private timerInterval: any;

  ngOnInit() {
    this.timerInterval = setInterval(() => {
      this.currentTime.set(this.getFormattedClock());
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private getFormattedClock(): string {
    const now = new Date();
    return now.toTimeString().split(' ')[0]; // HH:mm:ss exact to screenshot 6
  }

  formatOrderTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toTimeString().substring(0, 5); // HH:mm exact to screenshot 6 (20:40)
  }

  getPendingItems(order: Order): OrderItem[] {
    return order.items.filter(i => i.kdsStatus === 'pending' || i.kdsStatus === 'preparing');
  }

  updateStatus(orderId: string, itemId: string, status: KdsStatus): void {
    this.restaurant.updateOrderItemKdsStatus(orderId, itemId, status);
  }

  markAllReady(order: Order): void {
    this.restaurant.markOrderAsReady(order.id);
  }
}

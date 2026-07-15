import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RestaurantService } from '../../../core/services/restaurant.service';
import { PrintService } from '../../../core/services/print.service';
import { NotificationModalService } from '../../../core/services/notification-modal.service';
import { Product, OrderItem, PaymentMethod, Client, Order } from '../../../core/models';
import { ThermalTicketModalComponent } from '../thermal-ticket-modal/thermal-ticket-modal.component';

@Component({
  selector: 'app-pos-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ThermalTicketModalComponent],
  template: `
    <div class="pos-detail-container" *ngIf="currentOrder() as order; else noActiveOrder">
      <!-- Top Header Bar -->
      <div class="detail-topbar">
        <div class="topbar-left">
          <button class="btn btn-secondary btn-back" (click)="backToPos()">
            <span>← Volver</span>
          </button>
          <div class="table-title">
            <h3>Mesa: {{ order.tableName }}</h3>
            <span class="zone-badge">Zona: {{ order.salonName }}</span>
            <span class="zone-badge" style="background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD;">👥 Capacidad: {{ getTableCapacity(order.tableId) }} personas</span>
          </div>
        </div>

        <div class="topbar-right">
          <button class="btn btn-secondary btn-move" (click)="moveTableModal.set(true)">
            <span>⇆ Mover Mesa</span>
          </button>
          <div class="admin-badge">
            <span>👤 {{ restaurant.currentUser().name }}</span>
          </div>
        </div>
      </div>

      <!-- Main Layout: Left Products & Categories | Right Cuenta Actual -->
      <div class="detail-body">
        <!-- Left Section: Catalog -->
        <div class="catalog-section">
          <div class="catalog-header">
            <!-- Categories Column/Sidebar or Top Tabs exact to screenshot 2 -->
            <div class="categories-panel">
              <button
                *ngFor="let cat of restaurant.categories()"
                class="cat-tab"
                [class.active]="activeCategory() === cat.id"
                (click)="activeCategory.set(cat.id)">
                <div class="cat-icon-placeholder">{{ getCategoryIcon(cat) }}</div>
                <span>{{ cat.name }}</span>
              </button>
            </div>

            <!-- Products Grid with Barcode Scanner Bar -->
            <div class="products-panel">
              <div class="search-bar-wrapper">
                <span class="barcode-icon" title="Buscar o Escanear">🔍</span>
                <input
                  type="text"
                  [ngModel]="searchBarcode()"
                  (ngModelChange)="searchBarcode.set($event)"
                  placeholder="Buscar por nombre, código o ingrediente..."
                  class="barcode-input"
                  (keyup.enter)="onBarcodeSubmit()"
                />
              </div>

              <!-- Products Cards Grid -->
              <div class="products-grid">
                <div
                  *ngFor="let prod of filteredProducts()"
                  class="product-card"
                  (click)="addProductToOrder(prod)">
                  
                  <!-- Top Right Price Tag -->
                  <div class="price-tag">S/. {{ prod.price.toFixed(2) }}</div>

                  <!-- Image -->
                  <div class="prod-img-wrapper">
                    <img
                      *ngIf="(prod.imageUrl || prod.image) && !brokenImages().has(prod.id); else defaultPlate"
                      [src]="prod.imageUrl || prod.image"
                      [alt]="prod.name"
                      (error)="onImageError(prod.id)"
                    />
                    <ng-template #defaultPlate>
                      <div class="default-plate-icon">
                        <svg class="plate-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 22V42C18 45.3 20.7 48 24 48V76C24 77.7 25.3 79 27 79C28.7 79 30 77.7 30 76V48C33.3 48 36 45.3 36 42V22H32.5V36H29V22H25.5V36H22V22H18Z" fill="#475569"/>
                          <circle cx="62" cy="50" r="30" fill="#F1F5F9" stroke="#334155" stroke-width="4.5"/>
                          <circle cx="62" cy="50" r="19" fill="#CBD5E1" stroke="#334155" stroke-width="2.5"/>
                          <path d="M92 22C92 22 84 28 84 44V76C84 77.7 85.3 79 87 79C88.7 79 90 77.7 90 76V22H92Z" fill="#475569"/>
                        </svg>
                      </div>
                    </ng-template>
                  </div>

                  <!-- Title -->
                  <div class="prod-name">{{ prod.name }}</div>
                </div>

                <div *ngIf="filteredProducts().length === 0" class="empty-products">
                  <p>No se encontraron productos en esta categoría o búsqueda.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Section: Cuenta Actual -->
        <div class="cart-section card">
          <div class="cart-header">
            <div>
              <h4>🛒 Cuenta Actual</h4>
              <div class="client-crm-badge" (click)="openClientModal()">
                <span>👤 <strong>{{ order.clientName || 'Público General' }}</strong></span>
                <span class="change-crm-link">🔄 CRM / Asignar</span>
              </div>
              <div class="order-staff-info" style="margin-top:6px; font-size:12px; color:#475569; display:flex; align-items:center; gap:8px;">
                <span>🧑‍🍳 Atendió: <strong>{{ order.waiterName || 'Mesero' }}</strong></span>
                @if (order.chefName) {
                  <span>| 🔥 Cocina: <strong>{{ order.chefName }}</strong></span>
                }
              </div>
            </div>
            <span class="folio-tag">Folio {{ order.folio }}</span>
          </div>

          <div class="cart-table-header">
            <span class="col-prod">PROD.</span>
            <span class="col-cant">CANT.</span>
            <span class="col-tot">TOT.</span>
          </div>

          <!-- Items List -->
          <div class="cart-items-list">
            <div *ngIf="hasReadyItems(order)" class="order-ready-banner" style="background: linear-gradient(90deg, #10B981, #059669); color: white; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 8px 12px 10px 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
              <span>🔔 ¡PEDIDO LISTO EN COCINA! Los platillos han sido terminados y están listos en ventanilla para ser recogidos por el mesero.</span>
            </div>

            <div *ngFor="let item of order.items" class="cart-item-row">
              <!-- Delete & Edit column -->
              <div class="item-actions">
                <button class="btn-del" (click)="removeItem(item.id)">×</button>
              </div>

              <!-- Product info -->
              <div class="item-info">
                <span class="item-name">
                  {{ item.productName }}
                  <span *ngIf="item.kdsStatus === 'ready'" style="background: #D1FAE5; color: #065F46; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-left: 6px;">🔔 LISTO PARA RECOGER</span>
                  <span *ngIf="item.kdsStatus === 'preparing'" style="background: #FEF3C7; color: #92400E; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-left: 6px;">👨‍🍳 En Cocina</span>
                </span>
                <span class="item-unit-price">S/. {{ item.price.toFixed(2) }}</span>
                <button class="btn-notes" (click)="openNotesModal(item)">✏️ {{ item.notes ? 'Nota' : '' }}</button>
              </div>

              <!-- Quantity Counter [- 2 +] -->
              <div class="item-quantity">
                <button class="btn-qty" (click)="changeQty(item.id, -1)">-</button>
                <div class="qty-display">{{ item.quantity }}</div>
                <button class="btn-qty" (click)="changeQty(item.id, 1)">+</button>
              </div>

              <!-- Total price -->
              <div class="item-total">
                S/. {{ item.total.toFixed(2) }}
              </div>
            </div>

            <div *ngIf="order.items.length === 0" class="empty-cart">
              <p>Aún no hay productos en la cuenta. Haz clic en los platillos para agregarlos.</p>
            </div>
          </div>

          <!-- Cart Footer Totals -->
          <div class="cart-footer">
            <div class="subtotal-row">
              <span>Subtotal:</span>
              <span>S/. {{ order.subtotal.toFixed(2) }}</span>
            </div>
            <div class="total-row">
              <span>TOTAL:</span>
              <span class="total-amount">S/. {{ order.total.toFixed(2) }}</span>
            </div>

            <!-- Action Buttons Row (Opc. | Div. | Pre) -->
            <div class="cart-actions-row">
              <button class="btn-cart-action" (click)="openClientModal()">
                <span class="action-icon">👤</span>
                <span>Cliente</span>
              </button>
              <button class="btn-cart-action" (click)="alertDividir()">
                <span class="action-icon">✂️</span>
                <span>Div.</span>
              </button>
              <button class="btn-cart-action" (click)="imprimirPreCuenta(order)">
                <span class="action-icon">🧾</span>
                <span>Pre</span>
              </button>
            </div>

            <!-- Big Green Cobrar Button -->
            <button
              class="btn btn-success btn-cobrar"
              [disabled]="order.items.length === 0"
              (click)="showPaymentModal.set(true)">
              <span>💸 COBRAR</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de Cobro & Recibo Térmico -->
      <app-thermal-ticket-modal
        *ngIf="showPaymentModal()"
        [order]="order"
        (close)="showPaymentModal.set(false)"
        (charged)="onOrderCharged()">
      </app-thermal-ticket-modal>

      <!-- Modal de Mover Mesa -->
      <div class="modal-backdrop" *ngIf="moveTableModal()">
        <div class="modal-card">
          <h3>Mover Cuenta a otra Mesa</h3>
          <p>Selecciona la mesa de destino disponible para transferir los consumos de {{ order.tableName }}:</p>
          <select [(ngModel)]="targetTableId" class="form-select">
            <option *ngFor="let t of availableTables()" [value]="t.id">{{ t.name }} ({{ t.capacity }} pax)</option>
          </select>
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="moveTableModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" [disabled]="!targetTableId" (click)="executeMoveTable(order)">Transferir Mesa</button>
          </div>
        </div>
      </div>

      <!-- Modal de Asignación de Cliente / CRM -->
      <div class="modal-backdrop" *ngIf="showClientModal()">
        <div class="modal-card crm-modal">
          <div class="modal-header-row">
            <h3>👤 Asignar Cliente a Orden {{ order.folio }}</h3>
            <button class="btn-close-x" (click)="showClientModal.set(false)">×</button>
          </div>
          <p class="crm-subtitle">Selecciona un cliente de tu Directorio CRM para acumular visitas y consumos en automático al cobrar, o registra uno nuevo:</p>

          <div class="crm-search-box">
            <input
              type="text"
              [ngModel]="searchCrm()"
              (ngModelChange)="searchCrm.set($event)"
              placeholder="🔍 Buscar en CRM por nombre o teléfono..."
              class="crm-search-input"
            />
          </div>

          <button class="btn-publico" (click)="assignClientToOrder(order, 'Público General', undefined)">
            <span>🌐 Público General (Sin acumulación CRM)</span>
          </button>

          <div class="crm-client-list">
            <div
              *ngFor="let c of filteredCrmClients()"
              class="crm-client-row"
              [class.active-client]="order.clientId === c.id || order.clientName === c.name"
              (click)="assignClientToOrder(order, c.name, c.id)">
              <div class="crm-avatar">{{ c.name.charAt(0) }}</div>
              <div class="crm-info">
                <div class="crm-name">{{ c.name }} <span *ngIf="c.phone && c.phone !== 'Sin teléfono'" class="crm-phone">📞 {{ c.phone }}</span></div>
                <div class="crm-stats">🌟 Visitas: {{ c.totalVisits || c.visitsCount || 0 }} | Total gastado: S/. {{ (c.totalSpent || 0).toFixed(2) }}</div>
              </div>
              <div class="crm-select-tag">✔ Seleccionar</div>
            </div>
            <div *ngIf="filteredCrmClients().length === 0" class="empty-crm">
              <p>No se encontró este cliente en el CRM.</p>
            </div>
          </div>

          <div class="new-client-box">
            <h4>+ Registrar Nuevo Cliente en CRM</h4>
            <div class="new-client-inputs">
              <input type="text" [(ngModel)]="newCrmName" placeholder="Nombre completo *" class="form-input" />
              <input type="text" [(ngModel)]="newCrmPhone" placeholder="Teléfono / Contacto" class="form-input" />
              <button class="btn btn-primary btn-save-crm" [disabled]="!newCrmName.trim()" (click)="createAndAssignClient(order)">Guardar en CRM y Asignar</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fallback ante orden cobrada o mesa libre para evitar página en blanco -->
    <ng-template #noActiveOrder>
      <div class="empty-state-container animate-fade-in">
        <div class="empty-card">
          <div class="empty-icon">✓</div>
          <h3>¡Cuenta Cobrada / Mesa Libre!</h3>
          <p>El pago fue procesado correctamente y la mesa se encuentra disponible.</p>
          <button class="btn btn-primary btn-lg" (click)="backToPos()">
            <span>← Volver al Mapa de Mesas</span>
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .empty-state-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: calc(100vh - 160px);
      background-color: #F8FAFC;
      border-radius: var(--radius-lg);

      .empty-card {
        background: #FFFFFF;
        padding: 40px;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        text-align: center;
        max-width: 420px;
        border: 1px solid #E2E8F0;

        .empty-icon {
          width: 64px;
          height: 64px;
          background-color: #DCFCE7;
          color: #16A34A;
          font-size: 32px;
          font-weight: 800;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
        }

        h3 {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 8px;
        }

        p {
          color: #64748B;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .btn-lg {
          padding: 12px 24px;
          font-size: 15px;
          font-weight: 700;
          width: 100%;
          justify-content: center;
        }
      }
    }

    .pos-detail-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: calc(100vh - 120px);
    }

    .detail-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #FFFFFF;
      padding: 14px 24px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--card-border);
      box-shadow: var(--shadow-sm);

      .topbar-left {
        display: flex;
        align-items: center;
        gap: 20px;

        .btn-back {
          padding: 8px 16px;
          font-weight: 600;
        }

        .table-title {
          display: flex;
          flex-direction: column;

          h3 {
            font-size: 20px;
            font-weight: 700;
            color: #0F172A;
            line-height: 1.2;
          }

          .zone-badge {
            font-size: 12px;
            color: #64748B;
            font-weight: 500;
          }
        }
      }

      .topbar-right {
        display: flex;
        align-items: center;
        gap: 14px;

        .admin-badge {
          background-color: #F8FAFC;
          border: 1px solid #E2E8F0;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }
      }
    }

    .detail-body {
      display: flex;
      gap: 24px;
      flex: 1;
      min-height: 0;
    }

    /* Catalog Section */
    .catalog-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      background-color: #FFFFFF;
      border: 1px solid var(--card-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      overflow-y: auto;
    }

    .catalog-header {
      display: flex;
      gap: 24px;
      height: 100%;
    }

    .categories-panel {
      width: 140px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-right: 1px solid #F1F5F9;
      padding-right: 16px;

      .cat-tab {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 14px 10px;
        border-radius: var(--radius-md);
        background-color: #F8FAFC;
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
        font-size: 13px;
        color: #475569;

        .cat-icon-placeholder {
          font-size: 24px;
        }

        &:hover {
          background-color: #EFF6FF;
          color: #2563EB;
        }

        &.active {
          background-color: #0066FF; /* Blue exact to screenshot 2 */
          color: #FFFFFF;
          box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
        }
      }
    }

    .products-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .search-bar-wrapper {
      display: flex;
      align-items: center;
      background-color: #FFFFFF;
      border: 2px solid #E2E8F0;
      border-radius: var(--radius-md);
      padding: 8px 14px;
      gap: 12px;
      transition: border-color 0.2s ease;

      &:focus-within {
        border-color: #3B82F6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
      }

      .barcode-icon {
        color: #3B82F6;
        font-weight: 800;
      }

      .barcode-input {
        border: none;
        outline: none;
        width: 100%;
        font-size: 14px;
        color: #0F172A;
      }
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 16px;
      overflow-y: auto;
      align-content: start;
    }

    .product-card {
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: var(--radius-lg);
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);

      &:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-md);
        border-color: #3B82F6;
      }

      .price-tag {
        position: absolute;
        top: 8px;
        right: 8px;
        background-color: #334155;
        color: #FFFFFF;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 6px;
        z-index: 5;
      }

      .prod-img-wrapper {
        width: 80px;
        height: 80px;
        border-radius: var(--radius-md);
        overflow: hidden;
        margin-top: 8px;
        margin-bottom: 8px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .default-plate-icon {
          width: 100%;
          height: 100%;
          background-color: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;

          .plate-svg {
            width: 100%;
            height: 100%;
          }
        }
      }

      .prod-name {
        font-weight: 700;
        font-size: 13px;
        color: #0F172A;
        text-align: center;
        line-height: 1.2;
      }
    }

    /* Cart / Right Sidebar Section exact to screenshot 2 */
    .cart-section {
      width: 360px;
      display: flex;
      flex-direction: column;
      padding: 20px;
      height: 100%;
    }

    .cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 12px;
      margin-bottom: 12px;

      h4 {
        font-size: 16px;
        font-weight: 700;
        color: #0F172A;
      }

      .folio-tag {
        font-size: 12px;
        font-weight: 700;
        color: #3B82F6;
        background-color: #EFF6FF;
        padding: 4px 10px;
        border-radius: 6px;
      }

      .client-crm-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
        padding: 4px 10px;
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 20px;
        font-size: 12px;
        color: #334155;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background-color: #EFF6FF;
          border-color: #BFDBFE;
          color: #1D4ED8;
        }

        .change-crm-link {
          font-weight: 700;
          color: #3B82F6;
        }
      }
    }

    .cart-table-header {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      font-weight: 700;
      color: #94A3B8;
      letter-spacing: 0.5px;
      padding: 4px 6px;
      border-bottom: 1px solid #E2E8F0;
      margin-bottom: 8px;

      .col-prod { width: 45%; }
      .col-cant { width: 30%; text-align: center; }
      .col-tot { width: 25%; text-align: right; }
    }

    .cart-items-list {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-right: 4px;
    }

    .cart-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 4px;
      border-bottom: 1px solid #F8FAFC;

      .item-actions {
        margin-right: 6px;
        .btn-del {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: #FEE2E2;
          color: #EF4444;
          border: none;
          font-weight: 700;
          cursor: pointer;
          &:hover { background-color: #EF4444; color: #FFFFFF; }
        }
      }

      .item-info {
        width: 40%;
        display: flex;
        flex-direction: column;

        .item-name {
          font-weight: 700;
          font-size: 13px;
          color: #0F172A;
          line-height: 1.2;
        }
        .item-unit-price {
          font-size: 11px;
          color: #64748B;
        }
        .btn-notes {
          background: none;
          border: none;
          color: #3B82F6;
          font-size: 11px;
          cursor: pointer;
          text-align: left;
          padding: 0;
          margin-top: 2px;
        }
      }

      .item-quantity {
        width: 35%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;

        .btn-qty {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid #CBD5E1;
          background-color: #FFFFFF;
          color: #334155;
          font-weight: 700;
          cursor: pointer;
          &:hover { background-color: #F1F5F9; }
        }

        .qty-display {
          font-weight: 700;
          font-size: 14px;
          width: 20px;
          text-align: center;
        }
      }

      .item-total {
        width: 25%;
        text-align: right;
        font-weight: 700;
        font-size: 14px;
        color: #0F172A;
      }
    }

    .empty-cart {
      text-align: center;
      padding: 40px 12px;
      color: #94A3B8;
      font-size: 13px;
    }

    .cart-footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .subtotal-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: #64748B;
      }

      .total-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-weight: 700;

        span:first-child { font-size: 14px; color: #0F172A; }
        .total-amount { font-size: 24px; color: #0066FF; font-weight: 800; }
      }

      .cart-actions-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;

        .btn-cart-action {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: var(--radius-md);
          background-color: #F8FAFC;
          border: 1px solid var(--card-border);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          transition: all 0.2s ease;

          &:hover {
            background-color: #EFF6FF;
            color: #2563EB;
            border-color: #BFDBFE;
          }
        }
      }

      .btn-cobrar {
        width: 100%;
        padding: 14px;
        font-size: 16px;
        font-weight: 800;
        background-color: #10B981; /* Green exact to screenshot 2 */
        letter-spacing: 0.5px;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);

        &:hover {
          background-color: #059669;
        }
      }
    }

    /* Modals */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .modal-card {
      background-color: #FFFFFF;
      padding: 28px;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      gap: 16px;

      h3 { font-size: 20px; font-weight: 700; color: #0F172A; }
      p { font-size: 14px; color: #64748B; }

      .form-select {
        width: 100%;
        padding: 12px;
        border-radius: var(--radius-md);
        border: 1px solid var(--card-border);
        font-size: 14px;
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      &.crm-modal {
        max-width: 480px;
        max-height: 85vh;
        overflow-y: auto;
        gap: 12px;

        .modal-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          .btn-close-x {
            background: none;
            border: none;
            font-size: 24px;
            color: #64748B;
            cursor: pointer;
          }
        }

        .crm-subtitle {
          font-size: 13px;
          color: #64748B;
          line-height: 1.4;
        }

        .crm-search-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 14px;
          outline: none;
          &:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
        }

        .btn-publico {
          width: 100%;
          padding: 10px;
          border: 1px dashed #94A3B8;
          border-radius: 10px;
          background: #F8FAFC;
          color: #334155;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          &:hover { background: #E2E8F0; }
        }

        .crm-client-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 220px;
          overflow-y: auto;
          border: 1px solid #F1F5F9;
          border-radius: 10px;
          padding: 6px;
        }

        .crm-client-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;

          &:hover { background: #F1F5F9; }
          &.active-client { background: #EFF6FF; border: 1px solid #BFDBFE; }

          .crm-avatar {
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #3B82F6;
            color: #FFFFFF;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
          }

          .crm-info {
            flex: 1;
            .crm-name { font-weight: 700; font-size: 13px; color: #0F172A; }
            .crm-phone { font-size: 11px; color: #64748B; font-weight: 400; }
            .crm-stats { font-size: 11px; color: #059669; font-weight: 600; }
          }

          .crm-select-tag {
            font-size: 11px;
            font-weight: 700;
            color: #3B82F6;
          }
        }

        .new-client-box {
          border-top: 1px solid #E2E8F0;
          padding-top: 12px;
          h4 { font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px; }
          .new-client-inputs {
            display: flex;
            flex-direction: column;
            gap: 8px;
            .form-input {
              padding: 8px 12px;
              border: 1px solid #CBD5E1;
              border-radius: 8px;
              font-size: 13px;
            }
            .btn-save-crm {
              padding: 10px;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 700;
            }
          }
        }
      }
    }
  `]
})
export class PosOrderDetailComponent implements OnInit {
  restaurant = inject(RestaurantService);
  printService = inject(PrintService);
  notify = inject(NotificationModalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  activeCategory = signal<string>('cat-todo');
  searchBarcode = signal('');
  showPaymentModal = signal<boolean>(false);
  moveTableModal = signal<boolean>(false);
  showClientModal = signal<boolean>(false);
  searchCrm = signal<string>('');
  newCrmName = '';
  newCrmPhone = '';
  targetTableId = '';

  hasReadyItems(order: Order): boolean {
    return order.items.some(i => i.kdsStatus === 'ready');
  }
  brokenImages = signal<Set<string>>(new Set());

  getTableCapacity(tableId: string): number {
    const table = this.restaurant.tables().find(t => t.id === tableId);
    return table?.capacity || 4;
  }

  onImageError(prodId: string): void {
    this.brokenImages.update(set => {
      const next = new Set(set);
      next.add(prodId);
      return next;
    });
  }

  getCategoryIcon(cat: any): string {
    if (!cat) return '🍽️';
    if (cat.id === 'cat-todo' || cat.name.toLowerCase() === 'todo') return '📑';
    
    // Si ya tiene un emoji válido y no es una palabra genérica
    const iconStr = cat.icon || '';
    const genericWords = ['grid', 'coffee', 'utensils', 'chef-hat', 'cake', 'plate'];
    if (iconStr && !genericWords.includes(iconStr.toLowerCase()) && !/^[a-zA-Z-]+$/.test(iconStr)) {
      return iconStr;
    }

    const n = cat.name.toLowerCase();
    if (n.includes('entrada') || n.includes('tequeño') || n.includes('piqueo') || n.includes('aperitivo')) return '🥟';
    if (n.includes('duo') || n.includes('duos') || n.includes('combo') || n.includes('promo')) return '🍱';
    if (n.includes('ceviche') || n.includes('marisco') || n.includes('pescado') || n.includes('leche de tigre') || n.includes('mar')) return '🍤';
    if (n.includes('bebida') || n.includes('jugo') || n.includes('gaseosa') || n.includes('refresco') || n.includes('cafe')) return '🥤';
    if (n.includes('desayuno') || n.includes('bolon') || n.includes('tigrillo')) return '🥐';
    if (n.includes('plato') || n.includes('fuerte') || n.includes('principal') || n.includes('carne') || n.includes('lomo')) return '🍛';
    if (n.includes('postre') || n.includes('dulce') || n.includes('torta')) return '🍰';
    if (n.includes('sopa') || n.includes('caldo')) return '🍲';

    if (iconStr.toLowerCase() === 'coffee') return '☕';
    if (iconStr.toLowerCase() === 'utensils') return '🍽️';
    if (iconStr.toLowerCase() === 'chef-hat') return '👨‍🍳';
    if (iconStr.toLowerCase() === 'cake') return '🍰';

    return '🍽️';
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const tableId = params.get('id');
      if (tableId) {
        this.restaurant.openOrSelectTableOrder(tableId);
      }
    });
  }

  readonly currentOrder = computed(() => {
    const tableId = this.restaurant.selectedTableId() || this.route.snapshot.paramMap.get('id');
    if (!tableId) return null;
    const table = this.restaurant.tables().find(t => t.id === tableId);
    if (!table) return null;
    if (table.currentOrderId) {
      return this.restaurant.orders().find(o => o.id === table.currentOrderId) || null;
    }
    if (this.showPaymentModal()) {
      return this.restaurant.orders().find(o => o.tableId === tableId && o.status === 'closed') || null;
    }
    return null;
  });

  readonly filteredProducts = computed(() => {
    const catId = this.activeCategory();
    const query = this.searchBarcode().toLowerCase().trim();
    let prods = this.restaurant.products();

    if (catId !== 'cat-todo') {
      prods = prods.filter(p => p.categoryId === catId);
    }
    if (query) {
      prods = prods.filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    }
    return prods;
  });

  readonly availableTables = computed(() => {
    return this.restaurant.tables().filter(t => t.status === 'available');
  });

  readonly filteredCrmClients = computed(() => {
    const q = this.searchCrm().toLowerCase().trim();
    if (!q) return this.restaurant.clients();
    return this.restaurant.clients().filter(c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
  });

  backToPos(): void {
    this.router.navigate(['/pos']);
  }

  addProductToOrder(product: Product): void {
    const order = this.currentOrder();
    if (!order) return;
    this.restaurant.addItemToOrder(order.id, product, 1);
  }

  changeQty(itemId: string, delta: number): void {
    const order = this.currentOrder();
    if (!order) return;
    this.restaurant.updateOrderItemQuantity(order.id, itemId, delta);
  }

  removeItem(itemId: string): void {
    const order = this.currentOrder();
    if (!order) return;
    const item = order.items.find(i => i.id === itemId);
    if (item) {
      this.restaurant.updateOrderItemQuantity(order.id, itemId, -item.quantity);
    }
  }

  openNotesModal(item: OrderItem): void {
    const order = this.currentOrder();
    if (!order) return;
    const notes = prompt('Ingresa nota o instrucción de cocina para ' + item.productName + ':', item.notes || '');
    if (notes !== null) {
      this.restaurant.updateOrderItemNotes(order.id, item.id, notes);
    }
  }

  onBarcodeSubmit(): void {
    const code = this.searchBarcode().trim();
    if (!code) return;
    const query = code.toLowerCase();
    let prod = this.restaurant.products().find(p => p.barcode === code);
    if (!prod) {
      prod = this.restaurant.products().find(p => p.name.toLowerCase() === query);
    }
    if (!prod) {
      const matches = this.restaurant.products().filter(p => 
        p.name.toLowerCase().includes(query) || 
        (p.barcode && p.barcode.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
      if (matches.length === 1) {
        prod = matches[0];
      }
    }

    if (prod) {
      this.addProductToOrder(prod);
      this.searchBarcode.set('');
    } else {
      this.notify.alert({ 
        title: 'Búsqueda / Escaneo', 
        message: 'No se encontró un plato único con: "' + code + '". Haz clic directamente en la tarjeta del producto del menú o revisa el término de búsqueda.' 
      });
    }
  }

  openClientModal(): void {
    this.searchCrm.set('');
    this.newCrmName = '';
    this.newCrmPhone = '';
    this.showClientModal.set(true);
  }

  assignClientToOrder(order: Order, clientName: string, clientId?: string): void {
    this.restaurant.updateOrderClient(order.id, clientName, clientId);
    this.showClientModal.set(false);
  }

  createAndAssignClient(order: Order): void {
    const nameClean = this.newCrmName.trim();
    if (!nameClean) return;
    this.restaurant.addClient({
      name: nameClean,
      phone: this.newCrmPhone.trim() || 'Sin teléfono',
      email: '',
      preferences: 'Registrado desde POS',
      totalVisits: 0,
      visitsCount: 0,
      totalSpent: 0,
      lastVisit: new Date().toLocaleDateString('es-ES')
    });
    const created = this.restaurant.clients().find(c => c.name.toLowerCase() === nameClean.toLowerCase());
    this.assignClientToOrder(order, nameClean, created?.id);
  }

  alertDividir(): void {
    this.notify.alert({
      title: '⚖️ División de Cuenta (Sub-Cuentas)',
      message: 'Función de división de cuenta lista. Puedes separar los platos en boletas independientes o dividir en partes iguales para cobrar por persona.'
    });
  }

  imprimirPreCuenta(order: any): void {
    this.printService.printThermalTicket(order);
  }

  onOrderCharged(): void {
    this.showPaymentModal.set(false);
    this.router.navigate(['/pos']);
  }

  executeMoveTable(order: any): void {
    if (!this.targetTableId) return;
    const target = this.restaurant.tables().find(t => t.id === this.targetTableId);
    if (!target) return;

    this.restaurant.tables.update(list => list.map(t => {
      if (t.id === order.tableId) return { ...t, status: 'available', currentOrderId: undefined, currentAmount: 0 };
      if (t.id === target.id) return { ...t, status: 'occupied', currentOrderId: order.id, currentAmount: order.total };
      return t;
    }));

    this.restaurant.orders.update(list => list.map(o => o.id === order.id ? { ...o, tableId: target.id, tableName: target.name } : o));
    this.moveTableModal.set(false);
    this.router.navigate(['/pos', target.id]);
  }
}

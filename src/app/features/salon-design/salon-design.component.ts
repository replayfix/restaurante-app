import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragEnd } from '@angular/cdk/drag-drop';
import { RestaurantService } from '../../core/services/restaurant.service';
import { NotificationModalService } from '../../core/services/notification-modal.service';
import { Table } from '../../core/models';
import { TableIconComponent } from '../../shared/components/table-icon/table-icon.component';

@Component({
  selector: 'app-salon-design',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TableIconComponent],
  template: `
    <div class="salon-design-page">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-title">
          <div class="title-icon">:::</div>
          <div>
            <h2>Diseño de Salón</h2>
            <p class="subtitle">Arrastra las mesas y guarda la distribución en el plano en vivo</p>
          </div>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary" (click)="openNewZoneModal()">
            <span>⊕ Nueva Zona</span>
          </button>
          <button class="btn btn-primary" (click)="openNewTableModal()">
            <span>+ Nueva Mesa</span>
          </button>
          <button class="btn btn-success" (click)="saveLayout()" [class.saved]="isSaved()">
            <span>{{ isSaved() ? '✓ Diseño Guardado' : '💾 Guardar Diseño' }}</span>
          </button>
        </div>
      </div>

      <!-- Salon/Zone Tabs -->
      <div class="salon-tabs">
        <button
          *ngFor="let salon of restaurant.salons()"
          class="tab-pill"
          [class.active]="salon.id === restaurant.activeSalonId()"
          (click)="selectSalon(salon.id)">
          {{ salon.name }}
        </button>
      </div>

      <!-- Info bar & Zone Delete -->
      <div class="info-bar">
        <div class="info-text">
          <span>ⓘ Arrastra libremente las mesas sobre la cuadrícula y luego presiona Guardar Diseño.</span>
        </div>
        <button
          *ngIf="restaurant.activeSalonId() !== 'main'"
          class="btn-delete-zone"
          (click)="deleteCurrentZone()">
          Eliminar Zona
        </button>
      </div>

      <!-- Dotted Canvas / Drag & Drop Area -->
      <div class="canvas-container dotted-canvas">
        <div
          *ngFor="let table of restaurant.activeSalonTables()"
          cdkDrag
          [cdkDragFreeDragPosition]="{ x: table.x, y: table.y }"
          (cdkDragEnded)="onTableDragEnd($event, table)"
          class="draggable-table"
          [style.width.px]="getTableWidth(table.capacity)"
          [ngClass]="table.status">
          <button class="btn-delete-table" (click)="deleteTable(table.id); $event.stopPropagation()">×</button>
          <div class="table-icons-row" style="display: flex; gap: 8px; align-items: center; justify-content: center; margin-bottom: 2px;">
            <app-table-icon *ngFor="let i of getTableIconRange(table.capacity)" [status]="table.status" [size]="44"></app-table-icon>
          </div>
          <div class="table-name">{{ table.name }}</div>
          <button
            type="button"
            class="table-pax-badge"
            title="Haz clic para cambiar capacidad"
            (click)="editCapacity(table, $event)">
            👥 {{ table.capacity || 4 }} pax ✏️
          </button>
          <div class="table-status-pill" [ngClass]="table.status">
            {{ table.status === 'occupied' ? '🔴 Ocupada' : (table.status === 'reserved' ? '🟡 Reservada' : '🟢 Libre') }}
          </div>
          <div class="table-coords">({{ table.x }}, {{ table.y }})</div>
        </div>

        <div *ngIf="restaurant.activeSalonTables().length === 0" class="empty-canvas">
          <p>No hay mesas en esta zona. Haz clic en <strong>+ Nueva Mesa</strong> para añadir una al plano.</p>
        </div>
      </div>

      <!-- Modal: Nueva Zona -->
      <div class="modal-backdrop" *ngIf="showNewZoneModal()">
        <div class="modal-card">
          <h3>Añadir Nueva Zona / Salón</h3>
          <p>Crea un nuevo espacio como Terraza, Segundo Piso o Bar</p>
          <input
            type="text"
            [(ngModel)]="newZoneName"
            placeholder="Ej: Terraza VIP, Salón Principal..."
            class="form-input"
            (keyup.enter)="createZone()"
          />
          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showNewZoneModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="createZone()">Crear Zona</button>
          </div>
        </div>
      </div>

      <!-- Modal: Nueva Mesa -->
      <div class="modal-backdrop" *ngIf="showNewTableModal()">
        <div class="modal-card modal-table-add">
          <div class="modal-icon-header" style="display: flex; justify-content: center; margin-bottom: 2px;">
            <app-table-icon status="available" [size]="56"></app-table-icon>
          </div>
          <h3 style="text-align: center; margin: 0; font-size: 19px;">Añadir Nueva Mesa</h3>
          <p style="text-align: center; margin: 0; font-size: 13px; color: #64748B;">Configura el nombre y la capacidad de la mesa</p>
          
          <div class="form-group" style="margin-top: 6px;">
            <label style="font-weight: 700; font-size: 13px; color: #334155; display: block; margin-bottom: 4px;">Nombre / Número de Mesa:</label>
            <input
              type="text"
              [(ngModel)]="newTableName"
              placeholder="Ej: Mesa 5, VIP 1..."
              class="form-input"
              (keyup.enter)="createTable()"
            />
          </div>

          <div class="form-group" style="margin-top: 4px;">
            <label style="font-weight: 700; font-size: 13px; color: #334155; display: block; margin-bottom: 4px;">Capacidad (Personas):</label>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input
                type="number"
                [(ngModel)]="newTableCapacity"
                min="1"
                max="100"
                class="form-input"
                style="width: 100%;"
                placeholder="Ej: 4"
                (keyup.enter)="createTable()"
              />
              <span style="font-weight: 600; font-size: 13px; color: #475569; white-space: nowrap;">comensales</span>
            </div>
          </div>

          <div class="modal-actions" style="margin-top: 10px;">
            <button class="btn btn-secondary" (click)="showNewTableModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" (click)="createTable()">Añadir Mesa</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .salon-design-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;

      .header-title {
        display: flex;
        align-items: center;
        gap: 14px;

        .title-icon {
          font-size: 24px;
          font-weight: 800;
          color: #3B82F6;
          letter-spacing: -2px;
          background: #EFF6FF;
          padding: 8px 12px;
          border-radius: var(--radius-md);
        }

        h2 {
          font-size: 24px;
          font-weight: 700;
          font-family: var(--font-title);
          color: #0F172A;
        }

        .subtitle {
          font-size: 14px;
          color: var(--text-secondary);
        }
      }

      .header-actions {
        display: flex;
        gap: 12px;
      }
    }

    .salon-tabs {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 4px 0;

      .tab-pill {
        padding: 10px 24px;
        border-radius: var(--radius-lg);
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
          background-color: #3B82F6;
          color: #FFFFFF;
          border-color: #3B82F6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
      }
    }

    .info-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #FFFFFF;
      padding: 12px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--card-border);
      font-size: 13px;
      color: #64748B;

      .info-text {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn-delete-zone {
        background: none;
        border: none;
        color: var(--danger);
        font-weight: 600;
        cursor: pointer;
        font-size: 13px;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .canvas-container {
      flex: 1;
      min-height: 520px;
      border: 2px dashed #CBD5E1;
      border-radius: var(--radius-lg);
      position: relative;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);

      .empty-canvas {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #94A3B8;
        text-align: center;
      }
    }

    .draggable-table {
      width: 140px;
      height: 120px;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: grab;
      position: absolute;
      transition: box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
      user-select: none;

      &:active {
        cursor: grabbing;
        box-shadow: var(--shadow-xl);
        z-index: 10;
        transform: scale(1.03);
      }

      &.available {
        background: linear-gradient(180deg, #ECFDF5 0%, #FFFFFF 100%);
        border: 2px solid #10B981;
        .table-status-pill { background: #D1FAE5; color: #065F46; }
      }

      &.occupied {
        background: linear-gradient(180deg, #FEF2F2 0%, #FFFFFF 100%);
        border: 2px solid #EF4444;
        .table-status-pill { background: #FEE2E2; color: #991B1B; }
      }

      &.reserved {
        background: linear-gradient(180deg, #FFFBEB 0%, #FFFFFF 100%);
        border: 2px solid #F59E0B;
        .table-status-pill { background: #FEF3C7; color: #92400E; }
      }

      .btn-delete-table {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: #FEE2E2;
        color: #EF4444;
        border: none;
        font-size: 13px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0.8;

        &:hover {
          opacity: 1;
          background-color: #EF4444;
          color: #FFFFFF;
        }
      }

      .table-icon {
        font-size: 30px;
        margin-bottom: 2px;
      }

      .table-name {
        font-weight: 800;
        font-size: 14px;
        color: #0F172A;
      }

      .table-status-pill {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 6px;
        margin-top: 3px;
      }

      .table-pax-badge {
        background: #F1F5F9;
        border: 1px solid #CBD5E1;
        color: #334155;
        font-size: 11px;
        font-weight: 700;
        padding: 2px 8px;
        border-radius: 12px;
        margin-top: 3px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 3px;
        transition: all 0.2s ease;

        &:hover {
          background: #E2E8F0;
          border-color: #94A3B8;
          transform: scale(1.05);
        }
      }

      .capacity-picker {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;

        .cap-chip {
          background: #F8FAFC;
          border: 1px solid #CBD5E1;
          border-radius: 16px;
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            background: #E2E8F0;
          }

          &.active {
            background: #3B82F6;
            border-color: #2563EB;
            color: #FFFFFF;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
          }
        }
      }

      .table-coords {
        font-size: 10px;
        color: #94A3B8;
        margin-top: 2px;
      }
    }

    /* Modal Backdrop */
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

      &.modal-table-add {
        max-width: 340px;
        padding: 22px;
        gap: 12px;
      }

      h3 {
        font-size: 20px;
        font-weight: 700;
        color: #0F172A;
      }

      p {
        font-size: 14px;
        color: #64748B;
      }

      .form-input {
        width: 100%;
        padding: 10px 14px;
        border: 1px solid #CBD5E1;
        border-radius: var(--radius-md);
        font-size: 14px;
        outline: none;

        &:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 8px;
      }
    }
  `]
})
export class SalonDesignComponent {
  restaurant = inject(RestaurantService);
  notify = inject(NotificationModalService);

  showNewZoneModal = signal(false);
  showNewTableModal = signal(false);
  isSaved = signal(false);

  newZoneName = '';
  newTableName = '';
  newTableCapacity = 4;

  selectSalon(salonId: string): void {
    this.restaurant.activeSalonId.set(salonId);
  }

  getTableWidth(capacity?: number): number {
    const pax = capacity || 4;
    const multiplier = Math.max(1, Math.ceil(pax / 4));
    return multiplier * 140; // 4 pax -> 140px, 8 pax -> 280px (doble), 12 pax -> 420px (triple)...
  }

  getTableIconRange(capacity?: number): number[] {
    const pax = capacity || 4;
    const count = Math.min(4, Math.max(1, Math.ceil(pax / 4)));
    return Array.from({ length: count }, (_, i) => i);
  }

  openNewZoneModal(): void {
    this.newZoneName = '';
    this.showNewZoneModal.set(true);
  }

  createZone(): void {
    const name = this.newZoneName.trim();
    if (!name) return;
    this.restaurant.addSalon(name);
    this.showNewZoneModal.set(false);
    this.notify.success({
      title: '¡Zona Agregada!',
      message: `El salón/zona "${name}" se ha creado y sincronizado correctamente en el sistema.`,
      confirmText: 'Aceptar'
    });
  }

  async deleteCurrentZone(): Promise<void> {
    const confirmed = await this.notify.confirm({
      title: '¿Eliminar Zona del Salón?',
      message: 'Vas a remover este salón por completo junto con todas las mesas asignadas. ¿Deseas continuar?',
      confirmText: 'Eliminar Zona',
      cancelText: 'Cancelar',
      isDanger: true
    });
    if (confirmed) {
      this.restaurant.deleteSalon(this.restaurant.activeSalonId());
    }
  }

  openNewTableModal(): void {
    this.newTableName = `Mesa ${this.restaurant.activeSalonTables().length + 1}`;
    this.newTableCapacity = 4;
    this.showNewTableModal.set(true);
  }

  createTable(): void {
    const name = this.newTableName.trim();
    if (!name) return;
    const capacity = Number(this.newTableCapacity) || 4;
    this.restaurant.addTable(this.restaurant.activeSalonId(), name, capacity);
    this.showNewTableModal.set(false);
    this.notify.success({
      title: '¡Mesa Agregada Exitosamente!',
      message: `Se agregó "${name}" para ${capacity} personas al diseño del salón y se conectó con Salón, Cocina y POS.`,
      confirmText: 'Entendido'
    });
  }

  editCapacity(table: Table, event: Event): void {
    event.stopPropagation();
    const input = prompt(`Cambiar capacidad para ${table.name} (personas):`, String(table.capacity || 4));
    if (input !== null) {
      const num = Number(input);
      if (!isNaN(num) && num > 0) {
        this.restaurant.updateTableCapacity(table.id, num);
        this.notify.success({
          title: '¡Capacidad Actualizada!',
          message: `La capacidad de "${table.name}" ahora es de ${num} comensales.`,
          confirmText: 'Aceptar'
        });
      }
    }
  }

  async deleteTable(tableId: string): Promise<void> {
    const table = this.restaurant.activeSalonTables().find(t => t.id === tableId);
    const confirmed = await this.notify.confirm({
      title: '¿Eliminar Mesa?',
      message: `Vas a remover "${table?.name || 'la mesa'}" por completo del salón. ¿Deseas continuar?`,
      confirmText: 'Eliminar Mesa',
      cancelText: 'Cancelar',
      isDanger: true
    });
    if (confirmed) {
      this.restaurant.deleteTable(tableId);
    }
  }

  onTableDragEnd(event: CdkDragEnd, table: Table): void {
    const newPos = event.source.getFreeDragPosition();
    const cleanX = Math.max(10, Math.round(newPos.x));
    const cleanY = Math.max(10, Math.round(newPos.y));
    this.restaurant.updateTablePosition(table.id, cleanX, cleanY);
  }

  saveLayout(): void {
    this.isSaved.set(true);
    setTimeout(() => {
      this.isSaved.set(false);
    }, 2500);
    this.notify.success({
      title: '¡Diseño Guardado Exitosamente!',
      message: 'Las ubicaciones y configuraciones de las mesas se han sincronizado en todo el sistema y en la nube.',
      confirmText: 'Aceptar'
    });
  }
}

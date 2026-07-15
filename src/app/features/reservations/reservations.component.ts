import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';
import { NotificationModalService } from '../../core/services/notification-modal.service';
import { Reservation } from '../../core/models';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reservations-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-title">
          <h2>📅 Reservas</h2>
          <p class="subtitle">Agenda y control de visitas futuras</p>
        </div>
        <button class="btn btn-primary" (click)="openNewReservationModal()">
          <span>+ Nueva Reserva</span>
        </button>
      </div>

      <!-- Reservations Cards Grid exact to screenshot 4 -->
      <div class="reservations-grid">
        <div *ngFor="let res of restaurant.reservations()" class="reservation-card">
          
          <!-- Card Header: Name & Status Pill -->
          <div class="card-header">
            <span class="client-name">{{ res.clientName }}</span>
            <span class="badge badge-success status-pill">CONFIRMADA</span>
          </div>

          <!-- Phone -->
          <div class="phone-info">
            <span>📞 {{ res.phone || 'Sin teléfono' }}</span>
          </div>

          <!-- Grid details (FECHA | HORA | PAX | MESA) -->
          <div class="res-details-grid">
            <div class="detail-box">
              <span class="detail-label">FECHA</span>
              <span class="detail-value">{{ formatDate(res.date) }}</span>
            </div>
            <div class="detail-box">
              <span class="detail-label">HORA</span>
              <span class="detail-value time-val">{{ res.time }}</span>
            </div>
            <div class="detail-box">
              <span class="detail-label">PAX</span>
              <span class="detail-value">{{ res.pax }}</span>
            </div>
            <div class="detail-box">
              <span class="detail-label">MESA</span>
              <span class="detail-value table-val">{{ res.tableName }}</span>
            </div>
          </div>

          <!-- Notes badge if any (e.g. Silla de bebe) -->
          <div *ngIf="res.notes" class="notes-badge">
            <span>📄 {{ res.notes }}</span>
          </div>

          <!-- Delete / Cancel button -->
          <button class="btn-delete-res" (click)="deleteReservation(res.id)">
            Eliminar Historial
          </button>
        </div>

        <div *ngIf="restaurant.reservations().length === 0" class="empty-reservations">
          <p>No hay reservas agendadas actualmente. Presiona <strong>+ Nueva Reserva</strong> para agendar una visita.</p>
        </div>
      </div>

      <!-- Modal: Nueva Reserva -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-card">
          <h3>Agendar Nueva Reserva</h3>
          
          <div class="form-group">
            <label>Nombre del Cliente o Familia:</label>
            <input type="text" [(ngModel)]="newClientName" placeholder="Ej: Familia Hidalgo, Luis Velez..." class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Teléfono (opcional):</label>
              <input type="text" [(ngModel)]="newPhone" placeholder="099..." class="form-input" />
            </div>
            <div class="form-group">
              <label>Comensales (PAX):</label>
              <input type="number" [(ngModel)]="newPax" min="1" class="form-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Fecha:</label>
              <input type="date" [(ngModel)]="newDate" class="form-input" />
            </div>
            <div class="form-group">
              <label>Hora:</label>
              <input type="time" [(ngModel)]="newTime" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Mesa Asignada:</label>
            <select [(ngModel)]="newTableId" class="form-input">
              <option value="">-- Seleccionar Mesa --</option>
              <option *ngFor="let t of restaurant.tables()" [value]="t.id">{{ t.name }} (Capacidad: {{ t.capacity }} pax)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Notas especiales (ej: Silla de bebé, CUMPLEAÑOS):</label>
            <input type="text" [(ngModel)]="newNotes" placeholder="Opcional..." class="form-input" />
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" [disabled]="!newClientName || !newDate || !newTime || !newTableId" (click)="createReservation()">Agendar Reserva</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reservations-page {
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

    .reservations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .reservation-card {
      background-color: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: var(--radius-xl);
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .client-name {
          font-size: 18px;
          font-weight: 700;
          color: #1D4ED8; /* Blue name exact to screenshot 4 */
        }

        .status-pill {
          background-color: #059669; /* Dark green pill EXACT to screenshot 4 [CONFIRMADA] */
          color: #FFFFFF;
          font-weight: 800;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 6px;
        }
      }

      .phone-info {
        font-size: 13px;
        color: #64748B;
      }

      .res-details-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        background-color: #FAFAFA;
        border: 1px solid #F1F5F9;
        border-radius: var(--radius-md);
        padding: 10px 6px;
        text-align: center;

        .detail-box {
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-right: 1px solid #E2E8F0;
          &:last-child { border-right: none; }

          .detail-label { font-size: 10px; font-weight: 700; color: #94A3B8; letter-spacing: 0.5px; }
          .detail-value { font-size: 14px; font-weight: 700; color: #0F172A; }
          .time-val { color: #DC2626; } /* Red time exact to screenshot 4 */
          .table-val { color: #2563EB; } /* Blue table name exact to screenshot 4 */
        }
      }

      .notes-badge {
        background-color: #CFFAFE; /* Cyan exact to screenshot 4 [Silla de bebe] */
        color: #0E7490;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 14px;
        border-radius: var(--radius-sm);
      }

      .btn-delete-res {
        width: 100%;
        padding: 10px;
        border-radius: var(--radius-md);
        background-color: #F8FAFC;
        border: 1px solid var(--card-border);
        color: #64748B;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: #FEE2E2;
          color: #EF4444;
          border-color: #FCA5A5;
        }
      }
    }

    .empty-reservations {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      color: #94A3B8;
    }

    /* Modal styles */
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
      max-width: 460px;
      display: flex;
      flex-direction: column;
      gap: 14px;

      h3 { font-size: 20px; font-weight: 700; color: #0F172A; }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        label { font-size: 13px; font-weight: 600; color: #334155; }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .form-input {
        padding: 10px 14px;
        border: 1px solid var(--card-border);
        border-radius: var(--radius-md);
        font-size: 14px;
        outline: none;
        &:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
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
export class ReservationsComponent {
  restaurant = inject(RestaurantService);
  notify = inject(NotificationModalService);

  showModal = signal(false);
  newClientName = '';
  newPhone = 'Sin teléfono';
  newDate = new Date().toISOString().split('T')[0];
  newTime = '21:00';
  newPax = 4;
  newTableId = '';
  newNotes = '';

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`; // DD/MM exactly like screenshot 4
    }
    return dateStr;
  }

  openNewReservationModal(): void {
    this.newClientName = '';
    this.newPhone = '099...';
    this.newDate = new Date().toISOString().split('T')[0];
    this.newTime = '20:30';
    this.newPax = 4;
    const avail = this.restaurant.tables().find(t => t.status === 'available');
    this.newTableId = avail ? avail.id : (this.restaurant.tables()[0]?.id || '');
    this.newNotes = '';
    this.showModal.set(true);
  }

  createReservation(): void {
    if (!this.newClientName || !this.newDate || !this.newTime || !this.newTableId) {
      this.notify.alert({ title: 'Campos Incompletos', message: 'Por favor completa el nombre del cliente, fecha, hora y selecciona una mesa.' });
      return;
    }
    const table = this.restaurant.tables().find(t => t.id === this.newTableId);
    const salon = this.restaurant.salons().find(s => s.id === table?.salonId);

    this.restaurant.addReservation({
      clientName: this.newClientName.trim(),
      phone: this.newPhone.trim() || 'Sin teléfono',
      date: this.newDate,
      time: this.newTime,
      pax: this.newPax,
      tableId: this.newTableId,
      tableName: table?.name || 'Mesa X',
      salonId: table?.salonId || 'main',
      notes: this.newNotes.trim(),
      status: 'confirmed'
    });
    this.showModal.set(false);
    this.notify.success({
      title: '¡Reserva Registrada Exitosamente!',
      message: `Se agendó la reserva para ${this.newClientName.trim()} (${this.newPax} personas) en ${table?.name || 'la mesa'}.`,
      confirmText: 'Aceptar'
    });
  }

  async deleteReservation(resId: string): Promise<void> {
    const res = this.restaurant.reservations().find(r => r.id === resId);
    const confirmed = await this.notify.confirm({
      title: '¿Cancelar Reserva?',
      message: `Vas a eliminar la reserva de "${res?.clientName || 'este cliente'}" agendada para el ${res?.date || ''} a las ${res?.time || ''}. ¿Deseas continuar?`,
      confirmText: 'Eliminar Reserva',
      cancelText: 'Volver',
      isDanger: true
    });
    if (confirmed) {
      this.restaurant.deleteReservation(resId);
    }
  }
}

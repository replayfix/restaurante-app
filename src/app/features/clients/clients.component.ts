import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';
import { NotificationModalService } from '../../core/services/notification-modal.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="clients-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h2>👥 Gestión de Clientes & CRM</h2>
          <p class="subtitle">Directorio de clientes frecuentes, historial y preferencias</p>
        </div>
        <button class="btn btn-primary" (click)="openNewClientModal()">
          <span>+ Nuevo Cliente</span>
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-section card">
        <input
          type="text"
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          placeholder="🔍 Buscar por nombre o teléfono..."
          class="search-input"
        />
      </div>

      <!-- Clients Directory Table -->
      <div class="card clients-table-card">
        <table class="clients-table">
          <thead>
            <tr>
              <th>CLIENTE</th>
              <th>TELÉFONO / CONTACTO</th>
              <th>TOTAL VISITAS</th>
              <th>TOTAL GASTADO</th>
              <th>ÚLTIMA VISITA</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let client of filteredClients()">
              <td>
                <div class="client-cell">
                  <div class="avatar-circle">{{ client.name.charAt(0) }}</div>
                  <div>
                    <div class="client-name">{{ client.name }}</div>
                    <div *ngIf="client.preferences" class="client-prefs">🌟 {{ client.preferences }}</div>
                  </div>
                </div>
              </td>
              <td>{{ client.phone }}</td>
              <td>
                <span class="badge badge-info">{{ client.totalVisits }} visitas</span>
              </td>
              <td class="amount-cell">S/. {{ client.totalSpent.toFixed(2) }}</td>
              <td>{{ client.lastVisit }}</td>
              <td class="actions-cell">
                <button class="btn-action" title="Ver Historial" (click)="viewHistory(client)">Ver Historial</button>
                <button class="btn-action edit-btn" title="Editar Cliente" (click)="editClient(client)">✏️</button>
                <button class="btn-action delete-btn" title="Eliminar Cliente" (click)="deleteClient(client)">🗑️</button>
              </td>
            </tr>
            <tr *ngIf="filteredClients().length === 0">
              <td colspan="6" class="empty-table">No se encontraron clientes registrados en el directorio.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Nuevo/Editar Cliente -->
      <div class="modal-backdrop" *ngIf="showModal()">
        <div class="modal-card">
          <h3>{{ isEditing ? '✏️ Editar Cliente' : 'Registrar Nuevo Cliente' }}</h3>
          
          <div class="form-group">
            <label>Nombre o Razón Social:</label>
            <input type="text" [(ngModel)]="newName" placeholder="Ej: Familia Hidalgo" class="form-input" />
          </div>

          <div class="form-group">
            <label>Teléfono:</label>
            <input type="text" [(ngModel)]="newPhone" placeholder="099..." class="form-input" />
          </div>

          <div class="form-group">
            <label>Preferencias alimenticias / Notas del CRM:</label>
            <input type="text" [(ngModel)]="newPrefs" placeholder="Ej: Mesa cerca a la ventana, sin cebolla" class="form-input" />
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="showModal.set(false)">Cancelar</button>
            <button class="btn btn-primary" [disabled]="!newName" (click)="saveClient()">
              {{ isEditing ? 'Guardar Cambios' : 'Guardar Cliente' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clients-page {
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

    .search-section {
      padding: 16px 20px;

      .search-input {
        width: 100%;
        border: 1px solid var(--card-border);
        border-radius: var(--radius-md);
        padding: 12px 16px;
        font-size: 14px;
        outline: none;
        &:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
      }
    }

    .clients-table-card {
      overflow-x: auto;
    }

    .clients-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      thead {
        background-color: #F8FAFC;
        border-bottom: 2px solid #E2E8F0;

        th {
          padding: 14px 20px;
          font-size: 11px;
          font-weight: 800;
          color: #64748B;
          letter-spacing: 0.5px;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #F1F5F9;
          &:hover { background-color: #FAFAFA; }

          td {
            padding: 16px 20px;
            font-size: 14px;
            color: #334155;
          }
        }
      }
    }

    .client-cell {
      display: flex;
      align-items: center;
      gap: 12px;

      .avatar-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3B82F6, #1D4ED8);
        color: #FFFFFF;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      }

      .client-name { font-weight: 700; color: #0F172A; }
      .client-prefs { font-size: 12px; color: #EAB308; font-weight: 600; margin-top: 2px; }
    }

    .amount-cell { font-weight: 800; color: #10B981; }

    .actions-cell {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .btn-action {
      background: none;
      border: 1px solid var(--card-border);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #3B82F6;
      cursor: pointer;
      &:hover { background-color: #EFF6FF; border-color: #BFDBFE; }
    }

    .edit-btn { color: #F59E0B; &:hover { background-color: #FEF3C7; border-color: #FDE68A; } }
    .delete-btn { color: #EF4444; &:hover { background-color: #FEE2E2; border-color: #FECACA; } }

    .empty-table {
      text-align: center;
      padding: 40px;
      color: #94A3B8;
    }

    /* Modal */
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
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: 14px;

      h3 { font-size: 20px; font-weight: 700; color: #0F172A; }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        label { font-size: 13px; font-weight: 600; color: #334155; }
        .form-input {
          padding: 10px 14px;
          border: 1px solid var(--card-border);
          border-radius: var(--radius-md);
          font-size: 14px;
          outline: none;
          &:focus { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
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
export class ClientsComponent {
  restaurant = inject(RestaurantService);
  notify = inject(NotificationModalService);

  searchQuery = signal('');
  showModal = signal(false);
  isEditing = false;
  editingId = '';

  newName = '';
  newPhone = '';
  newPrefs = '';

  filteredClients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.restaurant.clients();
    return this.restaurant.clients().filter(c => c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)));
  });

  openNewClientModal(): void {
    this.isEditing = false;
    this.editingId = '';
    this.newName = '';
    this.newPhone = '';
    this.newPrefs = '';
    this.showModal.set(true);
  }

  editClient(client: any): void {
    this.isEditing = true;
    this.editingId = client.id;
    this.newName = client.name;
    this.newPhone = client.phone;
    this.newPrefs = client.preferences || '';
    this.showModal.set(true);
  }

  async deleteClient(client: any): Promise<void> {
    const confirmed = await this.notify.confirm({
      title: '¿Eliminar del Directorio?',
      message: `Vas a remover al cliente "${client.name}" por completo. El historial de sus órdenes pasadas permanecerá intacto en reportes.`,
      confirmText: 'Eliminar Cliente',
      cancelText: 'Cancelar',
      isDanger: true
    });
    if (confirmed) {
      this.restaurant.deleteClient(client.id);
    }
  }

  saveClient(): void {
    const name = this.newName.trim();
    if (!name) return;
    if (this.isEditing && this.editingId) {
      this.restaurant.updateClient(this.editingId, {
        name: name,
        phone: this.newPhone.trim() || 'Sin teléfono',
        preferences: this.newPrefs.trim()
      });
      this.showModal.set(false);
      this.notify.success({
        title: '¡Cliente Actualizado!',
        message: `Los datos y preferencias de "${name}" se han actualizado correctamente.`,
        confirmText: 'Aceptar'
      });
    } else {
      this.restaurant.addClient({
        name: name,
        phone: this.newPhone.trim() || 'Sin teléfono',
        email: '',
        preferences: this.newPrefs.trim(),
        totalVisits: 1,
        visitsCount: 1,
        totalSpent: 0,
        lastVisit: new Date().toLocaleDateString('es-ES')
      });
      this.showModal.set(false);
      this.notify.success({
        title: '¡Cliente Registrado!',
        message: `Se ha registrado a "${name}" en el directorio CRM con éxito.`,
        confirmText: 'Listo'
      });
    }
  }

  viewHistory(client: any): void {
    this.notify.alert({
      title: `Historial de ${client.name}`,
      message: `Visitas totales: ${client.totalVisits}\nConsumo acumulado: S/. ${client.totalSpent.toFixed(2)}\nNotas/Preferencias: ${client.preferences || 'Ninguna'}`,
      confirmText: 'Entendido'
    });
  }
}

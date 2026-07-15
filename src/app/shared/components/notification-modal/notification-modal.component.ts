import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationModalService } from '../../../core/services/notification-modal.service';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-modal-backdrop" *ngIf="modalService.options() as opt" (click)="onBackdropClick(opt)">
      <div class="custom-modal-card" (click)="$event.stopPropagation()" [ngClass]="opt.type || 'confirm'">
        
        <!-- Icono decorativo -->
        <div class="modal-icon-wrapper" [ngClass]="opt.type || 'confirm'">
          <span *ngIf="opt.type === 'danger' || opt.isDanger">🗑️</span>
          <span *ngIf="opt.type === 'success'">✅</span>
          <span *ngIf="opt.type === 'alert'">⚠️</span>
          <span *ngIf="!opt.type || opt.type === 'confirm'">💡</span>
        </div>

        <!-- Título -->
        <h3 class="modal-title">{{ opt.title }}</h3>

        <!-- Descripción / Mensaje -->
        <p class="modal-message">{{ opt.message }}</p>

        <!-- Botones de Acción -->
        <div class="modal-buttons">
          <button 
            *ngIf="opt.type === 'danger' || opt.type === 'confirm'" 
            class="btn-cancel" 
            (click)="modalService.close(false)">
            {{ opt.cancelText || 'Cancelar' }}
          </button>
          
          <button 
            class="btn-confirm" 
            [ngClass]="opt.type || 'confirm'"
            (click)="modalService.close(true)">
            {{ opt.confirmText || 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
      animation: backdropFade 0.2s ease;
    }

    .custom-modal-card {
      background: #FFFFFF;
      width: 100%;
      max-width: 440px;
      border-radius: 22px;
      padding: 30px 26px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-icon-wrapper {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      margin-bottom: 18px;

      &.danger { background: #FEE2E2; color: #EF4444; }
      &.success { background: #D1FAE5; color: #10B981; }
      &.alert { background: #FEF3C7; color: #F59E0B; }
      &.confirm { background: #EFF6FF; color: #3B82F6; }
    }

    .modal-title {
      font-size: 22px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 10px 0;
      letter-spacing: -0.3px;
    }

    .modal-message {
      font-size: 14.5px;
      color: #64748B;
      line-height: 1.55;
      margin: 0 0 26px 0;
      padding: 0 8px;
    }

    .modal-buttons {
      display: flex;
      gap: 12px;
      width: 100%;
      justify-content: center;
    }

    .btn-cancel {
      flex: 1;
      padding: 13px 20px;
      border-radius: 12px;
      border: 1.5px solid #E2E8F0;
      background: #F8FAFC;
      color: #475569;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #F1F5F9;
        border-color: #CBD5E1;
        color: #1E293B;
      }
    }

    .btn-confirm {
      flex: 1;
      padding: 13px 20px;
      border-radius: 12px;
      border: none;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      color: #FFFFFF;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      &.danger {
        background: #EF4444;
        box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35);
        &:hover { background: #DC2626; transform: translateY(-1px); }
      }

      &.success {
        background: #10B981;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
        &:hover { background: #059669; transform: translateY(-1px); }
      }

      &.alert {
        background: #F59E0B;
        box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35);
        &:hover { background: #D97706; transform: translateY(-1px); }
      }

      &.confirm {
        background: #3B82F6;
        box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
        &:hover { background: #2563EB; transform: translateY(-1px); }
      }
    }

    @keyframes backdropFade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalPop {
      from { transform: scale(0.92) translateY(10px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
  `]
})
export class NotificationModalComponent {
  modalService = inject(NotificationModalService);

  onBackdropClick(opt: any): void {
    if (opt && (opt.type === 'alert' || opt.type === 'success')) {
      this.modalService.close(true);
    }
  }
}

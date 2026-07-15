import { Injectable, signal } from '@angular/core';

export interface NotificationModalOptions {
  type?: 'confirm' | 'success' | 'alert' | 'danger';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationModalService {
  readonly options = signal<NotificationModalOptions | null>(null);
  private resolvePromise: ((value: boolean) => void) | null = null;

  confirm(options: NotificationModalOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
      this.options.set({
        type: options.isDanger || options.type === 'danger' ? 'danger' : 'confirm',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        isDanger: options.isDanger ?? (options.type === 'danger')
      });
    });
  }

  success(options: { title: string; message: string; confirmText?: string }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
      this.options.set({
        type: 'success',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Aceptar',
        isDanger: false
      });
    });
  }

  alert(options: { title: string; message: string; confirmText?: string }): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.resolvePromise = resolve;
      this.options.set({
        type: 'alert',
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Entendido',
        isDanger: false
      });
    });
  }

  close(result: boolean): void {
    if (this.resolvePromise) {
      this.resolvePromise(result);
      this.resolvePromise = null;
    }
    this.options.set(null);
  }
}

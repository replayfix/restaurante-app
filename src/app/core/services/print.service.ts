import { Injectable, inject } from '@angular/core';
import { Order, CashTransaction } from '../models';
import { NotificationModalService } from './notification-modal.service';

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  notify = inject(NotificationModalService);

  printThermalTicket(order: Order): void {
    const printWindow = window.open('', '_blank', 'width=420,height=650');
    if (!printWindow) {
      this.notify.alert({ title: 'Ventana Bloqueada', message: 'Por favor permite las ventanas emergentes (pop-ups) en tu navegador para imprimir el ticket de cocina / recibo.' });
      return;
    }

    const dateStr = order.closedAt || order.createdAt || new Date().toISOString();
    const formattedDate = new Date(dateStr).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsHtml = order.items.map(item => `
      <tr>
        <td class="col-c">${item.quantity}</td>
        <td class="col-desc">${item.productName}</td>
        <td class="col-total">${item.total.toFixed(2)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket ${order.folio}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            margin: 4mm auto;
            color: #000;
            background: #fff;
            font-size: 13px;
            line-height: 1.35;
          }
          .header {
            text-align: center;
            margin-bottom: 6px;
          }
          .header-icon {
            margin: 0 auto 8px auto;
            display: flex;
            justify-content: center;
          }
          .title {
            font-weight: bold;
            font-size: 15px;
            letter-spacing: 0.5px;
          }
          .divider-dashed {
            border-top: 1px dashed #000;
            margin: 6px 0;
          }
          .divider-solid {
            border-top: 1.5px solid #000;
            margin: 6px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            text-align: left;
            border-bottom: 1.5px solid #000;
            padding-bottom: 4px;
            font-size: 13px;
            font-weight: bold;
          }
          th.col-total, td.col-total {
            text-align: right;
          }
          .col-c {
            width: 14%;
          }
          .col-desc {
            width: 63%;
          }
          .col-total {
            width: 23%;
          }
          td {
            padding: 4px 0;
            font-size: 13px;
          }
          .totals-section {
            margin-top: 4px;
          }
          .row-sub {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin: 3px 0;
          }
          .row-total {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 15px;
            margin: 5px 0;
          }
          .row-payment {
            font-size: 12px;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .row-payment-flex {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            text-transform: uppercase;
            margin-top: 2px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 10px;
          }
          .dot {
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-icon">
            <svg width="52" height="52" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <rect x="14" y="8" width="36" height="24" rx="2" fill="none" stroke="#333" stroke-width="4"/>
              <line x1="20" y1="14" x2="34" y2="14" stroke="#666" stroke-width="2"/>
              <line x1="20" y1="19" x2="28" y2="19" stroke="#666" stroke-width="2"/>
              <line x1="32" y1="19" x2="44" y2="19" stroke="#666" stroke-width="2"/>
              <rect x="22" y="24" width="20" height="22" fill="#fff" stroke="#333" stroke-width="3"/>
              <line x1="26" y1="30" x2="38" y2="30" stroke="#333" stroke-width="2"/>
              <line x1="26" y1="35" x2="38" y2="35" stroke="#333" stroke-width="2"/>
              <line x1="26" y1="40" x2="34" y2="40" stroke="#333" stroke-width="2"/>
              <path d="M18 46 H46 L50 54 H14 Z" fill="none" stroke="#333" stroke-width="3"/>
            </svg>
          </div>
          <div class="title">MI RESTAURANTE</div>
          <div>Av. Gastronómica 123, Lima</div>
          <div>Tel: (01) 555-9992</div>
          <div style="margin-top:6px;">${formattedDate}</div>
          <div style="font-weight:bold;">TICKET: ${order.folio}</div>
          <div>Cli: ${order.clientName || 'Público General'}</div>
          <div style="font-weight:bold; margin-top:3px;">MESA: ${order.tableName || 'Mesa 1'}</div>
          <div style="margin-top:4px; font-size:12px; border-top:1px dotted #ccc; padding-top:4px;">
            <div><strong>Atendió (Mesero):</strong> ${order.waiterName || 'Mesero'}</div>
            ${order.cashierName ? `<div><strong>Cobró (Caja):</strong> ${order.cashierName}</div>` : ''}
            ${order.chefName ? `<div><strong>Preparó (Cocina):</strong> ${order.chefName}</div>` : ''}
          </div>
        </div>

        <div class="divider-dashed"></div>

        <table>
          <thead>
            <tr>
              <th class="col-c">C.</th>
              <th class="col-desc">DESCRIPCION</th>
              <th class="col-total">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider-solid"></div>

        <div class="totals-section">
          <div class="row-sub">
            <span>Subtotal:</span>
            <span>S/. ${order.subtotal.toFixed(2)}</span>
          </div>
          <div class="divider-dashed"></div>
          <div class="row-total">
            <span>TOTAL A PAGAR:</span>
            <span>S/. ${order.total.toFixed(2)}</span>
          </div>
          <div class="row-payment">
            <span>F. PAGO: ${order.paymentMethod || 'CASH'}</span>
          </div>
          <div class="row-payment-flex">
            <span>RECIBIDO: ${(order.receivedAmount ?? order.total).toFixed(2)}</span>
            <span>VUELTO: ${(order.changeAmount ?? 0).toFixed(2)}</span>
          </div>
        </div>

        <div class="divider-dashed"></div>

        <div class="footer">
          <div>¡Gracias por su preferencia! Vuelva pronto.</div>
          <div class="dot">.</div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  printTransactionReceipt(trans: CashTransaction): void {
    const printWindow = window.open('', '_blank', 'width=420,height=550');
    if (!printWindow) {
      this.notify.alert({ title: 'Ventana Bloqueada', message: 'Por favor permite las ventanas emergentes para imprimir el comprobante.' });
      return;
    }

    const formattedDate = new Date(trans.timestamp || Date.now()).toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const typeLabel = trans.type === 'sale' ? 'VENTA / COBRO' :
                      trans.type === 'opening' ? 'APERTURA DE CAJA' :
                      trans.type === 'expense' ? 'EGRESO / GASTO' : 'CIERRE Z';

    const sign = trans.type === 'expense' ? '-' : '+';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Comprobante ${trans.folio || trans.id}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            margin: 4mm auto;
            color: #000;
            background: #fff;
            font-size: 13px;
            line-height: 1.35;
          }
          .header { text-align: center; margin-bottom: 6px; }
          .header-icon { margin: 0 auto 8px auto; display: flex; justify-content: center; }
          .title { font-weight: bold; font-size: 15px; letter-spacing: 0.5px; }
          .divider-dashed { border-top: 1px dashed #000; margin: 6px 0; }
          .divider-solid { border-top: 1.5px solid #000; margin: 6px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 13px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin: 8px 0; }
          .footer { text-align: center; font-size: 12px; margin-top: 12px; }
          .dot { margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-icon">
            <svg width="52" height="52" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <rect x="14" y="8" width="36" height="24" rx="2" fill="none" stroke="#333" stroke-width="4"/>
              <line x1="20" y1="14" x2="34" y2="14" stroke="#666" stroke-width="2"/>
              <line x1="20" y1="19" x2="28" y2="19" stroke="#666" stroke-width="2"/>
              <line x1="32" y1="19" x2="44" y2="19" stroke="#666" stroke-width="2"/>
              <rect x="22" y="24" width="20" height="22" fill="#fff" stroke="#333" stroke-width="3"/>
              <line x1="26" y1="30" x2="38" y2="30" stroke="#333" stroke-width="2"/>
              <line x1="26" y1="35" x2="38" y2="35" stroke="#333" stroke-width="2"/>
              <line x1="26" y1="40" x2="34" y2="40" stroke="#333" stroke-width="2"/>
              <path d="M18 46 H46 L50 54 H14 Z" fill="none" stroke="#333" stroke-width="3"/>
            </svg>
          </div>
          <div class="title">MI RESTAURANTE</div>
          <div>Av. Gastronómica 123, Lima</div>
          <div style="margin-top:6px;">${formattedDate}</div>
          <div style="font-weight:bold; margin-top:4px;">COMPROBANTE DE MOVIMIENTO</div>
          <div style="font-weight:bold;">${trans.folio || trans.id}</div>
        </div>

        <div class="divider-dashed"></div>

        <div class="info-row">
          <span>TIPO:</span>
          <span style="font-weight:bold;">${typeLabel}</span>
        </div>
        <div class="info-row">
          <span>CAJERO / COBRÓ:</span>
          <span style="font-weight:bold;">${trans.cashier || 'Administrador'}</span>
        </div>
        ${trans.waiterName ? `<div class="info-row"><span>MESERO:</span><span>${trans.waiterName}</span></div>` : ''}
        ${trans.chefName ? `<div class="info-row"><span>COCINA / CHEF:</span><span>${trans.chefName}</span></div>` : ''}
        <div class="info-row">
          <span>F. PAGO:</span>
          <span>${trans.paymentMethod || 'CASH'}</span>
        </div>
        <div style="margin: 6px 0; font-size:13px;">
          <div style="font-weight:bold;">DESCRIPCIÓN:</div>
          <div style="margin-top:2px;">${trans.description || 'Movimiento de caja'}</div>
        </div>

        <div class="divider-solid"></div>

        <div class="total-row">
          <span>MONTO TOTAL:</span>
          <span>${sign} S/. ${trans.amount.toFixed(2)}</span>
        </div>

        <div class="divider-dashed"></div>

        <div class="footer">
          <div>Control de Caja - Sistema de Gestión</div>
          <div class="dot">.</div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  printZReport(summary: {
    folio: string;
    date: string;
    opening: number;
    cashSales: number;
    cardSales: number;
    transferSales: number;
    expenses: number;
    cashBalance: number;
    totalTurno: number;
  }): void {
    const printWindow = window.open('', '_blank', 'width=420,height=650');
    if (!printWindow) {
      this.notify.alert({ title: 'Ventana Bloqueada', message: 'Por favor permite los pop-ups para poder visualizar e imprimir el Reporte Z.' });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte Z ${summary.folio}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 72mm;
            margin: 4mm auto;
            color: #000;
            background: #fff;
            font-size: 13px;
            line-height: 1.35;
          }
          .header { text-align: center; margin-bottom: 6px; }
          .header-icon { margin: 0 auto 8px auto; display: flex; justify-content: center; }
          .title { font-weight: bold; font-size: 15px; letter-spacing: 0.5px; }
          .divider-dashed { border-top: 1px dashed #000; margin: 6px 0; }
          .divider-solid { border-top: 1.5px solid #000; margin: 6px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 13px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 15px; margin: 6px 0; }
          .grand-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin: 8px 0; border-top: 1px solid #000; padding-top: 4px; }
          .footer { text-align: center; font-size: 12px; margin-top: 12px; }
          .dot { margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-icon">
            <svg width="52" height="52" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
              <rect x="14" y="8" width="36" height="24" rx="2" fill="none" stroke="#333" stroke-width="4"/>
              <line x1="20" y1="14" x2="34" y2="14" stroke="#666" stroke-width="2"/>
              <line x1="20" y1="19" x2="28" y2="19" stroke="#666" stroke-width="2"/>
              <line x1="32" y1="19" x2="44" y2="19" stroke="#666" stroke-width="2"/>
              <rect x="22" y="24" width="20" height="22" fill="#fff" stroke="#333" stroke-width="3"/>
              <line x1="26" y1="30" x2="38" y2="30" stroke="#333" stroke-width="2"/>
              <line x1="26" y1="35" x2="38" y2="35" stroke="#333" stroke-width="2"/>
              <line x1="26" y1="40" x2="34" y2="40" stroke="#333" stroke-width="2"/>
              <path d="M18 46 H46 L50 54 H14 Z" fill="none" stroke="#333" stroke-width="3"/>
            </svg>
          </div>
          <div class="title">MI RESTAURANTE</div>
          <div>Av. Gastronómica 123, Lima</div>
          <div style="margin-top:6px;">${summary.date}</div>
          <div style="font-weight:bold; margin-top:4px;">CIERRE DE TURNO - REPORTE Z</div>
          <div style="font-weight:bold;">FOLIO: ${summary.folio}</div>
        </div>

        <div class="divider-dashed"></div>

        <div class="info-row">
          <span>(+) Fondo Inicial:</span>
          <span>S/. ${summary.opening.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span>(+) Ventas Efectivo:</span>
          <span>S/. ${summary.cashSales.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span>(+) Ventas Tarjeta:</span>
          <span>S/. ${summary.cardSales.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span>(+) Transf / Yape / QR:</span>
          <span>S/. ${summary.transferSales.toFixed(2)}</span>
        </div>
        <div class="info-row" style="color:#b91c1c;">
          <span>(-) Egresos / Gastos:</span>
          <span>- S/. ${summary.expenses.toFixed(2)}</span>
        </div>

        <div class="divider-solid"></div>

        <div class="total-row">
          <span>EFECTIVO EN CAJA:</span>
          <span>S/. ${summary.cashBalance.toFixed(2)}</span>
        </div>
        <div class="grand-row">
          <span>TOTAL VENTAS TURNO:</span>
          <span>S/. ${summary.totalTurno.toFixed(2)}</span>
        </div>

        <div class="divider-dashed"></div>

        <div class="footer">
          <div>Auditoría Fiscal Z - Sistema POS</div>
          <div class="dot">.</div>
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}

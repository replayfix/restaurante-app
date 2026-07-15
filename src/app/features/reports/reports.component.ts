import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page">
      <!-- Header exact to screenshot 7 -->
      <div class="page-header">
        <div>
          <h2>📈 Reportes y Analíticas</h2>
          <p class="subtitle">Control financiero y métricas clave de tu restaurante</p>
        </div>

        <div class="header-filters">
          <select class="form-select filter-date">
            <option value="today">📅 Hoy ({{ todayStr }})</option>
            <option value="week">📅 Esta Semana</option>
            <option value="month">📅 Este Mes</option>
          </select>
          <button class="btn btn-secondary" (click)="exportToCSV()">
            <span>📥 Exportar CSV</span>
          </button>
        </div>
      </div>

      <!-- 4 KPI Cards Grid exact to screenshot 7 -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">VENTAS TOTALES</span>
          <div class="kpi-main">
            <span class="kpi-val">S/. {{ restaurant.reportsData().totalSales.toFixed(2) }}</span>
            <span class="badge badge-success">+12.5% vs ayer</span>
          </div>
          <span class="kpi-sub">Ingresos brutos cerrados hoy</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">PEDIDOS COMPLETADOS</span>
          <div class="kpi-main">
            <span class="kpi-val">{{ restaurant.reportsData().completedOrdersCount }}</span>
            <span class="badge badge-info">100% cobrados</span>
          </div>
          <span class="kpi-sub">Promedio de consumo constante</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">TICKET PROMEDIO</span>
          <div class="kpi-main">
            <span class="kpi-val">S/. {{ restaurant.reportsData().averageTicket.toFixed(2) }}</span>
            <span class="badge badge-success">+5.2%</span>
          </div>
          <span class="kpi-sub">Por cuenta cerrada en mesa</span>
        </div>

        <div class="kpi-card">
          <span class="kpi-label">TIEMPO PROMEDIO COCINA</span>
          <div class="kpi-main">
            <span class="kpi-val">{{ restaurant.reportsData().kitchenAvgTimeMinutes }} min</span>
            <span class="badge badge-success">Óptimo (&lt; 15m)</span>
          </div>
          <span class="kpi-sub">Entre toma de pedido y entrega</span>
        </div>
      </div>

      <!-- Bottom Panels Grid -->
      <div class="panels-grid">
        <!-- Panel 1: Categorías Más Vendidas -->
        <div class="report-panel card">
          <div class="panel-header">
            <h4>🔥 Categorías Más Vendidas</h4>
          </div>
          <div class="categories-bars">
            <div *ngFor="let cat of topCategories()" class="bar-row">
              <div class="bar-info">
                <span class="cat-name">{{ cat.name }}</span>
                <span class="cat-amount">S/. {{ cat.amount.toFixed(2) }} ({{ cat.percent }}%)</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" [style.width.%]="cat.percent"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Panel 2: Top Productos del Día -->
        <div class="report-panel card">
          <div class="panel-header">
            <h4>⭐ Top Productos del Día</h4>
          </div>
          <div class="products-list">
            <div *ngFor="let prod of topProducts(); let i = index" class="prod-row">
              <div class="prod-rank">{{ i + 1 }}</div>
              <div class="prod-info">
                <span class="prod-name">{{ prod.name }}</span>
                <span class="prod-qty">{{ prod.quantity }} unidades vendidas</span>
              </div>
              <div class="prod-rev">S/. {{ prod.revenue.toFixed(2) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
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

      .header-filters {
        display: flex;
        gap: 12px;

        .filter-date {
          padding: 8px 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--card-border);
          background-color: #FFFFFF;
          font-weight: 600;
          color: #334155;
        }
      }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .kpi-card {
      background-color: #FFFFFF;
      border: 1px solid var(--card-border);
      border-radius: var(--radius-xl);
      padding: 22px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: var(--shadow-sm);

      .kpi-label { font-size: 11px; font-weight: 800; color: #64748B; letter-spacing: 0.5px; }

      .kpi-main {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;

        .kpi-val { font-size: 28px; font-weight: 800; color: #0F172A; font-family: var(--font-title); }
      }

      .kpi-sub { font-size: 12px; color: #94A3B8; }
    }

    .panels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .report-panel {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;

      .panel-header {
        border-bottom: 1px solid #F1F5F9;
        padding-bottom: 14px;
        h4 { font-size: 18px; font-weight: 700; color: #0F172A; }
      }
    }

    .categories-bars {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .bar-row {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .bar-info {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }

        .progress-track {
          width: 100%;
          height: 10px;
          background-color: #F1F5F9;
          border-radius: 9999px;
          overflow: hidden;

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #3B82F6, #1D4ED8);
            border-radius: 9999px;
          }
        }
      }
    }

    .products-list {
      display: flex;
      flex-direction: column;
      gap: 14px;

      .prod-row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 10px;
        border-radius: var(--radius-md);
        background-color: #FAFAFA;
        border: 1px solid #F1F5F9;

        .prod-rank {
          width: 28px;
          height: 28px;
          background-color: #EFF6FF;
          color: #2563EB;
          font-weight: 800;
          font-size: 14px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .prod-info {
          flex: 1;
          display: flex;
          flex-direction: column;

          .prod-name { font-weight: 700; font-size: 14px; color: #0F172A; }
          .prod-qty { font-size: 12px; color: #64748B; }
        }

        .prod-rev { font-weight: 800; font-size: 15px; color: #10B981; }
      }
    }
  `]
})
export class ReportsComponent {
  restaurant = inject(RestaurantService);

  todayStr = new Date().toLocaleDateString('es-ES');

  topCategories = computed(() => this.restaurant.topCategoriesAnalytics());
  topProducts = computed(() => this.restaurant.topProductsAnalytics());

  exportToCSV(): void {
    alert('Generando archivo CSV con el reporte analítico detallado del día...');
  }
}

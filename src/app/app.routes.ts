import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'pos',
    loadComponent: () => import('./features/pos/pos-grid/pos-grid.component').then(m => m.PosGridComponent)
  },
  {
    path: 'pos/:id',
    loadComponent: () => import('./features/pos/pos-order-detail/pos-order-detail.component').then(m => m.PosOrderDetailComponent)
  },
  {
    path: 'salon-design',
    loadComponent: () => import('./features/salon-design/salon-design.component').then(m => m.SalonDesignComponent)
  },
  {
    path: 'reservations',
    loadComponent: () => import('./features/reservations/reservations.component').then(m => m.ReservationsComponent)
  },
  {
    path: 'kds',
    loadComponent: () => import('./features/kds/kds.component').then(m => m.KdsComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'cash-history',
    loadComponent: () => import('./features/cash-history/cash-history.component').then(m => m.CashHistoryComponent)
  },
  {
    path: 'menu',
    loadComponent: () => import('./features/menu-products/menu-products.component').then(m => m.MenuProductsComponent)
  },
  {
    path: 'clients',
    loadComponent: () => import('./features/clients/clients.component').then(m => m.ClientsComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

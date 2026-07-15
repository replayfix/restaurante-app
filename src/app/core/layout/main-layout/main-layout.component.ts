import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { NotificationModalComponent } from '../../../shared/components/notification-modal/notification-modal.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, NotificationModalComponent],
  template: `
    <div class="app-layout">
      <app-sidebar></app-sidebar>
      
      <div class="main-content">
        <app-topbar></app-topbar>
        
        <main class="page-container">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
    <app-notification-modal></app-notification-modal>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-main);
    }

    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .page-container {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
    }
  `]
})
export class MainLayoutComponent {}

import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="table-vector-svg">
      
      <!-- Table Floor Shadow -->
      <ellipse cx="32" cy="56" rx="24" ry="4" fill="rgba(15, 23, 42, 0.14)" />

      <!-- Back Chairs / Stools -->
      <rect x="16" y="24" width="8" height="14" rx="2" fill="#94A3B8" opacity="0.35" />
      <rect x="40" y="24" width="8" height="14" rx="2" fill="#94A3B8" opacity="0.35" />

      <!-- Left Leg -->
      <path
        d="M16 32L14 53C13.8 54.2 14.6 55 15.7 55H19.3C20.4 55 21.2 54.2 21.1 53L19.5 32H16Z"
        fill="#334155"
        stroke="#1E293B"
        stroke-width="2.2"
        stroke-linejoin="round"/>

      <!-- Right Leg -->
      <path
        d="M48 32L49.6 53C49.7 54.2 48.9 55 47.8 55H44.2C43.1 55 42.3 54.2 42.4 53L44.5 32H48Z"
        fill="#334155"
        stroke="#1E293B"
        stroke-width="2.2"
        stroke-linejoin="round"/>

      <!-- Tabletop Lower Border/Apron -->
      <path
        d="M11 26C11 24.8954 11.8954 24 13 24H51C52.1046 24 53 24.8954 53 26V31C53 32.6569 51.6569 34 50 34H14C12.3431 34 11 32.6569 11 31V26Z"
        fill="#9C593C"
        stroke="#1E293B"
        stroke-width="2.5"
        stroke-linejoin="round"/>

      <!-- Tabletop Surface (Warm Wood matching illustration) -->
      <path
        d="M6 19C6 17.3431 7.34315 16 9 16H55C56.6569 16 58 17.3431 58 19V25C58 26.6569 56.6569 28 55 28H9C7.34315 28 6 26.6569 6 25V19Z"
        fill="#C27A59"
        stroke="#1E293B"
        stroke-width="2.5"
        stroke-linejoin="round"/>

      <!-- Tabletop Wood Grain Highlights -->
      <path d="M13 20H28" stroke="#E29D7D" stroke-width="1.8" stroke-linecap="round" opacity="0.65"/>
      <path d="M42 20H51" stroke="#E29D7D" stroke-width="1.8" stroke-linecap="round" opacity="0.65"/>

      <!-- Status Indicator Badge (Top Right Corner) -->
      <g *ngIf="status === 'occupied'">
        <circle cx="53" cy="13" r="8.5" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
        <path d="M50.5 10.5V15.5M55.5 10.5V15.5" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <g *ngIf="status === 'reserved'">
        <circle cx="53" cy="13" r="8.5" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2"/>
        <path d="M53 9.5V13H56" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <g *ngIf="status === 'available'">
        <circle cx="53" cy="13" r="8" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
        <path d="M49.5 13L51.8 15.3L56.5 10.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </svg>
  `,
  styles: [`
    .table-vector-svg {
      display: block;
      margin: 0 auto;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
  `]
})
export class TableIconComponent {
  @Input() status: 'available' | 'occupied' | 'reserved' | string = 'available';
  @Input() size: number = 46;
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile Header -->
    <div class="mobile-header">
      <div class="mobile-brand">
        <div class="logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
        <span class="brand-text">Virtual<span class="brand-accent">Trade</span></span>
      </div>
      <button class="mobile-toggle" (click)="mobileOpen = !mobileOpen">
        <svg *ngIf="!mobileOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <svg *ngIf="mobileOpen" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Sidebar -->
    <aside class="sidebar" [class.open]="mobileOpen">
      <!-- Brand -->
      <div class="sidebar-brand">
        <div class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </div>
        <div>
          <div class="brand-text">Virtual<span class="brand-accent">Trade</span></div>
          <div class="brand-sub">Live Simulator</div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <div class="nav-label">Main</div>
        <a routerLink="/dashboard" routerLinkActive="active" class="sidebar-link" (click)="mobileOpen = false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
          </svg>
          Dashboard
        </a>
        <a routerLink="/trade" routerLinkActive="active" class="sidebar-link" (click)="mobileOpen = false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
          Trade
        </a>

        <div class="nav-label" style="margin-top: 20px;">Account</div>
        <a routerLink="/portfolio" routerLinkActive="active" class="sidebar-link" (click)="mobileOpen = false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"></path>
          </svg>
          Portfolio
        </a>
        <a routerLink="/history" routerLinkActive="active" class="sidebar-link" (click)="mobileOpen = false">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          History
        </a>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="live-indicator">
          <span class="live-dot"></span>
          <span class="live-text">Market Live</span>
        </div>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <div class="mobile-overlay" *ngIf="mobileOpen" (click)="mobileOpen = false"></div>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      width: 260px;
      height: 100vh;
      background: rgba(8, 12, 28, 0.95);
      backdrop-filter: blur(20px);
      border-right: 1px solid rgba(51, 65, 85, 0.3);
      display: flex;
      flex-direction: column;
      z-index: 50;
      padding: 0;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 28px 24px;
      border-bottom: 1px solid rgba(51, 65, 85, 0.2);
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05));
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10b981;
    }
    .brand-text {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #f1f5f9;
    }
    .brand-accent { color: #10b981; }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
      margin-top: 1px;
      letter-spacing: 0.5px;
    }
    .sidebar-nav {
      flex: 1;
      padding: 20px 16px;
      overflow-y: auto;
    }
    .nav-label {
      padding: 0 16px;
      margin-bottom: 8px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #475569;
    }
    .sidebar-footer {
      padding: 20px 24px;
      border-top: 1px solid rgba(51, 65, 85, 0.2);
    }
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .live-text {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    /* Mobile */
    .mobile-header {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: rgba(8, 12, 28, 0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(51, 65, 85, 0.3);
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      z-index: 51;
    }
    .mobile-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .mobile-brand .logo-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }
    .mobile-brand .brand-text {
      font-size: 16px;
    }
    .mobile-toggle {
      background: none;
      border: 1px solid rgba(51, 65, 85, 0.5);
      border-radius: 8px;
      padding: 6px;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mobile-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 49;
    }

    @media (max-width: 768px) {
      .sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .sidebar.open {
        transform: translateX(0);
      }
      .mobile-header {
        display: flex;
      }
      .mobile-overlay {
        display: block;
      }
    }
  `]
})
export class SidebarComponent {
  mobileOpen = false;
}

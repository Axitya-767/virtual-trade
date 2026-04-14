import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      min-height: 100vh;
    }
    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: 32px;
      min-height: 100vh;
      max-width: calc(100vw - 260px);
    }
    @media (max-width: 768px) {
      .main-content {
        margin-left: 0;
        padding: 16px;
        padding-top: 72px;
        max-width: 100vw;
      }
    }
  `]
})
export class AppComponent {}
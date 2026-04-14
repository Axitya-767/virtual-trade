import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TradeComponent } from './pages/trade/trade.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { HistoryComponent } from './pages/history/history.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'trade', component: TradeComponent },
  { path: 'portfolio', component: PortfolioComponent },
  { path: 'history', component: HistoryComponent },
  { path: '**', redirectTo: 'dashboard' }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideHttpClient(),
    provideRouter(routes)
  ]
};
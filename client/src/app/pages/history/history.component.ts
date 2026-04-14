import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header animate-fade-in-up">
        <div>
          <h1 class="page-title">Transaction History</h1>
          <p class="page-subtitle">Complete log of all your trades</p>
        </div>
        <div class="header-stats" *ngIf="transactions.length > 0">
          <div class="header-stat">
            <span class="hs-label">Total Trades</span>
            <span class="hs-value font-mono">{{ transactions.length }}</span>
          </div>
          <div class="header-stat">
            <span class="hs-label">Volume</span>
            <span class="hs-value font-mono">\${{ formatNumber(totalVolume) }}</span>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="glass-card filter-bar animate-fade-in-up delay-1" *ngIf="transactions.length > 0">
        <div class="filter-group">
          <label class="filter-label">Filter by Asset</label>
          <select class="filter-select" [(ngModel)]="filterSymbol" (ngModelChange)="applyFilter()">
            <option value="ALL">All Assets</option>
            <option *ngFor="let s of uniqueSymbols" [value]="s">{{ s }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Filter by Type</label>
          <select class="filter-select" [(ngModel)]="filterType" (ngModelChange)="applyFilter()">
            <option value="ALL">All Types</option>
            <option value="BUY">Buy Only</option>
            <option value="SELL">Sell Only</option>
          </select>
        </div>
        <div class="filter-count">
          Showing <span class="font-mono">{{ filteredTransactions.length }}</span> of <span class="font-mono">{{ transactions.length }}</span>
        </div>
      </div>

      <!-- Empty State -->
      <div class="glass-card empty-state animate-fade-in-up delay-2" *ngIf="transactions.length === 0 && loaded">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <h3 class="empty-title">No Transactions Yet</h3>
        <p class="empty-text">Your trade history will appear here once you execute your first trade.</p>
      </div>

      <!-- Transactions Table -->
      <div class="glass-card table-card animate-fade-in-up delay-2" *ngIf="filteredTransactions.length > 0">
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th style="text-align: left;">Date &amp; Time</th>
                <th style="text-align: left;">Type</th>
                <th style="text-align: left;">Asset</th>
                <th style="text-align: right;">Quantity</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total Value</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of filteredTransactions; let i = index"
                  class="tx-row"
                  [class.animate-fade-in-up]="i < 20"
                  [style.animation-delay.ms]="i * 30">
                <td>
                  <div class="date-cell">
                    <span class="date-main">{{ formatDate(tx.timestamp) }}</span>
                    <span class="date-time">{{ formatTime(tx.timestamp) }}</span>
                  </div>
                </td>
                <td>
                  <span [class]="tx.type === 'BUY' ? 'badge-buy' : 'badge-sell'">{{ tx.type }}</span>
                </td>
                <td>
                  <div class="asset-cell">
                    <span class="asset-sym-text">{{ tx.symbol }}</span>
                    <span class="asset-name-text">{{ tx.name }}</span>
                  </div>
                </td>
                <td class="font-mono" style="text-align: right;">{{ tx.amount }}</td>
                <td class="font-mono" style="text-align: right;">\${{ formatNumber(tx.price) }}</td>
                <td style="text-align: right;">
                  <span class="total-value font-mono"
                        [class.val-buy]="tx.type === 'BUY'"
                        [class.val-sell]="tx.type === 'SELL'">
                    {{ tx.type === 'BUY' ? '-' : '+' }}\${{ formatNumber(tx.total) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;
    }
    .page-title { font-size: 28px; font-weight: 800; margin: 0; color: #f1f5f9; letter-spacing: -0.5px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0 0; }
    .header-stats { display: flex; gap: 20px; }
    .header-stat {
      background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(51, 65, 85, 0.3);
      border-radius: 12px; padding: 12px 18px; text-align: right;
    }
    .hs-label { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }
    .hs-value { font-size: 18px; font-weight: 700; color: #f1f5f9; }

    /* Filter Bar */
    .filter-bar {
      display: flex; align-items: flex-end; gap: 20px; padding: 18px 24px; margin-bottom: 20px;
    }
    .filter-group { display: flex; flex-direction: column; gap: 6px; }
    .filter-label {
      font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;
    }
    .filter-select {
      background: rgba(2, 6, 23, 0.8); border: 1px solid rgba(51, 65, 85, 0.5);
      border-radius: 8px; padding: 8px 12px; color: #e2e8f0;
      font-family: 'Inter', sans-serif; font-size: 13px; outline: none; cursor: pointer;
    }
    .filter-select:focus { border-color: #10b981; }
    .filter-select option { background: #0f172a; }
    .filter-count {
      margin-left: auto; font-size: 13px; color: #64748b;
    }

    /* Table */
    .table-card { overflow: hidden; }
    .table-scroll { overflow-x: auto; }
    .date-cell { display: flex; flex-direction: column; }
    .date-main { font-size: 13px; font-weight: 500; color: #e2e8f0; }
    .date-time { font-size: 11px; color: #64748b; margin-top: 2px; }
    .asset-cell { display: flex; flex-direction: column; }
    .asset-sym-text { font-size: 14px; font-weight: 700; color: #e2e8f0; }
    .asset-name-text { font-size: 11px; color: #64748b; margin-top: 1px; }
    .total-value { font-weight: 700; font-size: 14px; }
    .val-buy { color: #f87171; }
    .val-sell { color: #34d399; }
    .tx-row { opacity: 0; animation: fadeInUp 0.4s ease forwards; }

    /* Empty State */
    .empty-state { padding: 60px 40px; text-align: center; }
    .empty-icon { color: #334155; margin-bottom: 16px; }
    .empty-title { font-size: 18px; font-weight: 700; color: #e2e8f0; margin: 0 0 8px 0; }
    .empty-text { font-size: 14px; color: #64748b; margin: 0; }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 16px; }
      .header-stats { width: 100%; }
      .filter-bar { flex-direction: column; align-items: stretch; gap: 12px; }
      .filter-count { margin-left: 0; }
    }
  `]
})
export class HistoryComponent implements OnInit {
  transactions: any[] = [];
  filteredTransactions: any[] = [];
  uniqueSymbols: string[] = [];
  filterSymbol = 'ALL';
  filterType = 'ALL';
  totalVolume = 0;
  loaded = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.http.get('http://localhost:3000/api/user').subscribe((user: any) => {
      if (user?.id) {
        this.http.get(`http://localhost:3000/api/transactions/${user.id}`).subscribe((data: any) => {
          this.transactions = data || [];
          this.uniqueSymbols = [...new Set(this.transactions.map(t => t.symbol))] as string[];
          this.totalVolume = this.transactions.reduce((s, t) => s + t.total, 0);
          this.loaded = true;
          this.applyFilter();
        });
      }
    });
  }

  applyFilter() {
    this.filteredTransactions = this.transactions.filter(t => {
      const matchSymbol = this.filterSymbol === 'ALL' || t.symbol === this.filterSymbol;
      const matchType = this.filterType === 'ALL' || t.type === this.filterType;
      return matchSymbol && matchType;
    });
  }

  formatDate(ts: string): string {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(ts: string): string {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  formatNumber(value: any): string {
    if (!value && value !== 0) return '0.00';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

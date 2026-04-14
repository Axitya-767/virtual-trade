import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header animate-fade-in-up">
        <div>
          <h1 class="page-title">Portfolio</h1>
          <p class="page-subtitle">Your holdings &amp; asset allocation</p>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-row animate-fade-in-up delay-1">
        <div class="glass-card summary-card stat-card-blue">
          <div class="summary-label">Total Portfolio Value</div>
          <div class="summary-value font-mono">\${{ formatNumber(portfolioValue) }}</div>
        </div>
        <div class="glass-card summary-card stat-card-green">
          <div class="summary-label">Wallet Balance</div>
          <div class="summary-value font-mono">\${{ formatNumber(user?.wallet?.balance) }}</div>
        </div>
        <div class="glass-card summary-card stat-card-amber">
          <div class="summary-label">Combined Net Worth</div>
          <div class="summary-value font-mono">\${{ formatNumber(portfolioValue + (user?.wallet?.balance || 0)) }}</div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="glass-card empty-state animate-fade-in-up delay-2" *ngIf="holdings.length === 0 && loaded">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"></path>
          </svg>
        </div>
        <h3 class="empty-title">No Holdings Yet</h3>
        <p class="empty-text">Start trading to build your portfolio. Your holdings will appear here.</p>
        <a routerLink="/trade" class="btn-primary" style="text-decoration: none; display: inline-block; margin-top: 8px;">
          Start Trading →
        </a>
      </div>

      <!-- Portfolio Content -->
      <div class="portfolio-layout" *ngIf="holdings.length > 0">
        <!-- Holdings Table -->
        <div class="glass-card table-card animate-fade-in-up delay-2">
          <div class="table-header-row">
            <h2 class="section-title">Holdings</h2>
            <span class="holding-count">{{ holdings.length }} Asset{{ holdings.length > 1 ? 's' : '' }}</span>
          </div>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="text-align: left;">Asset</th>
                  <th style="text-align: right;">Quantity</th>
                  <th style="text-align: right;">Current Price</th>
                  <th style="text-align: right;">Market Value</th>
                  <th style="text-align: right;">Allocation</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let h of holdings">
                  <td>
                    <div class="asset-name-cell">
                      <div class="asset-dot" [style.background]="getColor(h.symbol)"></div>
                      <div>
                        <div class="asset-sym">{{ h.symbol }}</div>
                        <div class="asset-nm">{{ h.name }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="font-mono" style="text-align: right;">{{ h.quantity }}</td>
                  <td class="font-mono" style="text-align: right;">\${{ formatNumber(h.currentPrice) }}</td>
                  <td class="font-mono" style="text-align: right; font-weight: 600;">\${{ formatNumber(h.currentValue) }}</td>
                  <td style="text-align: right;">
                    <div class="alloc-cell">
                      <div class="alloc-bar-bg">
                        <div class="alloc-bar" [style.width.%]="(h.currentValue / portfolioValue) * 100" [style.background]="getColor(h.symbol)"></div>
                      </div>
                      <span class="font-mono alloc-pct">{{ ((h.currentValue / portfolioValue) * 100).toFixed(1) }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Allocation Chart -->
        <div class="glass-card chart-card animate-fade-in-up delay-3">
          <h2 class="section-title">Allocation</h2>
          <div class="donut-wrapper">
            <canvas #allocChart></canvas>
          </div>
          <div class="chart-legend">
            <div *ngFor="let h of holdings" class="legend-row">
              <div class="legend-left">
                <span class="legend-color" [style.background]="getColor(h.symbol)"></span>
                <span class="legend-sym">{{ h.symbol }}</span>
              </div>
              <span class="legend-val font-mono">\${{ formatNumber(h.currentValue) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: 28px; }
    .page-title { font-size: 28px; font-weight: 800; margin: 0; color: #f1f5f9; letter-spacing: -0.5px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0 0; }

    .summary-row {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;
    }
    .summary-card { padding: 24px; }
    .summary-label {
      font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px;
    }
    .summary-value { font-size: 26px; font-weight: 700; color: #f1f5f9; }

    .portfolio-layout {
      display: grid; grid-template-columns: 1fr 340px; gap: 20px;
    }

    /* Table */
    .table-card { overflow: hidden; }
    .table-header-row {
      display: flex; justify-content: space-between; align-items: center; padding: 20px 24px;
    }
    .section-title { font-size: 16px; font-weight: 700; margin: 0; color: #e2e8f0; }
    .holding-count {
      font-size: 12px; color: #64748b; background: rgba(51,65,85,0.3); padding: 4px 10px; border-radius: 6px;
    }
    .table-scroll { overflow-x: auto; }
    .asset-name-cell { display: flex; align-items: center; gap: 12px; }
    .asset-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .asset-sym { font-weight: 700; font-size: 14px; color: #e2e8f0; }
    .asset-nm { font-size: 12px; color: #64748b; }
    .alloc-cell { display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
    .alloc-bar-bg {
      width: 60px; height: 6px; background: rgba(51,65,85,0.3); border-radius: 3px; overflow: hidden;
    }
    .alloc-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
    .alloc-pct { font-size: 12px; color: #94a3b8; font-weight: 600; min-width: 45px; text-align: right; }

    /* Chart Card */
    .chart-card { padding: 24px; }
    .donut-wrapper { height: 220px; margin: 16px 0; display: flex; align-items: center; justify-content: center; }
    .chart-legend { display: flex; flex-direction: column; gap: 10px; }
    .legend-row { display: flex; justify-content: space-between; align-items: center; }
    .legend-left { display: flex; align-items: center; gap: 8px; }
    .legend-color { width: 10px; height: 10px; border-radius: 3px; }
    .legend-sym { font-size: 13px; font-weight: 600; color: #94a3b8; }
    .legend-val { font-size: 13px; font-weight: 600; color: #e2e8f0; }

    /* Empty State */
    .empty-state {
      padding: 60px 40px; text-align: center;
    }
    .empty-icon { color: #334155; margin-bottom: 16px; }
    .empty-title { font-size: 18px; font-weight: 700; color: #e2e8f0; margin: 0 0 8px 0; }
    .empty-text { font-size: 14px; color: #64748b; margin: 0; max-width: 360px; margin: 0 auto; }

    @media (max-width: 1024px) {
      .portfolio-layout { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .summary-row { grid-template-columns: 1fr; }
    }
  `]
})
export class PortfolioComponent implements OnInit, OnDestroy {
  @ViewChild('allocChart', { static: false }) chartRef!: ElementRef;

  user: any = null;
  holdings: any[] = [];
  portfolioValue = 0;
  loaded = false;

  private chart: Chart | null = null;
  private interval: any;

  private colorMap: Record<string, string> = {
    'BTC': '#f7931a', 'ETH': '#627eea', 'AAPL': '#94a3b8', 'TSLA': '#ef4444', 'GOOGL': '#3b82f6'
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchData();
    this.interval = setInterval(() => this.fetchData(), 5000);
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
    if (this.chart) this.chart.destroy();
  }

  fetchData() {
    this.http.get('http://localhost:3000/api/user').subscribe((data: any) => {
      this.user = data;
      if (data?.id) {
        this.http.get(`http://localhost:3000/api/portfolio/${data.id}`).subscribe((h: any) => {
          this.holdings = h || [];
          this.portfolioValue = this.holdings.reduce((s, x) => s + x.currentValue, 0);
          this.loaded = true;
          this.buildChart();
        });
      }
    });
  }

  buildChart() {
    if (this.holdings.length === 0) return;

    if (this.chart) {
      this.chart.data.datasets[0].data = this.holdings.map(h => h.currentValue);
      this.chart.update();
      return;
    }

    setTimeout(() => {
      if (!this.chartRef) return;
      const ctx = this.chartRef.nativeElement.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.holdings.map(h => h.symbol),
          datasets: [{
            data: this.holdings.map(h => h.currentValue),
            backgroundColor: this.holdings.map(h => this.getColor(h.symbol)),
            borderColor: '#0f172a',
            borderWidth: 4,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(51,65,85,0.5)', borderWidth: 1,
              bodyColor: '#f1f5f9', bodyFont: { family: 'JetBrains Mono', size: 13, weight: '600' as any },
              padding: 12, cornerRadius: 10, displayColors: false,
              callbacks: { label: (c: any) => ' $' + Number(c.raw).toLocaleString('en-US', { minimumFractionDigits: 2 }) }
            }
          }
        }
      });
    }, 100);
  }

  getColor(symbol: string): string {
    return this.colorMap[symbol] || '#8b5cf6';
  }

  formatNumber(value: any): string {
    if (!value && value !== 0) return '0.00';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

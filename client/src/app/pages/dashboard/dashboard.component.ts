import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header animate-fade-in-up">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Welcome back, <span class="text-highlight">{{ user?.username || '...' }}</span></p>
        </div>
        <div class="header-live">
          <span class="live-dot"></span>
          <span class="live-label">Live Data</span>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-grid">
        <div class="glass-card stat-card stat-card-green animate-fade-in-up delay-1">
          <div class="stat-icon green-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"></path>
            </svg>
          </div>
          <div class="stat-label">Buying Power</div>
          <div class="stat-value font-mono">\${{ formatNumber(user?.wallet?.balance) }}</div>
        </div>

        <div class="glass-card stat-card stat-card-blue animate-fade-in-up delay-2">
          <div class="stat-icon blue-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class="stat-label">Portfolio Value</div>
          <div class="stat-value font-mono">\${{ formatNumber(portfolioValue) }}</div>
        </div>

        <div class="glass-card stat-card animate-fade-in-up delay-3"
             [class.stat-card-green]="totalPnL >= 0"
             [class.stat-card-red]="totalPnL < 0">
          <div class="stat-icon" [class.green-icon]="totalPnL >= 0" [class.red-icon]="totalPnL < 0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline *ngIf="totalPnL >= 0" points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline *ngIf="totalPnL >= 0" points="16 7 22 7 22 13"></polyline>
              <polyline *ngIf="totalPnL < 0" points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
              <polyline *ngIf="totalPnL < 0" points="16 17 22 17 22 11"></polyline>
            </svg>
          </div>
          <div class="stat-label">Net Worth</div>
          <div class="stat-value font-mono">\${{ formatNumber(totalPnL + (user?.wallet?.balance || 0)) }}</div>
        </div>

        <div class="glass-card stat-card stat-card-amber animate-fade-in-up delay-4">
          <div class="stat-icon amber-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          </div>
          <div class="stat-label">Active Holdings</div>
          <div class="stat-value font-mono">{{ holdings.length }}</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Main Price Chart -->
        <div class="glass-card gradient-border chart-card animate-fade-in-up delay-3">
          <div class="chart-header">
            <div>
              <h2 class="chart-title">Market Overview</h2>
              <p class="chart-subtitle">Real-time price tracking</p>
            </div>
            <div class="chart-tabs">
              <button *ngFor="let a of assets; let i = index"
                      (click)="selectChartAsset(i)"
                      [class.active]="selectedAssetIndex === i"
                      class="chart-tab">
                {{ a.symbol }}
              </button>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas #priceChart></canvas>
          </div>
          <div class="chart-footer">
            <div class="chart-stat" *ngIf="assets[selectedAssetIndex]">
              <span class="chart-stat-label">Current</span>
              <span class="chart-stat-value font-mono">\${{ formatNumber(assets[selectedAssetIndex]?.currentPrice) }}</span>
            </div>
            <div class="chart-stat" *ngIf="hasHistory(selectedAssetIndex)">
              <span class="chart-stat-label">Change</span>
              <span class="chart-stat-value font-mono"
                    [class.text-green]="getAssetChange(selectedAssetIndex) >= 0"
                    [class.text-red]="getAssetChange(selectedAssetIndex) < 0">
                {{ getAssetChange(selectedAssetIndex) >= 0 ? '+' : '' }}{{ getAssetChange(selectedAssetIndex).toFixed(2) }}%
              </span>
            </div>
            <div class="chart-stat">
              <span class="chart-stat-label">Data Points</span>
              <span class="chart-stat-value font-mono">{{ priceHistory[selectedAssetIndex]?.length || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Portfolio Donut (only if holdings exist) -->
        <div class="glass-card donut-card animate-fade-in-up delay-4" *ngIf="holdings.length > 0">
          <div class="chart-header">
            <div>
              <h2 class="chart-title">Allocation</h2>
              <p class="chart-subtitle">Portfolio breakdown</p>
            </div>
          </div>
          <div class="donut-wrapper">
            <canvas #donutChart></canvas>
          </div>
          <div class="donut-legend">
            <div *ngFor="let h of holdings" class="legend-item">
              <span class="legend-dot" [style.background]="getHoldingColor(h.symbol)"></span>
              <span class="legend-label">{{ h.symbol }}</span>
              <span class="legend-value font-mono">{{ ((h.currentValue / portfolioValue) * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Market Table -->
      <div class="glass-card table-card animate-fade-in-up delay-5">
        <div class="table-header">
          <h2 class="chart-title">Live Market</h2>
          <span class="table-count">{{ assets.length }} Assets</span>
        </div>
        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th style="text-align: left;">Asset</th>
                <th style="text-align: left;">Symbol</th>
                <th style="text-align: right;">Live Price</th>
                <th style="text-align: right;">Session Δ</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let asset of assets; let i = index">
                <td>
                  <div class="asset-name">
                    <div class="asset-avatar" [style.background]="getAssetColor(asset.symbol)">
                      {{ asset.symbol.charAt(0) }}
                    </div>
                    <span>{{ asset.name }}</span>
                  </div>
                </td>
                <td class="font-mono" style="color: #64748b; font-size: 13px;">{{ asset.symbol }}</td>
                <td class="font-mono" style="text-align: right; font-weight: 600;">
                  \${{ formatNumber(asset.currentPrice) }}
                </td>
                <td style="text-align: right;">
                  <span class="change-badge font-mono"
                        [class.change-up]="getAssetChange(i) >= 0"
                        [class.change-down]="getAssetChange(i) < 0"
                        *ngIf="hasHistory(i)">
                    {{ getAssetChange(i) >= 0 ? '▲' : '▼' }} {{ getAssetChange(i) >= 0 ? '+' : '' }}{{ getAssetChange(i).toFixed(2) }}%
                  </span>
                  <span *ngIf="!priceHistory[i] || priceHistory[i].length <= 1" class="change-badge change-neutral font-mono">—</span>
                </td>
                <td style="text-align: right;">
                  <a routerLink="/trade" class="trade-link">Trade →</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .page-title {
      font-size: 28px;
      font-weight: 800;
      margin: 0;
      color: #f1f5f9;
      letter-spacing: -0.5px;
    }
    .page-subtitle {
      font-size: 14px;
      color: #64748b;
      margin: 4px 0 0 0;
    }
    .text-highlight { color: #10b981; font-weight: 600; }
    .header-live {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.08);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 20px;
      padding: 8px 16px;
    }
    .live-label {
      font-size: 12px;
      color: #10b981;
      font-weight: 600;
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      padding: 20px;
    }
    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
    }
    .green-icon { background: rgba(16, 185, 129, 0.12); color: #10b981; }
    .blue-icon { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
    .red-icon { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
    .amber-icon { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
    .stat-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 700;
      color: #f1f5f9;
    }

    /* Charts */
    .charts-section {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 16px;
      margin-bottom: 24px;
    }
    .chart-card { padding: 24px; }
    .donut-card { padding: 24px; }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .chart-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
      color: #e2e8f0;
    }
    .chart-subtitle {
      font-size: 12px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .chart-tabs {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
    .chart-tab {
      padding: 5px 10px;
      border: 1px solid rgba(51, 65, 85, 0.4);
      border-radius: 6px;
      background: transparent;
      color: #64748b;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: 'JetBrains Mono', monospace;
    }
    .chart-tab:hover { border-color: #475569; color: #94a3b8; }
    .chart-tab.active {
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.3);
      color: #10b981;
    }
    .chart-wrapper {
      height: 280px;
      position: relative;
    }
    .chart-footer {
      display: flex;
      gap: 24px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(51, 65, 85, 0.3);
    }
    .chart-stat-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 2px;
    }
    .chart-stat-value {
      font-size: 15px;
      font-weight: 600;
      color: #e2e8f0;
    }
    .text-green { color: #10b981 !important; }
    .text-red { color: #ef4444 !important; }

    /* Donut */
    .donut-wrapper {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .donut-legend {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .legend-label {
      flex: 1;
      color: #94a3b8;
      font-weight: 500;
    }
    .legend-value {
      color: #e2e8f0;
      font-size: 12px;
      font-weight: 600;
    }

    /* Table */
    .table-card { overflow: hidden; }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
    }
    .table-count {
      font-size: 12px;
      color: #64748b;
      background: rgba(51, 65, 85, 0.3);
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 500;
    }
    .table-scroll {
      overflow-x: auto;
    }
    .asset-name {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .asset-avatar {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      color: white;
      flex-shrink: 0;
    }
    .change-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .change-up {
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
    }
    .change-down {
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
    }
    .change-neutral {
      background: rgba(51, 65, 85, 0.3);
      color: #64748b;
    }
    .trade-link {
      color: #10b981;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      transition: color 0.2s;
    }
    .trade-link:hover { color: #34d399; }

    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-section { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; gap: 12px; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('priceChart', { static: true }) chartRef!: ElementRef;
  @ViewChild('donutChart', { static: false }) donutRef!: ElementRef;

  user: any = null;
  assets: any[] = [];
  holdings: any[] = [];
  portfolioValue = 0;
  totalPnL = 0;

  chart: Chart | null = null;
  donutChart: Chart | null = null;
  selectedAssetIndex = 0;
  priceHistory: number[][] = [];
  timeLabels: string[][] = [];

  private interval: any;
  private donutBuilt = false;

  private assetColors: Record<string, string> = {
    'BTC': '#f7931a',
    'ETH': '#627eea',
    'AAPL': '#a2aaad',
    'TSLA': '#cc0000',
    'GOOGL': '#4285f4'
  };

  private chartColors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initChart();
    this.fetchData();
    this.interval = setInterval(() => this.fetchData(), 3000);
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
    if (this.chart) this.chart.destroy();
    if (this.donutChart) this.donutChart.destroy();
  }

  initChart() {
    const ctx = this.chartRef.nativeElement.getContext('2d');

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.05)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Price',
          data: [],
          borderColor: '#10b981',
          backgroundColor: gradient,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#10b981',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 300, easing: 'easeOutQuart' },
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: 'rgba(51, 65, 85, 0.15)',
              lineWidth: 1
            },
            ticks: {
              color: '#475569',
              font: { family: 'JetBrains Mono', size: 10 },
              maxTicksLimit: 8,
              maxRotation: 0
            },
            border: { display: false }
          },
          y: {
            position: 'right',
            grid: {
              color: 'rgba(51, 65, 85, 0.2)',
              lineWidth: 1
            },
            ticks: {
              color: '#64748b',
              font: { family: 'JetBrains Mono', size: 11 },
              callback: (value: any) => '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            },
            border: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(51, 65, 85, 0.5)',
            borderWidth: 1,
            titleColor: '#94a3b8',
            bodyColor: '#f1f5f9',
            titleFont: { family: 'Inter', size: 11, weight: '500' as any },
            bodyFont: { family: 'JetBrains Mono', size: 14, weight: '600' as any },
            padding: 12,
            cornerRadius: 10,
            displayColors: false,
            callbacks: {
              label: (ctx: any) => '$' + Number(ctx.raw).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }
          }
        }
      }
    });
  }

  selectChartAsset(index: number) {
    this.selectedAssetIndex = index;
    this.updateMainChart();
  }

  updateMainChart() {
    if (!this.chart) return;
    const idx = this.selectedAssetIndex;
    const prices = this.priceHistory[idx] || [];
    const labels = this.timeLabels[idx] || [];

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = prices;
    this.chart.update('none');
  }

  fetchData() {
    this.http.get('http://localhost:3000/api/user').subscribe((data: any) => {
      this.user = data;
      if (data?.id) {
        this.http.get(`http://localhost:3000/api/portfolio/${data.id}`).subscribe((holdings: any) => {
          this.holdings = holdings || [];
          this.portfolioValue = this.holdings.reduce((sum, h) => sum + h.currentValue, 0);
          this.totalPnL = this.portfolioValue;
          this.updateDonutChart();
        });
      }
    });

    this.http.get('http://localhost:3000/api/market').subscribe((data: any) => {
      this.assets = data || [];
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Initialize history arrays if needed
      while (this.priceHistory.length < this.assets.length) {
        this.priceHistory.push([]);
        this.timeLabels.push([]);
      }

      this.assets.forEach((asset, i) => {
        this.priceHistory[i].push(Number(asset.currentPrice));
        this.timeLabels[i].push(now);

        if (this.priceHistory[i].length > 30) {
          this.priceHistory[i].shift();
          this.timeLabels[i].shift();
        }
      });

      this.updateMainChart();
    });
  }

  updateDonutChart() {
    if (this.holdings.length === 0) return;

    if (this.donutChart) {
      this.donutChart.data.labels = this.holdings.map(h => h.symbol);
      this.donutChart.data.datasets[0].data = this.holdings.map(h => h.currentValue);
      this.donutChart.update();
      return;
    }

    // Wait for ViewChild to be available
    setTimeout(() => {
      if (!this.donutRef) return;
      const ctx = this.donutRef.nativeElement.getContext('2d');
      this.donutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.holdings.map(h => h.symbol),
          datasets: [{
            data: this.holdings.map(h => h.currentValue),
            backgroundColor: this.holdings.map(h => this.getHoldingColor(h.symbol)),
            borderColor: 'rgba(15, 23, 42, 0.8)',
            borderWidth: 3,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              borderColor: 'rgba(51, 65, 85, 0.5)',
              borderWidth: 1,
              titleColor: '#94a3b8',
              bodyColor: '#f1f5f9',
              bodyFont: { family: 'JetBrains Mono', size: 13, weight: '600' as any },
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (ctx: any) => ' $' + Number(ctx.raw).toLocaleString('en-US', { minimumFractionDigits: 2 })
              }
            }
          }
        }
      });
    }, 100);
  }

  hasHistory(index: number): boolean {
    return !!(this.priceHistory[index] && this.priceHistory[index].length > 1);
  }

  getAssetChange(index: number): number {
    const history = this.priceHistory[index];
    if (!history || history.length < 2) return 0;
    const first = history[0];
    const last = history[history.length - 1];
    return ((last - first) / first) * 100;
  }

  getAssetColor(symbol: string): string {
    return this.assetColors[symbol] || '#6366f1';
  }

  getHoldingColor(symbol: string): string {
    const colors: Record<string, string> = {
      'BTC': '#f7931a', 'ETH': '#627eea', 'AAPL': '#94a3b8',
      'TSLA': '#ef4444', 'GOOGL': '#3b82f6'
    };
    return colors[symbol] || '#8b5cf6';
  }

  formatNumber(value: any): string {
    if (!value && value !== 0) return '0.00';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

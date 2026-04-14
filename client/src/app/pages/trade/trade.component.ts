import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-trade',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header animate-fade-in-up">
        <div>
          <h1 class="page-title">Trade</h1>
          <p class="page-subtitle">Execute market orders in real-time</p>
        </div>
        <div class="wallet-badge" *ngIf="user?.wallet">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"></path>
          </svg>
          <span class="font-mono">\${{ formatNumber(user?.wallet?.balance) }}</span>
        </div>
      </div>

      <div class="trade-layout">
        <!-- Left: Chart + Asset Selection -->
        <div class="trade-left">
          <!-- Asset Cards -->
          <div class="asset-grid animate-fade-in-up delay-1">
            <div *ngFor="let asset of assets; let i = index"
                 class="asset-card glass-card"
                 [class.selected]="selectedAsset?.symbol === asset.symbol"
                 (click)="selectAsset(asset, i)">
              <div class="asset-card-top">
                <div class="asset-card-avatar" [style.background]="getAssetColor(asset.symbol)">
                  {{ asset.symbol.charAt(0) }}
                </div>
                <span class="asset-card-change font-mono"
                      [class.text-green]="getAssetChange(i) >= 0"
                      [class.text-red]="getAssetChange(i) < 0"
                      *ngIf="hasHistory(i)">
                  {{ getAssetChange(i) >= 0 ? '+' : '' }}{{ getAssetChange(i).toFixed(2) }}%
                </span>
              </div>
              <div class="asset-card-symbol">{{ asset.symbol }}</div>
              <div class="asset-card-name">{{ asset.name }}</div>
              <div class="asset-card-price font-mono">\${{ formatNumber(asset.currentPrice) }}</div>
            </div>
          </div>

          <!-- Chart -->
          <div class="glass-card gradient-border chart-card animate-fade-in-up delay-2">
            <div class="chart-header-row">
              <div>
                <span class="chart-asset-label">{{ selectedAsset?.name || 'Select an asset' }}</span>
                <span class="chart-asset-symbol font-mono">{{ selectedAsset?.symbol || '' }}</span>
              </div>
              <div class="chart-price font-mono" *ngIf="selectedAsset">
                \${{ formatNumber(selectedAsset.currentPrice) }}
              </div>
            </div>
            <div class="chart-wrapper">
              <canvas #tradeChart></canvas>
            </div>
          </div>
        </div>

        <!-- Right: Order Panel -->
        <div class="trade-right">
          <div class="glass-card order-panel animate-fade-in-up delay-3">
            <h3 class="order-title">Place Order</h3>

            <!-- Buy/Sell Toggle -->
            <div class="tab-toggle">
              <button [class.active-buy]="tradeType === 'BUY'"
                      (click)="tradeType = 'BUY'">Buy</button>
              <button [class.active-sell]="tradeType === 'SELL'"
                      (click)="tradeType = 'SELL'">Sell</button>
            </div>

            <!-- Asset Display -->
            <div class="order-field" style="margin-top: 20px;">
              <label class="field-label">Asset</label>
              <div class="selected-asset-display" *ngIf="selectedAsset">
                <div class="asset-card-avatar small" [style.background]="getAssetColor(selectedAsset.symbol)">
                  {{ selectedAsset.symbol.charAt(0) }}
                </div>
                <span>{{ selectedAsset.symbol }} — {{ selectedAsset.name }}</span>
              </div>
              <div class="selected-asset-display placeholder" *ngIf="!selectedAsset">
                <span style="color: #64748b;">← Select an asset from the left</span>
              </div>
            </div>

            <!-- Quantity -->
            <div class="order-field">
              <label class="field-label">Quantity</label>
              <input type="number" class="input-field" placeholder="0.00"
                     [(ngModel)]="quantity" min="0" step="0.01">
            </div>

            <!-- Cost Summary -->
            <div class="cost-summary" *ngIf="selectedAsset && quantity > 0">
              <div class="cost-row">
                <span class="cost-label">Price per unit</span>
                <span class="cost-value font-mono">\${{ formatNumber(selectedAsset.currentPrice) }}</span>
              </div>
              <div class="cost-row">
                <span class="cost-label">Quantity</span>
                <span class="cost-value font-mono">{{ quantity }}</span>
              </div>
              <div class="cost-divider"></div>
              <div class="cost-row total">
                <span class="cost-label">Estimated Total</span>
                <span class="cost-value font-mono"
                      [class.text-green]="tradeType === 'SELL'"
                      [class.text-red]="tradeType === 'BUY'">
                  {{ tradeType === 'BUY' ? '-' : '+' }}\${{ formatNumber(quantity * selectedAsset.currentPrice) }}
                </span>
              </div>
              <div class="cost-row" *ngIf="tradeType === 'BUY'">
                <span class="cost-label">Balance After</span>
                <span class="cost-value font-mono"
                      [class.text-red]="(user?.wallet?.balance || 0) - (quantity * selectedAsset.currentPrice) < 0">
                  \${{ formatNumber((user?.wallet?.balance || 0) - (quantity * selectedAsset.currentPrice)) }}
                </span>
              </div>
            </div>

            <!-- Execute Button -->
            <button [class]="tradeType === 'BUY' ? 'btn-primary execute-btn' : 'btn-danger execute-btn'"
                    (click)="executeTrade()"
                    [disabled]="!canTrade()">
              {{ tradeType === 'BUY' ? '🟢' : '🔴' }}
              {{ tradeType }} {{ selectedAsset?.symbol || '' }}
            </button>

            <!-- Error/Success Messages -->
            <div class="message error" *ngIf="errorMsg">{{ errorMsg }}</div>
            <div class="message success" *ngIf="successMsg">{{ successMsg }}</div>
          </div>

          <!-- Recent Trades -->
          <div class="glass-card recent-trades animate-fade-in-up delay-4" *ngIf="recentTrades.length > 0">
            <h3 class="order-title">Recent Trades</h3>
            <div *ngFor="let t of recentTrades.slice(0, 5)" class="recent-trade-item">
              <div class="trade-item-left">
                <span [class]="t.type === 'BUY' ? 'badge-buy' : 'badge-sell'">{{ t.type }}</span>
                <span class="trade-item-symbol font-mono">{{ t.symbol }}</span>
              </div>
              <div class="trade-item-right">
                <span class="trade-item-amount font-mono">\${{ formatNumber(t.total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showConfirm" (click)="showConfirm = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3 class="modal-title">Confirm {{ tradeType }}</h3>
        <div class="modal-body">
          <div class="modal-row">
            <span>Asset</span>
            <span class="font-mono">{{ selectedAsset?.symbol }} — {{ selectedAsset?.name }}</span>
          </div>
          <div class="modal-row">
            <span>Type</span>
            <span [class]="tradeType === 'BUY' ? 'badge-buy' : 'badge-sell'">{{ tradeType }}</span>
          </div>
          <div class="modal-row">
            <span>Quantity</span>
            <span class="font-mono">{{ quantity }}</span>
          </div>
          <div class="modal-row">
            <span>Price</span>
            <span class="font-mono">\${{ formatNumber(selectedAsset?.currentPrice) }}</span>
          </div>
          <div class="modal-divider"></div>
          <div class="modal-row total">
            <span>Total</span>
            <span class="font-mono">\${{ formatNumber(quantity * (selectedAsset?.currentPrice || 0)) }}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-ghost" (click)="showConfirm = false">Cancel</button>
          <button [class]="tradeType === 'BUY' ? 'btn-primary' : 'btn-danger'" (click)="confirmTrade()">
            Confirm {{ tradeType }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;
    }
    .page-title { font-size: 28px; font-weight: 800; margin: 0; color: #f1f5f9; letter-spacing: -0.5px; }
    .page-subtitle { font-size: 14px; color: #64748b; margin: 4px 0 0 0; }
    .wallet-badge {
      display: flex; align-items: center; gap: 8px;
      background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 12px; padding: 10px 18px; color: #10b981; font-weight: 600; font-size: 15px;
    }

    .trade-layout {
      display: grid; grid-template-columns: 1fr 380px; gap: 24px;
    }

    /* Asset Cards */
    .asset-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;
      margin-bottom: 20px;
    }
    .asset-card {
      padding: 16px; cursor: pointer; transition: all 0.2s ease;
      border: 1px solid rgba(51, 65, 85, 0.3);
    }
    .asset-card:hover { border-color: rgba(51, 65, 85, 0.6); }
    .asset-card.selected {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(16, 185, 129, 0.05);
      box-shadow: 0 0 20px rgba(16, 185, 129, 0.08);
    }
    .asset-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .asset-card-avatar {
      width: 30px; height: 30px; border-radius: 8px; display: flex;
      align-items: center; justify-content: center; font-weight: 700;
      font-size: 12px; color: white;
    }
    .asset-card-avatar.small { width: 24px; height: 24px; font-size: 10px; border-radius: 6px; }
    .asset-card-change { font-size: 11px; font-weight: 600; }
    .asset-card-symbol { font-size: 14px; font-weight: 700; color: #e2e8f0; }
    .asset-card-name { font-size: 11px; color: #64748b; margin: 2px 0 6px 0; }
    .asset-card-price { font-size: 15px; font-weight: 600; color: #f1f5f9; }
    .text-green { color: #10b981 !important; }
    .text-red { color: #ef4444 !important; }

    /* Chart */
    .chart-card { padding: 24px; }
    .chart-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .chart-asset-label { font-size: 16px; font-weight: 700; color: #e2e8f0; }
    .chart-asset-symbol { font-size: 12px; color: #64748b; margin-left: 8px; }
    .chart-price { font-size: 22px; font-weight: 700; color: #f1f5f9; }
    .chart-wrapper { height: 240px; }

    /* Order Panel */
    .order-panel { padding: 24px; }
    .order-title { font-size: 16px; font-weight: 700; margin: 0 0 16px 0; color: #e2e8f0; }
    .order-field { margin-bottom: 16px; }
    .field-label {
      display: block; font-size: 11px; color: #64748b; text-transform: uppercase;
      font-weight: 700; letter-spacing: 1px; margin-bottom: 6px;
    }
    .selected-asset-display {
      display: flex; align-items: center; gap: 10px; padding: 10px 14px;
      background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(51, 65, 85, 0.4);
      border-radius: 10px; font-size: 14px; font-weight: 500; color: #e2e8f0;
    }
    .selected-asset-display.placeholder { border-style: dashed; }

    /* Cost Summary */
    .cost-summary {
      background: rgba(2, 6, 23, 0.5); border: 1px solid rgba(51, 65, 85, 0.3);
      border-radius: 12px; padding: 16px; margin-bottom: 20px;
    }
    .cost-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
    .cost-label { font-size: 13px; color: #94a3b8; }
    .cost-value { font-size: 13px; color: #e2e8f0; font-weight: 600; }
    .cost-divider { height: 1px; background: rgba(51, 65, 85, 0.4); margin: 8px 0; }
    .cost-row.total .cost-label { font-weight: 700; color: #e2e8f0; }
    .cost-row.total .cost-value { font-size: 16px; }

    /* Execute Button */
    .execute-btn {
      width: 100%; padding: 14px; font-size: 14px; margin-top: 8px;
    }
    .execute-btn:disabled {
      opacity: 0.4; pointer-events: none;
    }

    /* Messages */
    .message {
      padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; margin-top: 12px;
      animation: fadeInUp 0.3s ease;
    }
    .message.error { background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
    .message.success { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }

    /* Recent Trades */
    .recent-trades { padding: 20px; margin-top: 16px; }
    .recent-trade-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid rgba(51, 65, 85, 0.2);
    }
    .recent-trade-item:last-child { border-bottom: none; }
    .trade-item-left { display: flex; align-items: center; gap: 10px; }
    .trade-item-symbol { font-size: 13px; color: #94a3b8; }
    .trade-item-amount { font-size: 13px; font-weight: 600; color: #e2e8f0; }

    /* Modal */
    .modal-title { font-size: 18px; font-weight: 700; margin: 0 0 20px 0; color: #f1f5f9; }
    .modal-body { margin-bottom: 24px; }
    .modal-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; font-size: 14px; color: #94a3b8;
    }
    .modal-row span:last-child { color: #e2e8f0; }
    .modal-divider { height: 1px; background: rgba(51, 65, 85, 0.4); margin: 8px 0; }
    .modal-row.total { font-size: 16px; font-weight: 700; color: #f1f5f9; }
    .modal-row.total span { color: #f1f5f9; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }

    @media (max-width: 1024px) {
      .trade-layout { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .asset-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class TradeComponent implements OnInit, OnDestroy {
  @ViewChild('tradeChart', { static: true }) chartRef!: ElementRef;

  user: any = null;
  assets: any[] = [];
  selectedAsset: any = null;
  selectedAssetIndex = 0;
  tradeType: 'BUY' | 'SELL' = 'BUY';
  quantity = 0;
  showConfirm = false;
  errorMsg = '';
  successMsg = '';
  recentTrades: any[] = [];

  chart: Chart | null = null;
  priceHistory: number[][] = [];
  timeLabels: string[][] = [];

  private interval: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.initChart();
    this.fetchData();
    this.interval = setInterval(() => this.fetchData(), 3000);
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
    if (this.chart) this.chart.destroy();
  }

  initChart() {
    const ctx = this.chartRef.nativeElement.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

    this.chart = new Chart(ctx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Price', data: [], borderColor: '#10b981', backgroundColor: gradient, borderWidth: 2, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#10b981', fill: true, tension: 0.4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 300 },
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: { display: false },
          y: { position: 'right', grid: { color: 'rgba(51,65,85,0.15)' }, ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 }, callback: (v: any) => '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }, border: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(51,65,85,0.5)', borderWidth: 1,
            bodyColor: '#f1f5f9', bodyFont: { family: 'JetBrains Mono', size: 13, weight: '600' as any },
            padding: 10, cornerRadius: 8, displayColors: false,
            callbacks: { label: (c: any) => '$' + Number(c.raw).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
          }
        }
      }
    });
  }

  selectAsset(asset: any, index: number) {
    this.selectedAsset = asset;
    this.selectedAssetIndex = index;
    this.updateChart();
    this.errorMsg = '';
    this.successMsg = '';
  }

  updateChart() {
    if (!this.chart) return;
    const i = this.selectedAssetIndex;
    this.chart.data.labels = this.timeLabels[i] || [];
    this.chart.data.datasets[0].data = this.priceHistory[i] || [];
    this.chart.update('none');
  }

  fetchData() {
    this.http.get('http://localhost:3000/api/user').subscribe((data: any) => {
      this.user = data;
      if (data?.id) {
        this.http.get(`http://localhost:3000/api/transactions/${data.id}`).subscribe((t: any) => {
          this.recentTrades = t || [];
        });
      }
    });

    this.http.get('http://localhost:3000/api/market').subscribe((data: any) => {
      this.assets = data || [];
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

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

      // Update selected asset reference
      if (this.selectedAsset) {
        const updated = this.assets.find(a => a.symbol === this.selectedAsset.symbol);
        if (updated) this.selectedAsset = updated;
      } else if (this.assets.length > 0) {
        this.selectedAsset = this.assets[0];
        this.selectedAssetIndex = 0;
      }

      this.updateChart();
    });
  }

  canTrade(): boolean {
    return !!this.selectedAsset && this.quantity > 0;
  }

  executeTrade() {
    if (!this.canTrade()) return;
    this.showConfirm = true;
    this.errorMsg = '';
    this.successMsg = '';
  }

  confirmTrade() {
    this.showConfirm = false;
    this.http.post('http://localhost:3000/api/trade', {
      symbol: this.selectedAsset.symbol,
      type: this.tradeType,
      quantity: this.quantity
    }).subscribe({
      next: () => {
        this.successMsg = `✅ ${this.tradeType} ${this.quantity} ${this.selectedAsset.symbol} executed successfully!`;
        this.quantity = 0;
        this.fetchData();
        setTimeout(() => this.successMsg = '', 5000);
      },
      error: (err: any) => {
        this.errorMsg = '❌ ' + (err.error?.error || 'Trade failed');
        setTimeout(() => this.errorMsg = '', 5000);
      }
    });
  }

  hasHistory(index: number): boolean {
    return !!(this.priceHistory[index] && this.priceHistory[index].length > 1);
  }

  getAssetChange(index: number): number {
    const h = this.priceHistory[index];
    if (!h || h.length < 2) return 0;
    return ((h[h.length - 1] - h[0]) / h[0]) * 100;
  }

  getAssetColor(symbol: string): string {
    const colors: Record<string, string> = {
      'BTC': '#f7931a', 'ETH': '#627eea', 'AAPL': '#94a3b8', 'TSLA': '#ef4444', 'GOOGL': '#3b82f6'
    };
    return colors[symbol] || '#8b5cf6';
  }

  formatNumber(value: any): string {
    if (!value && value !== 0) return '0.00';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

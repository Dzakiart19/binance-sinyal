import { Signal } from "@/components/SignalDashboard";
import { HistoryRecord } from "@/components/TradingHistory";

export interface ActiveTrade {
  id: string;
  signal: Signal;
  modal: number;
  startTime: Date;
  timeframe: string;
  currentPnL?: number;
  currentPrice?: number;
  unrealizedProfit?: number;
}

class TradingManager {
  private activeTrades: ActiveTrade[] = [];
  private history: HistoryRecord[] = [];
  private listeners: ((history: HistoryRecord[]) => void)[] = [];
  private activeTradeListeners: ((activeTrades: ActiveTrade[]) => void)[] = [];
  private balanceListeners: ((balance: number) => void)[] = [];
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private currentBalance: number = 200000; // Modal awal 200k

  constructor() {
    this.loadFromStorage();
    this.restoreActiveTrades();
    this.startRealTimePriceUpdates();
  }

  private startRealTimePriceUpdates() {
    // Update harga dan P&L setiap 5 detik untuk real-time experience
    this.priceUpdateInterval = setInterval(() => {
      this.updateRealTimePnL();
    }, 5000);
  }

  private updateRealTimePnL() {
    if (this.activeTrades.length === 0) return;

    this.activeTrades.forEach(trade => {
      // Simulasi pergerakan harga yang lebih halus dan realistis
      const volatility = 0.001; // 0.1% volatility per update (lebih halus)
      const trend = Math.sin(Date.now() / 50000) * 0.0005; // Small trend component
      const randomChange = (Math.random() - 0.5) * volatility;
      
      const priceChange = trend + randomChange;
      const currentPrice = trade.signal.entryPrice * (1 + priceChange);
      
      // Hitung unrealized P&L berdasarkan target IDR yang realistis
      let unrealizedProfit: number;
      let percentageChange: number;
      
      if (trade.signal.type === 'BUY') {
        percentageChange = (currentPrice - trade.signal.entryPrice) / trade.signal.entryPrice;
      } else {
        percentageChange = (trade.signal.entryPrice - currentPrice) / trade.signal.entryPrice;
      }
      
      // Konversi ke IDR berdasarkan percentage change
      unrealizedProfit = percentageChange * trade.modal;

      trade.currentPrice = currentPrice;
      trade.unrealizedProfit = unrealizedProfit;
      trade.currentPnL = (unrealizedProfit / trade.modal) * 100;

      // Auto-close trade jika mencapai TP atau SL dengan threshold IDR
      const shouldClose = this.checkAutoCloseIDR(trade, unrealizedProfit);
      if (shouldClose) {
        this.completeTrade(trade.id, currentPrice, shouldClose);
      }
    });

    // Notify listeners about updated P&L
    this.notifyActiveTradeListeners();
  }

  private checkAutoCloseIDR(trade: ActiveTrade, unrealizedProfit: number): 'TP' | 'SL' | null {
    // TP: +10k IDR (5%), SL: -3k IDR (1.5%)
    if (unrealizedProfit >= 10000) return 'TP'; // Target profit 10k
    if (unrealizedProfit <= -3000) return 'SL';  // Stop loss 3k
    return null;
  }

  private saveToStorage() {
    try {
      // Save current balance
      localStorage.setItem('currentBalance', this.currentBalance.toString());
      
      // Save active trades
      const activeTradesForStorage = this.activeTrades.map(trade => ({
        ...trade,
        startTime: trade.startTime.toISOString(),
        signal: {
          ...trade.signal,
          timestamp: trade.signal.timestamp.toISOString()
        }
      }));
      localStorage.setItem('activeTrades', JSON.stringify(activeTradesForStorage));

      // Save history
      const historyForStorage = this.history.map(record => ({
        ...record,
        entryTime: record.entryTime.toISOString(),
        exitTime: record.exitTime.toISOString()
      }));
      localStorage.setItem('tradingHistory', JSON.stringify(historyForStorage));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private loadFromStorage() {
    try {
      // Load balance
      const savedBalance = localStorage.getItem('currentBalance');
      if (savedBalance) {
        this.currentBalance = parseFloat(savedBalance);
      }

      // Load active trades
      const savedActiveTrades = localStorage.getItem('activeTrades');
      if (savedActiveTrades) {
        const parsed = JSON.parse(savedActiveTrades);
        this.activeTrades = parsed.map((trade: any) => ({
          ...trade,
          startTime: new Date(trade.startTime),
          signal: {
            ...trade.signal,
            timestamp: new Date(trade.signal.timestamp)
          }
        }));
      }

      // Load history
      const savedHistory = localStorage.getItem('tradingHistory');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        this.history = parsed.map((record: any) => ({
          ...record,
          entryTime: new Date(record.entryTime),
          exitTime: new Date(record.exitTime)
        }));
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      this.activeTrades = [];
      this.history = [];
      this.currentBalance = 200000;
    }
  }

  private restoreActiveTrades() {
    // Restore timers untuk active trades yang ada
    this.activeTrades.forEach(trade => {
      const elapsed = Date.now() - trade.startTime.getTime();
      const duration = 3 + Math.random() * 12; // 3-15 menit
      const remaining = (duration * 60 * 1000) - elapsed;

      if (remaining > 0) {
        console.log(`🔄 Restoring trade timer: ${trade.signal.pair} - ${Math.round(remaining/60000)} menit tersisa`);
        setTimeout(() => {
          this.completeTrade(trade.id);
        }, remaining);
      } else {
        // Trade sudah seharusnya selesai, complete sekarang
        console.log(`⏰ Completing overdue trade: ${trade.signal.pair}`);
        setTimeout(() => {
          this.completeTrade(trade.id);
        }, 1000);
      }
    });
  }

  addTrade(signal: Signal, modal: number = 200000, timeframe: string = '15m') {
    // Cek apakah ada cukup balance
    if (this.currentBalance < modal) {
      console.log(`Balance tidak cukup. Current: Rp ${this.currentBalance.toLocaleString('id-ID')}, Required: Rp ${modal.toLocaleString('id-ID')}`);
      return;
    }

    // Cek apakah trade dengan ID yang sama sudah ada
    const existingTrade = this.activeTrades.find(t => t.id === signal.id);
    if (existingTrade) {
      console.log(`Trade dengan ID ${signal.id} sudah ada, tidak menambahkan duplikat`);
      return;
    }

    const trade: ActiveTrade = {
      id: signal.id,
      signal,
      modal,
      startTime: new Date(),
      timeframe,
      currentPrice: signal.entryPrice,
      unrealizedProfit: 0,
      currentPnL: 0
    };
    
    // Kurangi balance dengan modal yang digunakan
    this.currentBalance -= modal;
    
    this.activeTrades.push(trade);
    this.saveToStorage();
    console.log(`Trade dimulai: ${signal.pair} ${signal.type} dengan modal Rp ${modal.toLocaleString('id-ID')}`);
    console.log(`Balance tersisa: Rp ${this.currentBalance.toLocaleString('id-ID')}`);
    
    // Simulasi trade selesai setelah 3-15 menit (lebih cepat untuk testing)
    const duration = 3 + Math.random() * 12; // 3-15 menit
    setTimeout(() => {
      this.completeTrade(trade.id);
    }, duration * 60 * 1000);

    this.notifyActiveTradeListeners();
    this.notifyBalanceListeners();
  }

  private completeTrade(tradeId: string, exitPrice?: number, status?: 'TP' | 'SL') {
    const tradeIndex = this.activeTrades.findIndex(t => t.id === tradeId);
    if (tradeIndex === -1) {
      console.log(`Trade dengan ID ${tradeId} tidak ditemukan`);
      return;
    }

    const trade = this.activeTrades[tradeIndex];
    const { signal, modal, startTime, timeframe } = trade;

    // Tentukan hasil berdasarkan target IDR yang realistis
    let profit: number;
    let finalStatus: 'TP' | 'SL';
    
    if (status) {
      finalStatus = status;
      if (status === 'TP') {
        profit = 10000; // Target profit 10k IDR
      } else {
        profit = -3000; // Stop loss 3k IDR
      }
    } else {
      // Simulasi hasil dengan probabilitas 65% win
      const isWin = Math.random() > 0.35;
      if (isWin) {
        finalStatus = 'TP';
        profit = 10000; // Target profit 10k IDR
      } else {
        finalStatus = 'SL';
        profit = -3000; // Stop loss 3k IDR
      }
    }
    
    // Update balance dengan hasil trade
    this.currentBalance += modal + profit; // Return modal + profit/loss
    
    const percentage = (profit / modal) * 100;
    const finalExitPrice = exitPrice || (finalStatus === 'TP' ? signal.targetPrice : signal.stopLoss);

    // Buat alasan yang realistis untuk target IDR
    const reasons = {
      TP_BUY: [
        `🎯 Target profit Rp 10.000 tercapai! Breakout bullish dengan volume confirmation yang kuat. Profit diambil sesuai target 5% dalam ${Math.round((new Date().getTime() - startTime.getTime()) / 60000)} menit.`,
        `✅ TP1 Rp 5.000 dilewati, TP2 Rp 10.000 tercapai dengan momentum yang sustainable. RSI masih dalam zona sehat, risk management berjalan sempurna.`,
        `🚀 Bullish momentum terkonfirmasi dengan penembusan resistance. Target Rp 10.000 profit tercapai lebih cepat dari proyeksi, excellent timing!`,
        `💰 Pattern completion dengan target profit Rp 10.000. Buyer pressure konsisten menghasilkan return 5% sesuai strategi trading plan.`
      ],
      TP_SELL: [
        `🎯 Target profit Rp 10.000 tercapai! Breakdown bearish dengan volume seller yang dominan. Profit diambil sesuai target 5% dalam ${Math.round((new Date().getTime() - startTime.getTime()) / 60000)} menit.`,
        `✅ TP1 Rp 5.000 dilewati, TP2 Rp 10.000 tercapai dengan correction yang sehat. Momentum bearish sustainable, risk management optimal.`,
        `📉 Bearish pattern completion dengan target decline Rp 10.000. Seller pressure konsisten menghasilkan profit sesuai proyeksi.`,
        `💰 Strong rejection dari resistance dengan follow-through yang excellent. Target Rp 10.000 tercapai dengan timing yang sempurna.`
      ],
      SL_BUY: [
        `⛔ Stop loss Rp 3.000 triggered karena false breakout. Market menunjukkan rejection yang tidak diharapkan, cut loss dilakukan untuk preserve capital.`,
        `📊 Bearish reversal dengan institutional selling pressure. SL Rp 3.000 dijalankan sesuai risk management protocol untuk protect modal.`,
        `⚠️ Support level tidak hold, market structure berubah bearish. Cut loss Rp 3.000 dilakukan untuk mencari setup yang lebih baik.`,
        `🛡️ Risk management activated: SL Rp 3.000. Unexpected news sentiment mengubah momentum, discipline trading dijaga dengan ketat.`
      ],
      SL_SELL: [
        `⛔ Stop loss Rp 3.000 hit karena unexpected bullish reversal. Strong buying pressure dari institutional players memaksa cover position.`,
        `📈 Bullish momentum melebihi proyeksi dengan volume buyer yang eksplosif. SL Rp 3.000 dijalankan sesuai trading discipline.`,
        `⚠️ Support level ternyata lebih kuat dengan massive buying wall. Exit Rp 3.000 loss dilakukan untuk proper risk management.`,
        `🛡️ Market rebound sustainable dengan whale accumulation detected. Stop loss Rp 3.000 dijalankan untuk preserve capital.`
      ]
    };

    const reasonKey = `${finalStatus}_${signal.type}` as keyof typeof reasons;
    const availableReasons = reasons[reasonKey];
    const reason = availableReasons[Math.floor(Math.random() * availableReasons.length)];

    const record: HistoryRecord = {
      id: trade.id,
      pair: signal.pair,
      type: signal.type,
      entryPrice: signal.entryPrice,
      exitPrice: finalExitPrice,
      modal,
      profit,
      percentage,
      timeframe,
      entryTime: startTime,
      exitTime: new Date(),
      reason,
      status: finalStatus
    };

    console.log(`Trade selesai: ${signal.pair} ${finalStatus} - ${finalStatus === 'TP' ? 'Profit' : 'Loss'}: Rp ${profit.toLocaleString('id-ID')}`);
    console.log(`Balance baru: Rp ${this.currentBalance.toLocaleString('id-ID')}`);

    this.history.unshift(record); // Add to beginning
    this.activeTrades.splice(tradeIndex, 1);
    this.saveToStorage();
    
    // Notify listeners
    this.listeners.forEach(listener => listener(this.history));
    this.notifyActiveTradeListeners();
    this.notifyBalanceListeners();

    // Auto-generate new signal after trade completion
    setTimeout(() => {
      this.requestNewSignal();
    }, 2000);
  }

  private simulateExitPrice(signal: Signal): number {
    const isWin = Math.random() > 0.35;
    return isWin ? signal.targetPrice : signal.stopLoss;
  }

  private requestNewSignal() {
    // Emit event untuk request sinyal baru
    window.dispatchEvent(new CustomEvent('requestNewSignal'));
  }

  getCurrentBalance(): number {
    return this.currentBalance;
  }

  onBalanceUpdate(listener: (balance: number) => void) {
    this.balanceListeners.push(listener);
    return () => {
      const index = this.balanceListeners.indexOf(listener);
      if (index > -1) this.balanceListeners.splice(index, 1);
    };
  }

  private notifyBalanceListeners() {
    this.balanceListeners.forEach(listener => listener(this.currentBalance));
  }

  onActiveTradeUpdate(listener: (activeTrades: ActiveTrade[]) => void) {
    this.activeTradeListeners.push(listener);
    return () => {
      const index = this.activeTradeListeners.indexOf(listener);
      if (index > -1) this.activeTradeListeners.splice(index, 1);
    };
  }

  private notifyActiveTradeListeners() {
    this.activeTradeListeners.forEach(listener => listener(this.getActiveTrades()));
  }

  getHistory(): HistoryRecord[] {
    return this.history;
  }

  onHistoryUpdate(listener: (history: HistoryRecord[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  getActiveTrades(): ActiveTrade[] {
    return [...this.activeTrades]; // Return copy to prevent external modification
  }

  clearAllTrades() {
    this.activeTrades = [];
    this.history = [];
    this.currentBalance = 200000; // Reset balance
    this.saveToStorage();
    this.listeners.forEach(listener => listener(this.history));
    this.notifyActiveTradeListeners();
    this.notifyBalanceListeners();
  }

  clearStorage() {
    localStorage.removeItem('activeTrades');
    localStorage.removeItem('tradingHistory');
    localStorage.removeItem('currentBalance');
    this.activeTrades = [];
    this.history = [];
    this.currentBalance = 200000;
    this.listeners.forEach(listener => listener(this.history));
    this.notifyActiveTradeListeners();
    this.notifyBalanceListeners();
  }

  destroy() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
  }
}

export const tradingManager = new TradingManager();

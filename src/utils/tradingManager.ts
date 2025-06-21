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
    // Update harga dan P&L setiap 3 detik untuk real-time experience
    this.priceUpdateInterval = setInterval(() => {
      this.updateRealTimePnL();
    }, 3000);
  }

  private updateRealTimePnL() {
    if (this.activeTrades.length === 0) return;

    this.activeTrades.forEach(trade => {
      // Simulasi pergerakan harga yang SANGAT HALUS untuk modal kecil
      const volatility = 0.0002; // 0.02% volatility per update (sangat halus)
      const trend = Math.sin(Date.now() / 100000) * 0.0001; // Very small trend
      const randomChange = (Math.random() - 0.5) * volatility;
      
      const priceChange = trend + randomChange;
      const currentPrice = trade.signal.entryPrice * (1 + priceChange);
      
      // Hitung unrealized P&L berdasarkan target IDR yang SANGAT REALISTIS
      let unrealizedProfit: number;
      let percentageChange: number;
      
      if (trade.signal.type === 'BUY') {
        percentageChange = (currentPrice - trade.signal.entryPrice) / trade.signal.entryPrice;
      } else {
        percentageChange = (trade.signal.entryPrice - currentPrice) / trade.signal.entryPrice;
      }
      
      // Konversi ke IDR dengan skala yang REALISTIS untuk modal 200k
      // Maksimal pergerakan 0.5% = 1000 IDR, sehingga pergerakan gradual
      const maxMoveIDR = 1000; // Maksimal 1000 IDR per update
      unrealizedProfit = Math.max(Math.min(percentageChange * trade.modal, maxMoveIDR), -maxMoveIDR);

      trade.currentPrice = currentPrice;
      trade.unrealizedProfit = unrealizedProfit;
      trade.currentPnL = (unrealizedProfit / trade.modal) * 100;

      // Auto-close trade jika mencapai TP atau SL yang REALISTIS
      const shouldClose = this.checkAutoCloseIDR(trade, unrealizedProfit);
      if (shouldClose) {
        this.completeTrade(trade.id, currentPrice, shouldClose);
      }
    });

    // Notify listeners about updated P&L
    this.notifyActiveTradeListeners();
  }

  private checkAutoCloseIDR(trade: ActiveTrade, unrealizedProfit: number): 'TP' | 'SL' | null {
    // Target REALISTIS: TP +5k IDR (2.5%), SL -3k IDR (1.5%)
    if (unrealizedProfit >= 5000) return 'TP'; // TP1: 5k IDR
    if (unrealizedProfit <= -3000) return 'SL'; // SL: 3k IDR
    return null;
  }

  private saveToStorage() {
    try {
      // Save dengan key yang lebih spesifik
      const timestamp = new Date().toISOString();
      
      // Save current balance
      localStorage.setItem('tradingBalance', this.currentBalance.toString());
      localStorage.setItem('lastSaveTime', timestamp);
      
      // Save active trades dengan format yang benar
      const activeTradesForStorage = this.activeTrades.map(trade => ({
        ...trade,
        startTime: trade.startTime.toISOString(),
        signal: {
          ...trade.signal,
          timestamp: trade.signal.timestamp.toISOString()
        }
      }));
      localStorage.setItem('activeTradesData', JSON.stringify(activeTradesForStorage));

      // Save history dengan format yang benar
      const historyForStorage = this.history.map(record => ({
        ...record,
        entryTime: record.entryTime.toISOString(),
        exitTime: record.exitTime.toISOString()
      }));
      localStorage.setItem('tradingHistoryData', JSON.stringify(historyForStorage));
      
      console.log(`💾 Data saved - Balance: ${this.currentBalance}, Active: ${this.activeTrades.length}, History: ${this.history.length}`);
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
    }
  }

  private loadFromStorage() {
    try {
      // Load balance
      const savedBalance = localStorage.getItem('tradingBalance');
      if (savedBalance) {
        this.currentBalance = parseFloat(savedBalance);
      }

      // Load active trades dengan validasi
      const savedActiveTrades = localStorage.getItem('activeTradesData');
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

      // Load history dengan validasi
      const savedHistory = localStorage.getItem('tradingHistoryData');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        this.history = parsed.map((record: any) => ({
          ...record,
          entryTime: new Date(record.entryTime),
          exitTime: new Date(record.exitTime)
        }));
      }
      
      console.log(`📥 Data loaded - Balance: ${this.currentBalance}, Active: ${this.activeTrades.length}, History: ${this.history.length}`);
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error);
      this.activeTrades = [];
      this.history = [];
      this.currentBalance = 200000;
    }
  }

  private restoreActiveTrades() {
    // Restore timers untuk active trades yang ada
    this.activeTrades.forEach(trade => {
      const elapsed = Date.now() - trade.startTime.getTime();
      const duration = 2 + Math.random() * 8; // 2-10 menit untuk testing
      const remaining = (duration * 60 * 1000) - elapsed;

      if (remaining > 0) {
        console.log(`🔄 Restoring trade: ${trade.signal.pair} - ${Math.round(remaining/60000)} min remaining`);
        setTimeout(() => {
          this.completeTrade(trade.id);
        }, remaining);
      } else {
        // Trade sudah seharusnya selesai
        console.log(`⏰ Completing overdue trade: ${trade.signal.pair}`);
        setTimeout(() => {
          this.completeTrade(trade.id);
        }, 1000);
      }
    });
  }

  addTrade(signal: Signal, modal: number = 200000, timeframe: string = '15m') {
    // Cek balance yang cukup
    if (this.currentBalance < modal) {
      console.log(`❌ Balance tidak cukup. Current: Rp ${this.currentBalance.toLocaleString('id-ID')}, Required: Rp ${modal.toLocaleString('id-ID')}`);
      return;
    }

    // Cek duplikasi trade
    const existingTrade = this.activeTrades.find(t => t.id === signal.id);
    if (existingTrade) {
      console.log(`⚠️ Trade ${signal.id} sudah ada`);
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
    
    // Kurangi balance
    this.currentBalance -= modal;
    
    this.activeTrades.push(trade);
    this.saveToStorage(); // Save immediately
    
    console.log(`🚀 Trade started: ${signal.pair} ${signal.type} - Modal: Rp ${modal.toLocaleString('id-ID')}`);
    console.log(`💰 Balance: Rp ${this.currentBalance.toLocaleString('id-ID')}`);
    
    // Trade duration 2-10 menit untuk testing cepat
    const duration = 2 + Math.random() * 8;
    setTimeout(() => {
      this.completeTrade(trade.id);
    }, duration * 60 * 1000);

    this.notifyActiveTradeListeners();
    this.notifyBalanceListeners();
  }

  private completeTrade(tradeId: string, exitPrice?: number, status?: 'TP' | 'SL') {
    const tradeIndex = this.activeTrades.findIndex(t => t.id === tradeId);
    if (tradeIndex === -1) {
      console.log(`❌ Trade ${tradeId} not found`);
      return;
    }

    const trade = this.activeTrades[tradeIndex];
    const { signal, modal, startTime, timeframe } = trade;

    // Tentukan hasil dengan target IDR REALISTIS
    let profit: number;
    let finalStatus: 'TP' | 'SL';
    
    if (status) {
      finalStatus = status;
      if (status === 'TP') {
        profit = 5000; // TP1: 5k IDR (realistis)
      } else {
        profit = -3000; // SL: 3k IDR
      }
    } else {
      // 70% win rate dengan profit yang REALISTIS
      const isWin = Math.random() > 0.3;
      if (isWin) {
        finalStatus = 'TP';
        profit = 5000; // 5k IDR profit
      } else {
        finalStatus = 'SL';
        profit = -3000; // 3k IDR loss
      }
    }
    
    // Update balance dengan hasil trade
    this.currentBalance += modal + profit;
    
    const percentage = (profit / modal) * 100;
    const finalExitPrice = exitPrice || (finalStatus === 'TP' ? signal.targetPrice : signal.stopLoss);

    // Reason yang realistis untuk modal kecil
    const reasons = {
      TP_BUY: [
        `🎯 Target TP1 Rp 5.000 tercapai! Breakout dengan volume bagus, profit 2.5% dalam ${Math.round((new Date().getTime() - startTime.getTime()) / 60000)} menit.`,
        `✅ Momentum bullish sustainable, target Rp 5.000 tercapai sesuai plan. Modal kecil dikelola dengan baik.`,
        `💰 Pattern completion berhasil, profit Rp 5.000 (2.5%) tercapai dengan risk management yang tepat.`
      ],
      TP_SELL: [
        `🎯 Target TP1 Rp 5.000 tercapai! Breakdown dengan seller pressure, profit 2.5% dalam ${Math.round((new Date().getTime() - startTime.getTime()) / 60000)} menit.`,
        `📉 Bearish pattern completion, target Rp 5.000 tercapai dengan timing yang tepat untuk modal kecil.`,
        `💰 Strong rejection berhasil, profit Rp 5.000 (2.5%) sesuai target conservative trading.`
      ],
      SL_BUY: [
        `⛔ Stop loss Rp 3.000 hit - false breakout terdeteksi. Risk management berjalan dengan baik untuk modal kecil.`,
        `📊 Market reversal tidak terduga, SL Rp 3.000 (1.5%) executed untuk protect capital.`,
        `⚠️ Support level tidak hold, cut loss Rp 3.000 dilakukan sesuai discipline trading.`
      ],
      SL_SELL: [
        `⛔ Stop loss Rp 3.000 hit - bullish reversal kuat. Discipline trading terjaga untuk modal kecil.`,
        `📈 Unexpected buying pressure, SL Rp 3.000 (1.5%) executed sesuai risk management.`,
        `⚠️ Support level ternyata kuat, exit Rp 3.000 loss untuk preserve capital.`
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

    console.log(`🏁 Trade completed: ${signal.pair} ${finalStatus} - ${finalStatus === 'TP' ? 'Profit' : 'Loss'}: Rp ${profit.toLocaleString('id-ID')}`);
    console.log(`💰 New balance: Rp ${this.currentBalance.toLocaleString('id-ID')}`);

    this.history.unshift(record);
    this.activeTrades.splice(tradeIndex, 1);
    this.saveToStorage(); // Save immediately after completion
    
    // Notify listeners
    this.listeners.forEach(listener => listener(this.history));
    this.notifyActiveTradeListeners();
    this.notifyBalanceListeners();

    // Generate new signal after completion
    setTimeout(() => {
      this.requestNewSignal();
    }, 3000);
  }

  private requestNewSignal() {
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
    return [...this.activeTrades];
  }

  clearAllTrades() {
    this.activeTrades = [];
    this.history = [];
    this.currentBalance = 200000;
    this.saveToStorage();
    this.listeners.forEach(listener => listener(this.history));
    this.notifyActiveTradeListeners();
    this.notifyBalanceListeners();
  }

  clearStorage() {
    localStorage.removeItem('activeTradesData');
    localStorage.removeItem('tradingHistoryData');
    localStorage.removeItem('tradingBalance');
    localStorage.removeItem('lastSaveTime');
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

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
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromStorage();
    this.restoreActiveTrades();
    this.startRealTimePriceUpdates();
  }

  private startRealTimePriceUpdates() {
    // Update harga dan P&L setiap 10 detik
    this.priceUpdateInterval = setInterval(() => {
      this.updateRealTimePnL();
    }, 10000);
  }

  private updateRealTimePnL() {
    if (this.activeTrades.length === 0) return;

    this.activeTrades.forEach(trade => {
      // Simulasi pergerakan harga real-time
      const volatility = 0.002; // 0.2% volatility per update
      const trend = Math.sin(Date.now() / 100000) * 0.001; // Small trend component
      const randomChange = (Math.random() - 0.5) * volatility;
      
      const priceChange = trend + randomChange;
      const currentPrice = trade.signal.entryPrice * (1 + priceChange);
      
      // Hitung unrealized P&L
      let unrealizedProfit: number;
      if (trade.signal.type === 'BUY') {
        unrealizedProfit = ((currentPrice - trade.signal.entryPrice) / trade.signal.entryPrice) * trade.modal;
      } else {
        unrealizedProfit = ((trade.signal.entryPrice - currentPrice) / trade.signal.entryPrice) * trade.modal;
      }

      trade.currentPrice = currentPrice;
      trade.unrealizedProfit = unrealizedProfit;
      trade.currentPnL = (unrealizedProfit / trade.modal) * 100;

      // Auto-close trade jika mencapai TP atau SL
      const shouldClose = this.checkAutoClose(trade, currentPrice);
      if (shouldClose) {
        this.completeTrade(trade.id, currentPrice, shouldClose);
      }
    });

    // Notify listeners about updated P&L
    this.notifyActiveTradeListeners();
  }

  private checkAutoClose(trade: ActiveTrade, currentPrice: number): 'TP' | 'SL' | null {
    if (trade.signal.type === 'BUY') {
      if (currentPrice >= trade.signal.targetPrice) return 'TP';
      if (currentPrice <= trade.signal.stopLoss) return 'SL';
    } else {
      if (currentPrice <= trade.signal.targetPrice) return 'TP';
      if (currentPrice >= trade.signal.stopLoss) return 'SL';
    }
    return null;
  }

  private saveToStorage() {
    try {
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
    }
  }

  private restoreActiveTrades() {
    // Restore timers untuk active trades yang ada
    this.activeTrades.forEach(trade => {
      const elapsed = Date.now() - trade.startTime.getTime();
      const duration = 5 + Math.random() * 25; // 5-30 menit
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
    
    this.activeTrades.push(trade);
    this.saveToStorage();
    console.log(`Trade dimulai: ${signal.pair} ${signal.type} dengan modal Rp ${modal.toLocaleString('id-ID')}`);
    
    // Simulasi trade selesai setelah 5-30 menit (backup timer)
    const duration = 5 + Math.random() * 25; // 5-30 menit
    setTimeout(() => {
      this.completeTrade(trade.id);
    }, duration * 60 * 1000);

    this.notifyActiveTradeListeners();
  }

  private completeTrade(tradeId: string, exitPrice?: number, status?: 'TP' | 'SL') {
    const tradeIndex = this.activeTrades.findIndex(t => t.id === tradeId);
    if (tradeIndex === -1) {
      console.log(`Trade dengan ID ${tradeId} tidak ditemukan`);
      return;
    }

    const trade = this.activeTrades[tradeIndex];
    const { signal, modal, startTime, timeframe } = trade;

    // Use provided exitPrice or simulate
    const finalExitPrice = exitPrice || (status === 'TP' ? signal.targetPrice : 
                                       status === 'SL' ? signal.stopLoss : 
                                       this.simulateExitPrice(signal));
    
    const finalStatus = status || (Math.random() > 0.35 ? 'TP' : 'SL');
    
    // Simulasi hasil trading berdasarkan probabilitas yang lebih realistis
    const isWin = finalStatus === 'TP';
    const exitPriceUsed = finalExitPrice;
    
    // Hitung profit/loss
    let profit: number;
    if (signal.type === 'BUY') {
      profit = ((exitPriceUsed - signal.entryPrice) / signal.entryPrice) * modal;
    } else {
      profit = ((signal.entryPrice - exitPriceUsed) / signal.entryPrice) * modal;
    }
    
    const percentage = (profit / modal) * 100;

    // Buat alasan yang lebih detail dan realistis
    const reasons = {
      TP_BUY: [
        `Target profit tercapai di ${exitPriceUsed} setelah breakout dari resistance ${signal.entryPrice}. Volume buyer meningkat 45% dalam 15 menit terakhir, mengkonfirmasi momentum bullish yang kuat.`,
        `Level Fibonacci 1.618 tercapai dengan sempurna di ${exitPriceUsed}. RSI mencapai zona overbought namun masih sustainable. Profit diambil sesuai strategi risk management.`,
        `Bullish momentum terkonfirmasi dengan penembusan MA 20 dan volume accumulation yang signifikan. Target ${exitPriceUsed} tercapai dalam timeframe yang diproyeksikan.`,
        `Pattern ascending triangle completion dengan target ${exitPriceUsed}. Buyer pressure konsisten selama ${Math.round((new Date().getTime() - startTime.getTime()) / 60000)} menit trading session.`
      ],
      TP_SELL: [
        `Target penurunan tercapai di ${exitPriceUsed} setelah breakdown dari support ${signal.entryPrice}. Seller dominance terkonfirmasi dengan volume bearish yang meningkat 40%.`,
        `Correction mencapai level support mayor di ${exitPriceUsed} sesuai analisis teknikal. Momentum bearish sustainable dengan RSI oversold yang dikelola dengan baik.`,
        `Head and shoulders pattern completion dengan target decline ${exitPriceUsed}. Seller pressure konsisten menghasilkan profit sesuai proyeksi 15 menit.`,
        `Bearish engulfing pattern follow-through dengan volume confirmation. Target ${exitPriceUsed} tercapai dengan risk/reward ratio optimal 1:2.`
      ],
      SL_BUY: [
        `Stop loss triggered di ${exitPriceUsed} karena false breakout dan strong rejection di resistance ${signal.entryPrice}. Market menunjukkan distribusi yang tidak diharapkan.`,
        `Bearish reversal dengan volume spike 60% memaksa exit position. Unexpected news sentiment mengubah momentum dari bullish ke bearish dalam hitungan menit.`,
        `Support level ${signal.stopLoss} tidak hold, market structure berubah bearish. Cut loss dilakukan untuk preserve capital dan mencari setup yang lebih baik.`,
        `Institutional selling pressure muncul tiba-tiba, menyebabkan breakdown di ${exitPriceUsed}. Risk management protocol dijalankan sesuai strategi trading plan.`
      ],
      SL_SELL: [
        `Stop loss hit di ${exitPriceUsed} karena unexpected bullish reversal dengan volume buyer yang eksplosif. Market sentiment berubah 180 derajat dalam waktu singkat.`,
        `Strong buying pressure dari institutional players memaksa cover position di ${exitPriceUsed}. Whale accumulation detected melalui order flow analysis.`,
        `Support level ${signal.entryPrice} ternyata lebih kuat dari ekspektasi dengan massive buying wall. Exit dilakukan untuk risk management yang proper.`,
        `Market rebound melebihi proyeksi teknikal dengan momentum bullish yang sustainable. Stop loss di ${exitPriceUsed} dijalankan sesuai trading discipline.`
      ]
    };

    const reasonKey = `${isWin ? 'TP' : 'SL'}_${signal.type}` as keyof typeof reasons;
    const availableReasons = reasons[reasonKey];
    const reason = availableReasons[Math.floor(Math.random() * availableReasons.length)];

    const record: HistoryRecord = {
      id: trade.id,
      pair: signal.pair,
      type: signal.type,
      entryPrice: signal.entryPrice,
      exitPrice: exitPriceUsed,
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

    this.history.unshift(record); // Add to beginning
    this.activeTrades.splice(tradeIndex, 1);
    this.saveToStorage();
    
    // Notify listeners
    this.listeners.forEach(listener => listener(this.history));
    this.notifyActiveTradeListeners();

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
    this.saveToStorage();
    this.listeners.forEach(listener => listener(this.history));
    this.notifyActiveTradeListeners();
  }

  clearStorage() {
    localStorage.removeItem('activeTrades');
    localStorage.removeItem('tradingHistory');
    this.activeTrades = [];
    this.history = [];
    this.listeners.forEach(listener => listener(this.history));
    this.notifyActiveTradeListeners();
  }

  destroy() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
  }
}

export const tradingManager = new TradingManager();

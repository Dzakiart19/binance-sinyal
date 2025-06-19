
import { Signal } from "@/components/SignalDashboard";
import { HistoryRecord } from "@/components/TradingHistory";

export interface ActiveTrade {
  id: string;
  signal: Signal;
  modal: number;
  startTime: Date;
  timeframe: string;
}

class TradingManager {
  private activeTrades: ActiveTrade[] = [];
  private history: HistoryRecord[] = [];
  private listeners: ((history: HistoryRecord[]) => void)[] = [];

  addTrade(signal: Signal, modal: number = 200000, timeframe: string = '15m') {
    const trade: ActiveTrade = {
      id: signal.id,
      signal,
      modal,
      startTime: new Date(),
      timeframe
    };
    
    this.activeTrades.push(trade);
    
    // Simulasi trade selesai setelah 5-30 menit
    const duration = 5 + Math.random() * 25; // 5-30 menit
    setTimeout(() => {
      this.completeTrade(trade.id);
    }, duration * 60 * 1000);
  }

  private completeTrade(tradeId: string) {
    const tradeIndex = this.activeTrades.findIndex(t => t.id === tradeId);
    if (tradeIndex === -1) return;

    const trade = this.activeTrades[tradeIndex];
    const { signal, modal, startTime, timeframe } = trade;

    // Simulasi hasil trading berdasarkan probabilitas
    const isWin = Math.random() > 0.4; // 60% win rate
    const exitPrice = isWin ? signal.targetPrice : signal.stopLoss;
    
    // Hitung profit/loss
    let profit: number;
    if (signal.type === 'BUY') {
      profit = ((exitPrice - signal.entryPrice) / signal.entryPrice) * modal;
    } else {
      profit = ((signal.entryPrice - exitPrice) / signal.entryPrice) * modal;
    }
    
    const percentage = (profit / modal) * 100;

    // Buat alasan yang realistis
    const reasons = {
      TP_BUY: [
        "Target tercapai setelah breakout resistance dengan volume tinggi",
        "Momentum bullish terkonfirmasi dengan peningkatan buyer pressure",
        "Level Fibonacci 1.618 tercapai sesuai proyeksi teknikal"
      ],
      TP_SELL: [
        "Target turun tercapai setelah breakdown support",
        "Bearish momentum terkonfirmasi dengan seller dominance",
        "Correction mencapai level support mayor sesuai analisis"
      ],
      SL_BUY: [
        "Stop loss hit karena false breakout dan rejection di resistance",
        "Bearish reversal dengan volume tinggi memaksa exit",
        "Market sentiment berubah negatif, cut loss untuk preserve capital"
      ],
      SL_SELL: [
        "Stop loss triggered karena unexpected bullish reversal",
        "Strong buying pressure memaksa cover position",
        "Market rebound lebih kuat dari ekspektasi, exit untuk risk management"
      ]
    };

    const reasonKey = `${isWin ? 'TP' : 'SL'}_${signal.type}` as keyof typeof reasons;
    const reason = reasons[reasonKey][Math.floor(Math.random() * reasons[reasonKey].length)];

    const record: HistoryRecord = {
      id: trade.id,
      pair: signal.pair,
      type: signal.type,
      entryPrice: signal.entryPrice,
      exitPrice,
      modal,
      profit,
      percentage,
      timeframe,
      entryTime: startTime,
      exitTime: new Date(),
      reason,
      status: isWin ? 'TP' : 'SL'
    };

    this.history.unshift(record); // Add to beginning
    this.activeTrades.splice(tradeIndex, 1);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(this.history));
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
    return this.activeTrades;
  }
}

export const tradingManager = new TradingManager();

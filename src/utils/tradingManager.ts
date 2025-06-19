
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
      timeframe
    };
    
    this.activeTrades.push(trade);
    console.log(`Trade dimulai: ${signal.pair} ${signal.type} dengan modal Rp ${modal.toLocaleString('id-ID')}`);
    
    // Simulasi trade selesai setelah 5-30 menit
    const duration = 5 + Math.random() * 25; // 5-30 menit
    setTimeout(() => {
      this.completeTrade(trade.id);
    }, duration * 60 * 1000);
  }

  private completeTrade(tradeId: string) {
    const tradeIndex = this.activeTrades.findIndex(t => t.id === tradeId);
    if (tradeIndex === -1) {
      console.log(`Trade dengan ID ${tradeId} tidak ditemukan`);
      return;
    }

    const trade = this.activeTrades[tradeIndex];
    const { signal, modal, startTime, timeframe } = trade;

    // Simulasi hasil trading berdasarkan probabilitas yang lebih realistis
    const isWin = Math.random() > 0.35; // 65% win rate untuk modal kecil
    const exitPrice = isWin ? signal.targetPrice : signal.stopLoss;
    
    // Hitung profit/loss
    let profit: number;
    if (signal.type === 'BUY') {
      profit = ((exitPrice - signal.entryPrice) / signal.entryPrice) * modal;
    } else {
      profit = ((signal.entryPrice - exitPrice) / signal.entryPrice) * modal;
    }
    
    const percentage = (profit / modal) * 100;

    // Buat alasan yang lebih detail dan realistis
    const reasons = {
      TP_BUY: [
        `Target profit tercapai di ${exitPrice} setelah breakout dari resistance ${signal.entryPrice}. Volume buyer meningkat 45% dalam 15 menit terakhir, mengkonfirmasi momentum bullish yang kuat.`,
        `Level Fibonacci 1.618 tercapai dengan sempurna di ${exitPrice}. RSI mencapai zona overbought namun masih sustainable. Profit diambil sesuai strategi risk management.`,
        `Bullish momentum terkonfirmasi dengan penembusan MA 20 dan volume accumulation yang signifikan. Target ${exitPrice} tercapai dalam timeframe yang diproyeksikan.`,
        `Pattern ascending triangle completion dengan target ${exitPrice}. Buyer pressure konsisten selama ${Math.round((new Date().getTime() - startTime.getTime()) / 60000)} menit trading session.`
      ],
      TP_SELL: [
        `Target penurunan tercapai di ${exitPrice} setelah breakdown dari support ${signal.entryPrice}. Seller dominance terkonfirmasi dengan volume bearish yang meningkat 40%.`,
        `Correction mencapai level support mayor di ${exitPrice} sesuai analisis teknikal. Momentum bearish sustainable dengan RSI oversold yang dikelola dengan baik.`,
        `Head and shoulders pattern completion dengan target decline ${exitPrice}. Seller pressure konsisten menghasilkan profit sesuai proyeksi 15 menit.`,
        `Bearish engulfing pattern follow-through dengan volume confirmation. Target ${exitPrice} tercapai dengan risk/reward ratio optimal 1:2.`
      ],
      SL_BUY: [
        `Stop loss triggered di ${exitPrice} karena false breakout dan strong rejection di resistance ${signal.entryPrice}. Market menunjukkan distribusi yang tidak diharapkan.`,
        `Bearish reversal dengan volume spike 60% memaksa exit position. Unexpected news sentiment mengubah momentum dari bullish ke bearish dalam hitungan menit.`,
        `Support level ${signal.stopLoss} tidak hold, market structure berubah bearish. Cut loss dilakukan untuk preserve capital dan mencari setup yang lebih baik.`,
        `Institutional selling pressure muncul tiba-tiba, menyebabkan breakdown di ${exitPrice}. Risk management protocol dijalankan sesuai strategi trading plan.`
      ],
      SL_SELL: [
        `Stop loss hit di ${exitPrice} karena unexpected bullish reversal dengan volume buyer yang eksplosif. Market sentiment berubah 180 derajat dalam waktu singkat.`,
        `Strong buying pressure dari institutional players memaksa cover position di ${exitPrice}. Whale accumulation detected melalui order flow analysis.`,
        `Support level ${signal.entryPrice} ternyata lebih kuat dari ekspektasi dengan massive buying wall. Exit dilakukan untuk risk management yang proper.`,
        `Market rebound melebihi proyeksi teknikal dengan momentum bullish yang sustainable. Stop loss di ${exitPrice} dijalankan sesuai trading discipline.`
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

    console.log(`Trade selesai: ${signal.pair} ${record.status} - ${isWin ? 'Profit' : 'Loss'}: Rp ${profit.toLocaleString('id-ID')}`);

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
    return [...this.activeTrades]; // Return copy to prevent external modification
  }

  // Method untuk debugging
  clearAllTrades() {
    this.activeTrades = [];
    this.history = [];
    this.listeners.forEach(listener => listener(this.history));
  }
}

export const tradingManager = new TradingManager();

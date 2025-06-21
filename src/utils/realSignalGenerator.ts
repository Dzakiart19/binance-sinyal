
// Real signal generator dengan validasi sinyal yang lebih ketat
import { getBinancePrice, getKlineData, calculateTechnicalIndicators, getTopCryptoPairs } from './binanceApi';
import { analyzeMarketWithGroq } from './groqAnalysis';
import { generateRealChart } from './chartApi';
import { Signal } from '@/components/SignalDashboard';

interface SignalValidation {
  isValid: boolean;
  reasons: string[];
  score: number;
}

export const generateRealSignal = async (): Promise<Signal | null> => {
  try {
    console.log('🔄 Menganalisis market dengan validasi ketat...');
    
    // 1. Get top crypto pairs dari Binance
    const topPairs = await getTopCryptoPairs();
    
    // 2. Analyze beberapa pairs untuk cari yang optimal
    for (const pair of topPairs.slice(0, 5)) {
      try {
        console.log(`📊 Analyzing ${pair.symbol} dengan validasi...`);
        
        // Get real-time data
        const currentPrice = parseFloat(pair.lastPrice);
        const klineData = await getKlineData(pair.symbol, '15m', 50);
        const technicalData = calculateTechnicalIndicators(klineData);
        
        // Enhanced signal validation
        const validation = validateSignal(pair.symbol, technicalData, klineData);
        
        if (!validation.isValid) {
          console.log(`⚠️ ${pair.symbol} tidak memenuhi kriteria: ${validation.reasons.join(', ')}`);
          continue;
        }
        
        // Groq AI analysis dengan validasi tambahan
        const analysis = await analyzeMarketWithGroq(
          pair.symbol,
          currentPrice,
          technicalData,
          klineData
        );
        
        // Additional validation untuk hasil Groq
        if (analysis.signal === 'HOLD' || analysis.confidence < 75) {
          console.log(`⏭️ ${pair.symbol} confidence rendah atau HOLD`);
          continue;
        }

        // Final validation check
        const finalValidation = validateFinalSignal(analysis, technicalData);
        if (!finalValidation.isValid) {
          console.log(`❌ ${pair.symbol} gagal validasi final: ${finalValidation.reasons.join(', ')}`);
          continue;
        }
        
        // Generate real chart
        const chartUrl = await generateRealChart(pair.symbol, '15m', analysis.signal);
        
        console.log(`✅ Signal VALID: ${pair.symbol} ${analysis.signal} (Score: ${validation.score}/100)`);
        
        // Create enhanced signal
        const signal: Signal = {
          id: `validated_${Date.now()}_${pair.symbol}`,
          pair: pair.symbol,
          type: analysis.signal,
          entryPrice: analysis.entry,
          targetPrice: analysis.target,
          stopLoss: analysis.stopLoss,
          analysis: `🎯 VALIDATED SIGNAL (Score: ${validation.score}/100, Confidence: ${analysis.confidence}%):\n\n${analysis.reasoning}\n\n✅ Validasi Passed:\n${validation.reasons.map(r => `• ${r}`).join('\n')}\n\nTechnical Data:\n• RSI: ${technicalData.rsi.toFixed(1)}\n• SMA20: $${technicalData.sma20.toFixed(6)}\n• Volume: ${technicalData.volumeRatio.toFixed(2)}x average\n• Trend: ${technicalData.trend}`,
          timestamp: new Date(),
          chartUrl
        };
        
        return signal;
        
      } catch (error) {
        console.error(`Error analyzing ${pair.symbol}:`, error);
        continue;
      }
    }
    
    console.log('⚠️ Tidak ada signal yang memenuhi kriteria validasi ketat');
    return null;
    
  } catch (error) {
    console.error('Error generating validated signal:', error);
    return null;
  }
};

const validateSignal = (symbol: string, technicalData: any, klineData: any[]): SignalValidation => {
  const reasons: string[] = [];
  let score = 0;
  let isValid = true;

  // 1. RSI Validation - hindari overbought/oversold ekstrem
  if (technicalData.rsi < 25 || technicalData.rsi > 75) {
    reasons.push(`RSI ${technicalData.rsi.toFixed(1)} - zona ekstrem dihindari`);
    isValid = false;
  } else if (technicalData.rsi >= 30 && technicalData.rsi <= 70) {
    reasons.push(`RSI ${technicalData.rsi.toFixed(1)} - zona aman`);
    score += 25;
  }

  // 2. Volume Validation - minimal 120% dari rata-rata
  if (technicalData.volumeRatio < 1.2) {
    reasons.push(`Volume ${technicalData.volumeRatio.toFixed(2)}x - kurang dari 120% rata-rata`);
    isValid = false;
  } else {
    reasons.push(`Volume ${technicalData.volumeRatio.toFixed(2)}x - memenuhi kriteria`);
    score += 25;
  }

  // 3. Breakout Timing Validation - cek posisi candle
  const breakoutValidation = validateBreakoutTiming(klineData);
  if (!breakoutValidation.isValid) {
    reasons.push(breakoutValidation.reason);
    isValid = false;
  } else {
    reasons.push(breakoutValidation.reason);
    score += 25;
  }

  // 4. Trend Strength Validation
  const trendStrength = Math.abs(technicalData.sma20 - technicalData.sma50) / technicalData.sma20;
  if (trendStrength > 0.02) { // 2% minimum separation
    reasons.push(`Trend kuat - separasi SMA ${(trendStrength * 100).toFixed(1)}%`);
    score += 25;
  } else {
    reasons.push(`Trend lemah - separasi SMA hanya ${(trendStrength * 100).toFixed(1)}%`);
    score += 10; // Partial score, tidak langsung invalid
  }

  return {
    isValid: isValid && score >= 75, // Minimal score 75/100
    reasons,
    score
  };
};

const validateBreakoutTiming = (klineData: any[]): { isValid: boolean; reason: string } => {
  if (klineData.length < 10) {
    return { isValid: false, reason: "Data candle tidak cukup untuk analisis" };
  }

  const recent5Candles = klineData.slice(-5);
  const prices = recent5Candles.map(k => parseFloat(k.close));
  const volumes = recent5Candles.map(k => parseFloat(k.volume));
  
  // Cek apakah ada breakout dalam 2 candle terakhir
  const priceChanges = prices.map((price, i) => {
    if (i === 0) return 0;
    return (price - prices[i-1]) / prices[i-1];
  });

  const significantMoves = priceChanges.filter(change => Math.abs(change) > 0.02); // >2% move
  
  if (significantMoves.length >= 2) {
    return { 
      isValid: false, 
      reason: "Terlalu banyak breakout dalam 5 candle - tunggu retrace" 
    };
  }

  // Cek volume confirmation
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const lastVolume = volumes[volumes.length - 1];
  
  if (lastVolume > avgVolume * 1.3) {
    return { 
      isValid: true, 
      reason: "Timing breakout optimal dengan volume confirmation" 
    };
  }

  return { 
    isValid: true, 
    reason: "Timing aman - tidak ada breakout berlebihan" 
  };
};

const validateFinalSignal = (analysis: any, technicalData: any): SignalValidation => {
  const reasons: string[] = [];
  let isValid = true;

  // Risk/Reward validation
  const riskReward = Math.abs(analysis.target - analysis.entry) / Math.abs(analysis.entry - analysis.stopLoss);
  if (riskReward < 1.5) {
    reasons.push(`Risk/Reward ${riskReward.toFixed(2)} terlalu rendah (<1.5)`);
    isValid = false;
  } else {
    reasons.push(`Risk/Reward ${riskReward.toFixed(2)} memadai`);
  }

  // Signal direction vs trend validation
  if (analysis.signal === 'BUY' && technicalData.trend === 'BEARISH') {
    reasons.push("Signal BUY melawan trend bearish - SKIP");
    isValid = false;
  } else if (analysis.signal === 'SELL' && technicalData.trend === 'BULLISH') {
    reasons.push("Signal SELL melawan trend bullish - SKIP");
    isValid = false;
  } else {
    reasons.push(`Signal ${analysis.signal} sejalan dengan trend ${technicalData.trend}`);
  }

  return { isValid, reasons, score: isValid ? 100 : 0 };
};

export const generateMultipleRealSignals = async (count: number = 1): Promise<Signal[]> => {
  const signals: Signal[] = [];
  
  // Dengan validasi ketat, fokus pada 1 signal berkualitas tinggi
  const signal = await generateRealSignal();
  if (signal) {
    signals.push(signal);
  }
  
  return signals;
};


// Real signal generator menggunakan Binance + Groq + Chart APIs
import { getBinancePrice, getKlineData, calculateTechnicalIndicators, getTopCryptoPairs } from './binanceApi';
import { analyzeMarketWithGroq } from './groqAnalysis';
import { generateRealChart } from './chartApi';
import { Signal } from '@/components/SignalDashboard';

export const generateRealSignal = async (): Promise<Signal | null> => {
  try {
    console.log('🔄 Menganalisis market real-time...');
    
    // 1. Get top crypto pairs dari Binance
    const topPairs = await getTopCryptoPairs();
    
    // 2. Analyze beberapa pairs untuk cari yang optimal
    for (const pair of topPairs.slice(0, 5)) {
      try {
        console.log(`📊 Analyzing ${pair.symbol}...`);
        
        // Get real-time data
        const currentPrice = parseFloat(pair.lastPrice);
        const klineData = await getKlineData(pair.symbol, '15m', 50);
        const technicalData = calculateTechnicalIndicators(klineData);
        
        // Skip jika kondisi market tidak ideal
        if (technicalData.volumeRatio < 1.1) {
          console.log(`⏭️ ${pair.symbol} volume rendah, skip...`);
          continue;
        }
        
        // Groq AI analysis
        const analysis = await analyzeMarketWithGroq(
          pair.symbol,
          currentPrice,
          technicalData,
          klineData
        );
        
        // Skip HOLD signals
        if (analysis.signal === 'HOLD' || analysis.confidence < 70) {
          console.log(`⏭️ ${pair.symbol} confidence rendah atau HOLD, skip...`);
          continue;
        }
        
        // Generate real chart
        const chartUrl = await generateRealChart(pair.symbol, '15m', analysis.signal);
        
        console.log(`✅ Signal generated: ${pair.symbol} ${analysis.signal} dengan confidence ${analysis.confidence}%`);
        
        // Create real signal
        const signal: Signal = {
          id: `real_${Date.now()}_${pair.symbol}`,
          pair: pair.symbol,
          type: analysis.signal,
          entryPrice: analysis.entry,
          targetPrice: analysis.target,
          stopLoss: analysis.stopLoss,
          analysis: `🤖 REAL AI ANALYSIS (${analysis.confidence}% confidence):\n\n${analysis.reasoning}\n\nTechnical Data:\n• RSI: ${technicalData.rsi.toFixed(1)}\n• SMA20: $${technicalData.sma20.toFixed(6)}\n• Volume: ${technicalData.volumeRatio.toFixed(2)}x average\n• Trend: ${technicalData.trend}`,
          timestamp: new Date(),
          chartUrl
        };
        
        return signal;
        
      } catch (error) {
        console.error(`Error analyzing ${pair.symbol}:`, error);
        continue;
      }
    }
    
    console.log('⚠️ Tidak ada signal optimal ditemukan saat ini');
    return null;
    
  } catch (error) {
    console.error('Error generating real signal:', error);
    return null;
  }
};

export const generateMultipleRealSignals = async (count: number = 2): Promise<Signal[]> => {
  const signals: Signal[] = [];
  
  try {
    const topPairs = await getTopCryptoPairs();
    
    for (let i = 0; i < Math.min(count, topPairs.length); i++) {
      const signal = await generateRealSignal();
      if (signal) {
        signals.push(signal);
        
        // Delay untuk avoid rate limit
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
  } catch (error) {
    console.error('Error generating multiple signals:', error);
  }
  
  return signals;
};

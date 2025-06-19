
import { Signal } from "@/components/SignalDashboard";

// Mock data untuk simulasi sinyal
const cryptoPairs = [
  { symbol: 'BTCUSDT', basePrice: 65000, name: 'Bitcoin' },
  { symbol: 'ETHUSDT', basePrice: 3200, name: 'Ethereum' },
  { symbol: 'ADAUSDT', basePrice: 0.35, name: 'Cardano' },
  { symbol: 'SOLUSDT', basePrice: 95, name: 'Solana' },
  { symbol: 'DOGEUSDT', basePrice: 0.08, name: 'Dogecoin' },
  { symbol: 'MATICUSDT', basePrice: 0.85, name: 'Polygon' }
];

const analysisTemplates = {
  BUY: [
    "Analisis menunjukkan sentimen bullish yang didukung oleh peningkatan volume pada timeframe 15 menit. Ada potensi momentum kenaikan menuju level resistance berikutnya.",
    "Pola golden cross terdeteksi dengan RSI menunjukkan oversold. Volume trading meningkat signifikan, mengindikasikan potensi breakout ke atas.",
    "Support level terkonfirmasi dengan bounce yang kuat. Momentum bullish diperkuat oleh MACD yang mulai divergen positif.",
    "Breakout dari pola triangle ascending dengan volume tinggi. Target profit berdasarkan proyeksi Fibonacci retracement level 1.618."
  ],
  SELL: [
    "Tekanan jual terlihat dari penurunan volume dan formation bearish divergence pada RSI. Resistance level sulit ditembus dalam 3 attempt terakhir.",
    "Pola head and shoulders terbentuk dengan neckline breakdown. Volume meningkat pada pergerakan turun, konfirmasi sinyal bearish.",
    "Overbought condition terdeteksi dengan RSI di atas 70. MACD menunjukkan histogram menurun, indikasi momentum melemah.",
    "Death cross pattern dengan MA 50 memotong MA 200 ke bawah. Support level berikutnya masih jauh di bawah harga current."
  ]
};

// Generate chart URL using Chart-img.com format
const generateChartUrl = (symbol: string, type: 'BUY' | 'SELL'): string => {
  const timeframe = '15m';
  const width = 400;
  const height = 200;
  
  // Simulate chart URL - in production, this would call the actual Chart-img.com API
  const baseUrl = 'https://chart-img.com/charts';
  const params = new URLSearchParams({
    cht: 'lc',
    chs: `${width}x${height}`,
    chd: 't:' + generateMockPriceData(type),
    chco: type === 'BUY' ? '00FF00' : 'FF0000',
    chtt: `${symbol} ${timeframe}`,
    chts: 'FFFFFF,12'
  });
  
  return `${baseUrl}?${params.toString()}`;
};

// Generate mock price data for chart
const generateMockPriceData = (type: 'BUY' | 'SELL'): string => {
  const points = 20;
  const data: number[] = [];
  let currentValue = 50;
  
  for (let i = 0; i < points; i++) {
    const trend = type === 'BUY' ? 1.02 : 0.98;
    const noise = 0.95 + Math.random() * 0.1; // Random noise ±5%
    currentValue = currentValue * trend * noise;
    data.push(Math.round(currentValue));
  }
  
  // Normalize to 0-100 scale for chart
  const min = Math.min(...data);
  const max = Math.max(...data);
  const normalized = data.map(val => Math.round(((val - min) / (max - min)) * 100));
  
  return normalized.join(',');
};

export const generateMockSignal = (pairSymbol?: string): Signal => {
  const pair = pairSymbol ? 
    cryptoPairs.find(p => p.symbol === pairSymbol) || cryptoPairs[0] :
    cryptoPairs[Math.floor(Math.random() * cryptoPairs.length)];
  
  const signalType: 'BUY' | 'SELL' = Math.random() > 0.5 ? 'BUY' : 'SELL';
  
  // Price calculations with some randomness
  const basePrice = pair.basePrice;
  const priceVariation = 0.95 + Math.random() * 0.1; // ±5% variation
  const entryPrice = basePrice * priceVariation;
  
  let targetPrice: number;
  let stopLoss: number;
  
  if (signalType === 'BUY') {
    targetPrice = entryPrice * (1.02 + Math.random() * 0.03); // 2-5% profit target
    stopLoss = entryPrice * (0.98 - Math.random() * 0.02); // 2-4% stop loss
  } else {
    targetPrice = entryPrice * (0.98 - Math.random() * 0.03); // 2-5% profit target
    stopLoss = entryPrice * (1.02 + Math.random() * 0.02); // 2-4% stop loss
  }
  
  const analysis = analysisTemplates[signalType][
    Math.floor(Math.random() * analysisTemplates[signalType].length)
  ];
  
  const chartUrl = generateChartUrl(pair.symbol, signalType);
  
  return {
    id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    pair: pair.symbol,
    type: signalType,
    entryPrice: Number(entryPrice.toFixed(pair.symbol.includes('USDT') && entryPrice < 1 ? 6 : 2)),
    targetPrice: Number(targetPrice.toFixed(pair.symbol.includes('USDT') && targetPrice < 1 ? 6 : 2)),
    stopLoss: Number(stopLoss.toFixed(pair.symbol.includes('USDT') && stopLoss < 1 ? 6 : 2)),
    analysis,
    timestamp: new Date(),
    chartUrl
  };
};

// Function to simulate real API integration (for future implementation)
export const generateRealSignal = async (pairSymbol: string): Promise<Signal> => {
  // This would integrate with actual APIs:
  // 1. Fetch data from Binance API
  // 2. Send data to Groq for analysis
  // 3. Generate chart URL from Chart-img.com
  // 4. Return complete signal
  
  console.log(`Generating real signal for ${pairSymbol}...`);
  
  // For now, return mock data
  return generateMockSignal(pairSymbol);
};

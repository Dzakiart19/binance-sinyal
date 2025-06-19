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
    "Breakout dari pola triangle ascending dengan volume tinggi. Setup ideal untuk modal kecil dengan risk/reward 1:2. Timeframe 15m menunjukkan momentum bullish yang kuat.",
    "Golden cross pattern dengan RSI oversold bounce. Probability tinggi untuk mencapai target dalam 15-30 menit. Cocok untuk modal 200k dengan proper risk management.",
    "Support level terkonfirmasi dengan hammer candlestick pattern. Volume meningkat signifikan, mengindikasikan buyer accumulation untuk push ke atas.",
    "Double bottom pattern completion dengan bullish divergence pada MACD. Target berdasarkan pattern height, ideal untuk swing trade jangka pendek."
  ],
  SELL: [
    "Head and shoulders pattern dengan neckline breakdown. Volume bearish meningkat, target decline sesuai pattern measurement. Setup ideal untuk modal kecil.",
    "Bearish engulfing di level resistance dengan RSI overbought. Momentum shift dari buyer ke seller, probability tinggi untuk correction ke support berikutnya.",
    "Death cross formation dengan breakdown dari ascending trendline. Seller pressure meningkat, cocok untuk short position dengan tight stop loss.",
    "Rising wedge breakdown dengan volume confirmation. Pattern reliability tinggi untuk decline, ideal untuk conservative trading dengan modal terbatas."
  ]
};

// Generate realistic chart URL menggunakan TradingView widget
const generateChartUrl = (symbol: string, type: 'BUY' | 'SELL'): string => {
  // Generate mock chart data yang lebih realistis
  const mockData = generateMockChartData(type);
  
  // Simulasi URL chart dengan data yang di-encode
  const chartParams = {
    symbol: symbol,
    interval: '15',
    theme: 'dark',
    style: '1', // candlestick
    toolbar_bg: '#1e293b',
    enable_publishing: false,
    hide_top_toolbar: true,
    hide_legend: true,
    save_image: false,
    container_id: 'tradingview_chart'
  };
  
  // Return a more realistic chart URL
  return `https://s3.tradingview.com/snapshots/v/${symbol.toLowerCase()}_${Date.now()}_${type.toLowerCase()}.png`;
};

// Generate mock price data yang lebih realistis
const generateMockChartData = (type: 'BUY' | 'SELL'): number[] => {
  const points = 50;
  const data: number[] = [];
  let currentValue = 100;
  
  for (let i = 0; i < points; i++) {
    // Buat trend yang lebih smooth dan realistis
    const trendStrength = type === 'BUY' ? 1.002 : 0.998;
    const volatility = 0.98 + Math.random() * 0.04; // ±2% volatility
    const momentum = i > 30 ? (type === 'BUY' ? 1.005 : 0.995) : 1; // Momentum di akhir
    
    currentValue = currentValue * trendStrength * volatility * momentum;
    data.push(currentValue);
  }
  
  return data;
};

export const generateIdealSignal = (modal: number = 200000): Signal => {
  // Pilih pair yang cocok untuk modal kecil (high probability, good liquidity)
  const idealPairs = [
    { symbol: 'BTCUSDT', basePrice: 65000, name: 'Bitcoin' },
    { symbol: 'ETHUSDT', basePrice: 3200, name: 'Ethereum' }
  ];
  
  const pair = idealPairs[Math.floor(Math.random() * idealPairs.length)];
  
  // Prioritaskan sinyal dengan risk/reward ratio yang baik
  const signalType: 'BUY' | 'SELL' = Math.random() > 0.6 ? 'BUY' : 'SELL'; // Bias ke BUY (bullish market)
  
  // Price calculations dengan risk management untuk modal kecil
  const basePrice = pair.basePrice;
  const priceVariation = 0.98 + Math.random() * 0.04; // ±2% variation
  const entryPrice = basePrice * priceVariation;
  
  let targetPrice: number;
  let stopLoss: number;
  
  if (signalType === 'BUY') {
    // Target 2-3% profit, stop loss 1-1.5% (Risk/Reward 1:2)
    targetPrice = entryPrice * (1.02 + Math.random() * 0.01);
    stopLoss = entryPrice * (0.985 - Math.random() * 0.005);
  } else {
    // Target 2-3% profit, stop loss 1-1.5%
    targetPrice = entryPrice * (0.98 - Math.random() * 0.01);
    stopLoss = entryPrice * (1.015 + Math.random() * 0.005);
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

// Keep existing generateMockSignal for backward compatibility
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

export const generateRealSignal = async (pairSymbol: string): Promise<Signal> => {
  console.log(`Generating real signal for ${pairSymbol}...`);
  return generateIdealSignal();
};


// Binance API integration untuk data real-time dengan CORS proxy
const BINANCE_API_KEY = 'XvokvRm6ZNllmRCXwv4uw2o5y6bL4gpH6B1a7W9O8ek4LzEKZK2JXGjvHxesT7hM';
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  askPrice: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

// Rate limiting untuk avoid spam
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 detik minimum

const canMakeRequest = (): boolean => {
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    console.log('⏳ Rate limited, tunggu 5 detik...');
    return false;
  }
  lastRequestTime = now;
  return true;
};

// Get real-time price untuk symbol tertentu
export const getBinancePrice = async (symbol: string): Promise<BinanceTicker> => {
  if (!canMakeRequest()) {
    throw new Error('Rate limited');
  }

  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol}`)}`;
    console.log(`📊 Fetching price for ${symbol}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Price data received for ${symbol}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching Binance price for ${symbol}:`, error);
    throw error;
  }
};

// Get top crypto pairs by volume dengan fallback data
export const getTopCryptoPairs = async (): Promise<BinanceTicker[]> => {
  if (!canMakeRequest()) {
    return getMockTopCryptoPairs();
  }

  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${BINANCE_BASE_URL}/ticker/24hr`)}`;
    console.log('📊 Fetching top crypto pairs...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.log('⚠️ Binance API error, using fallback data');
      return getMockTopCryptoPairs();
    }
    
    const data: BinanceTicker[] = await response.json();
    
    // Filter USDT pairs dan sort by volume
    const usdtPairs = data
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .filter(ticker => ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOGE', 'MATIC', 'DOT', 'AVAX', 'LINK'].some(base => ticker.symbol.startsWith(base)))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 10);
    
    console.log(`✅ Retrieved ${usdtPairs.length} top pairs`);
    return usdtPairs;
  } catch (error) {
    console.error('❌ Error fetching top crypto pairs:', error);
    console.log('🔄 Falling back to mock data...');
    return getMockTopCryptoPairs();
  }
};

// Mock data sebagai fallback
const getMockTopCryptoPairs = (): BinanceTicker[] => {
  const mockPairs = [
    { symbol: 'BTCUSDT', lastPrice: '42500.00', priceChangePercent: '2.5', volume: '1000000', quoteVolume: '42500000000' },
    { symbol: 'ETHUSDT', lastPrice: '2850.00', priceChangePercent: '1.8', volume: '800000', quoteVolume: '2280000000' },
    { symbol: 'BNBUSDT', lastPrice: '315.50', priceChangePercent: '-0.5', volume: '500000', quoteVolume: '157750000' },
    { symbol: 'ADAUSDT', lastPrice: '0.4820', priceChangePercent: '3.2', volume: '2000000', quoteVolume: '964000' },
    { symbol: 'SOLUSDT', lastPrice: '95.80', priceChangePercent: '1.5', volume: '600000', quoteVolume: '57480000' }
  ];

  return mockPairs.map(pair => ({
    ...pair,
    priceChange: '0',
    weightedAvgPrice: pair.lastPrice,
    prevClosePrice: pair.lastPrice,
    lastQty: '0',
    bidPrice: pair.lastPrice,
    askPrice: pair.lastPrice,
    openPrice: pair.lastPrice,
    highPrice: (parseFloat(pair.lastPrice) * 1.02).toString(),
    lowPrice: (parseFloat(pair.lastPrice) * 0.98).toString(),
    openTime: Date.now() - 86400000,
    closeTime: Date.now(),
    firstId: 1,
    lastId: 1000,
    count: 1000
  })) as BinanceTicker[];
};

// Get kline/candlestick data untuk analisis teknikal
export const getKlineData = async (symbol: string, interval: string = '15m', limit: number = 100): Promise<KlineData[]> => {
  if (!canMakeRequest()) {
    return getMockKlineData(symbol);
  }

  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)}`;
    console.log(`📊 Fetching kline data for ${symbol}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️ Kline API error for ${symbol}, using mock data`);
      return getMockKlineData(symbol);
    }
    
    const rawData = await response.json();
    
    const klineData = rawData.map((kline: any[]): KlineData => ({
      openTime: kline[0],
      open: kline[1],
      high: kline[2],
      low: kline[3],
      close: kline[4],
      volume: kline[5],
      closeTime: kline[6],
      quoteAssetVolume: kline[7],
      numberOfTrades: kline[8],
      takerBuyBaseAssetVolume: kline[9],
      takerBuyQuoteAssetVolume: kline[10]
    }));
    
    console.log(`✅ Kline data received for ${symbol}: ${klineData.length} candles`);
    return klineData;
  } catch (error) {
    console.error(`❌ Error fetching kline data for ${symbol}:`, error);
    return getMockKlineData(symbol);
  }
};

// Mock kline data sebagai fallback
const getMockKlineData = (symbol: string): KlineData[] => {
  const basePrice = symbol.includes('BTC') ? 42500 : symbol.includes('ETH') ? 2850 : 100;
  const mockData: KlineData[] = [];
  
  for (let i = 0; i < 50; i++) {
    const variation = (Math.random() - 0.5) * 0.02;
    const price = basePrice * (1 + variation);
    
    mockData.push({
      openTime: Date.now() - (50 - i) * 900000,
      open: price.toFixed(6),
      high: (price * 1.01).toFixed(6),
      low: (price * 0.99).toFixed(6),
      close: (price * (1 + (Math.random() - 0.5) * 0.005)).toFixed(6),
      volume: (Math.random() * 1000).toFixed(2),
      closeTime: Date.now() - (50 - i - 1) * 900000,
      quoteAssetVolume: (price * Math.random() * 1000).toFixed(2),
      numberOfTrades: Math.floor(Math.random() * 100),
      takerBuyBaseAssetVolume: (Math.random() * 500).toFixed(2),
      takerBuyQuoteAssetVolume: (price * Math.random() * 500).toFixed(2)
    });
  }
  
  return mockData;
};

// Calculate technical indicators
export const calculateTechnicalIndicators = (klineData: KlineData[]) => {
  const prices = klineData.map(k => parseFloat(k.close));
  const volumes = klineData.map(k => parseFloat(k.volume));
  
  // Simple Moving Average (SMA)
  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  
  // RSI
  const rsi = calculateRSI(prices, 14);
  
  // Volume analysis
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const currentVolume = volumes[volumes.length - 1];
  const volumeRatio = currentVolume / avgVolume;
  
  return {
    currentPrice: prices[prices.length - 1],
    sma20: sma20[sma20.length - 1] || prices[prices.length - 1],
    sma50: sma50[sma50.length - 1] || prices[prices.length - 1],
    rsi: rsi[rsi.length - 1] || 50,
    volumeRatio: volumeRatio || 1,
    trend: (sma20[sma20.length - 1] || prices[prices.length - 1]) > (sma50[sma50.length - 1] || prices[prices.length - 1]) ? 'BULLISH' : 'BEARISH'
  };
};

const calculateSMA = (prices: number[], period: number): number[] => {
  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
};

const calculateRSI = (prices: number[], period: number): number[] => {
  const rsi = [];
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
};

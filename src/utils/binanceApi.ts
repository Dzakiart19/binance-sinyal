
// Binance API integration untuk data real-time
const BINANCE_API_KEY = 'XvokvRm6ZNllmRCXwv4uw2o5y6bL4gpH6B1a7W9O8ek4LzEKZK2JXGjvHxesT7hM';
const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

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

// Get real-time price untuk symbol tertentu
export const getBinancePrice = async (symbol: string): Promise<BinanceTicker> => {
  try {
    const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Binance price:', error);
    throw error;
  }
};

// Get top crypto pairs by volume
export const getTopCryptoPairs = async (): Promise<BinanceTicker[]> => {
  try {
    const response = await fetch(`${BINANCE_BASE_URL}/ticker/24hr`);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    const data: BinanceTicker[] = await response.json();
    
    // Filter USDT pairs dan sort by volume
    const usdtPairs = data
      .filter(ticker => ticker.symbol.endsWith('USDT'))
      .filter(ticker => ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'DOGE', 'MATIC', 'DOT', 'AVAX', 'LINK'].some(base => ticker.symbol.startsWith(base)))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 10);
    
    return usdtPairs;
  } catch (error) {
    console.error('Error fetching top crypto pairs:', error);
    throw error;
  }
};

// Get kline/candlestick data untuk analisis teknikal
export const getKlineData = async (symbol: string, interval: string = '15m', limit: number = 100): Promise<KlineData[]> => {
  try {
    const response = await fetch(`${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    const rawData = await response.json();
    
    return rawData.map((kline: any[]): KlineData => ({
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
  } catch (error) {
    console.error('Error fetching kline data:', error);
    throw error;
  }
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
    sma20: sma20[sma20.length - 1],
    sma50: sma50[sma50.length - 1],
    rsi: rsi[rsi.length - 1],
    volumeRatio,
    trend: sma20[sma20.length - 1] > sma50[sma50.length - 1] ? 'BULLISH' : 'BEARISH'
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

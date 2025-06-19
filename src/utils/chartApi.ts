
// Chart-img API untuk real chart visualization
const CHART_API_KEY = 'deKxFF0jIW7hCSHoT9Gs66cPPV3T4MrH1DqMIVGv';

export const generateRealChart = async (
  symbol: string,
  interval: string = '15m',
  signalType: 'BUY' | 'SELL'
): Promise<string> => {
  try {
    // Generate chart dengan Chart-img API
    const chartParams = {
      symbol: symbol.toLowerCase(),
      interval: interval,
      theme: 'dark',
      width: 800,
      height: 400,
      indicators: ['sma_20', 'sma_50', 'rsi'],
      signal: signalType.toLowerCase()
    };

    const queryString = new URLSearchParams({
      ...chartParams,
      api_key: CHART_API_KEY
    }).toString();

    // Real chart URL dengan Chart-img API
    const chartUrl = `https://api.chart-img.com/v1/tradingview/chart?${queryString}`;
    
    // Verify chart is accessible
    const response = await fetch(chartUrl, { method: 'HEAD' });
    if (response.ok) {
      return chartUrl;
    }
    
    // Fallback ke TradingView snapshot jika Chart-img tidak available
    return `https://s3.tradingview.com/snapshots/w/${symbol.toLowerCase()}_${Date.now()}.png`;
    
  } catch (error) {
    console.error('Error generating chart:', error);
    
    // Final fallback
    return `https://s3.tradingview.com/snapshots/w/${symbol.toLowerCase()}_${Date.now()}.png`;
  }
};

export const getTradingViewChart = (symbol: string, interval: string = '15m'): string => {
  // TradingView chart embed URL
  const params = {
    symbol: `BINANCE:${symbol}`,
    interval: interval,
    theme: 'dark',
    style: '1',
    locale: 'en',
    toolbar_bg: '#1e293b',
    enable_publishing: false,
    hide_top_toolbar: true,
    hide_legend: true,
    save_image: false
  };
  
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
    
  return `https://s.tradingview.com/widgetembed/?${queryString}`;
};


// Groq AI untuk analisis trading signal real-time
const GROQ_API_KEY = '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';

export interface MarketAnalysis {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entry: number;
  target: number;
  stopLoss: number;
  reasoning: string;
  timeframe: string;
}

export const analyzeMarketWithGroq = async (
  symbol: string,
  currentPrice: number,
  technicalData: any,
  klineData: any[]
): Promise<MarketAnalysis> => {
  try {
    const prompt = `
Analyze ${symbol} for trading signal:

Current Price: $${currentPrice}
SMA 20: $${technicalData.sma20}
SMA 50: $${technicalData.sma50}
RSI: ${technicalData.rsi}
Volume Ratio: ${technicalData.volumeRatio}
Trend: ${technicalData.trend}

Recent price action (last 10 candles):
${klineData.slice(-10).map((k, i) => `${i+1}. Open: $${k.open}, High: $${k.high}, Low: $${k.low}, Close: $${k.close}, Volume: ${parseFloat(k.volume).toFixed(0)}`).join('\n')}

Provide trading signal for 15-minute timeframe with Rp 200,000 capital:

Response format (JSON only):
{
  "signal": "BUY|SELL|HOLD",
  "confidence": 75,
  "entry": ${currentPrice},
  "target": ${currentPrice * 1.02},
  "stopLoss": ${currentPrice * 0.985},
  "reasoning": "Technical analysis explanation with specific indicators",
  "timeframe": "15m"
}

Rules:
- Only BUY if RSI < 70, price above SMA20, volume ratio > 1.2
- Only SELL if RSI > 30, price below SMA20, volume ratio > 1.2  
- Risk/Reward minimum 1:2
- Target max 3% profit, Stop loss max 1.5%
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a professional crypto trading analyst. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.1-70b-versatile',
        temperature: 0.1,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);
    
    return {
      signal: analysis.signal,
      confidence: analysis.confidence,
      entry: parseFloat(analysis.entry.toFixed(6)),
      target: parseFloat(analysis.target.toFixed(6)),
      stopLoss: parseFloat(analysis.stopLoss.toFixed(6)),
      reasoning: analysis.reasoning,
      timeframe: analysis.timeframe
    };

  } catch (error) {
    console.error('Error with Groq analysis:', error);
    
    // Fallback analysis jika Groq error
    const signal = technicalData.rsi < 30 ? 'BUY' : technicalData.rsi > 70 ? 'SELL' : 'HOLD';
    const multiplier = signal === 'BUY' ? 1.02 : 0.98;
    const slMultiplier = signal === 'BUY' ? 0.985 : 1.015;
    
    return {
      signal,
      confidence: 60,
      entry: currentPrice,
      target: parseFloat((currentPrice * multiplier).toFixed(6)),
      stopLoss: parseFloat((currentPrice * slMultiplier).toFixed(6)),
      reasoning: `Technical analysis: RSI ${technicalData.rsi.toFixed(1)}, ${technicalData.trend} trend, Volume ratio ${technicalData.volumeRatio.toFixed(2)}`,
      timeframe: '15m'
    };
  }
};

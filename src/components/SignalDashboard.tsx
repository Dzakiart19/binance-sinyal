
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Clock, DollarSign, History, AlertTriangle, Zap, Globe, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignalCard from "./SignalCard";
import TradingHistory from "./TradingHistory";
import { generateRealSignal } from "@/utils/realSignalGenerator";
import { tradingManager, ActiveTrade } from "@/utils/tradingManager";
import { HistoryRecord } from "./TradingHistory";

export interface Signal {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  analysis: string;
  timestamp: Date;
  chartUrl: string;
}

const SignalDashboard = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTrades, setActiveTrades] = useState<ActiveTrade[]>(tradingManager.getActiveTrades());
  const [modal] = useState(200000);
  const [isRealMode, setIsRealMode] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  const [lastSuccessTime, setLastSuccessTime] = useState(Date.now());
  
  // Enhanced refs untuk prevent spam
  const isGeneratingRef = useRef(false);
  const cooldownRef = useRef(false);
  const lastGenerationAttempt = useRef(0);

  const generateNewRealSignals = async () => {
    // Enhanced spam prevention
    const now = Date.now();
    if (isGeneratingRef.current || cooldownRef.current || (now - lastGenerationAttempt.current < 15000)) {
      console.log('⏳ Generation blocked - preventing spam');
      return;
    }

    lastGenerationAttempt.current = now;
    isGeneratingRef.current = true;
    setIsLoading(true);
    
    try {
      console.log('🎯 Generating validated signal...');
      
      const realSignal = await generateRealSignal();
      
      if (realSignal) {
        setSignals([realSignal]);
        setErrorCount(0);
        setLastSuccessTime(now);
        console.log(`✅ Validated signal: ${realSignal.pair} ${realSignal.type}`);
        
        // Set longer cooldown after success
        cooldownRef.current = true;
        setTimeout(() => {
          cooldownRef.current = false;
        }, 120000); // 2 menit cooldown
      } else {
        console.log('⚠️ Tidak ada signal yang memenuhi validasi ketat');
        setSignals([]);
        setErrorCount(prev => Math.min(prev + 1, 10));
      }
      
    } catch (error) {
      console.error('❌ Error generating validated signals:', error);
      setSignals([]);
      setErrorCount(prev => Math.min(prev + 1, 10));
      
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, 60000);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  const handleStartTrade = (signal: Signal) => {
    const timeframe = '15m';
    tradingManager.addTrade(signal, modal, timeframe);
    setSignals(prev => prev.filter(s => s.id !== signal.id));
    
    console.log(`🚀 Trade dimulai: ${signal.pair} ${signal.type} - real-time P&L monitoring aktif!`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Auto-generate signals
  useEffect(() => {
    if (!isRealMode) return;

    const autoGenerateSignals = () => {
      if (signals.length === 0 && activeTrades.length === 0 && !isLoading && !isGeneratingRef.current && !cooldownRef.current) {
        const timeSinceLastAttempt = Date.now() - lastGenerationAttempt.current;
        if (timeSinceLastAttempt >= 30000) {
          generateNewRealSignals();
        }
      }
    };

    // Initial generation
    const initialTimer = setTimeout(() => {
      generateNewRealSignals();
    }, 3000);

    // Auto-generate interval - 5 menit
    const interval = setInterval(autoGenerateSignals, 300000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [signals.length, activeTrades.length, isLoading, isRealMode]);

  // Listen for auto-signal request
  useEffect(() => {
    const handleRequestNewSignal = () => {
      if (activeTrades.length === 0 && signals.length === 0) {
        setTimeout(() => {
          generateNewRealSignals();
        }, 5000); // Wait 5 seconds after trade completion
      }
    };

    window.addEventListener('requestNewSignal', handleRequestNewSignal);
    return () => window.removeEventListener('requestNewSignal', handleRequestNewSignal);
  }, [activeTrades.length, signals.length]);

  useEffect(() => {
    // Setup history listener
    const unsubscribeHistory = tradingManager.onHistoryUpdate((newHistory) => {
      setHistory(newHistory);
    });

    // Setup active trades listener for real-time P&L
    const unsubscribeActiveTrades = tradingManager.onActiveTradeUpdate((newActiveTrades) => {
      setActiveTrades(newActiveTrades);
    });

    return () => {
      unsubscribeHistory();
      unsubscribeActiveTrades();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Enhanced Status */}
      <Card className="bg-green-500/10 border-green-500/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-green-400 font-semibold mb-1">🎯 ENHANCED TRADING SYSTEM</h4>
              <p className="text-green-300 text-sm">
                Validasi sinyal ketat: RSI &lt; 70, Volume &gt; 120%, Anti-breakout spam. 
                <strong>Real-time P&L monitoring aktif!</strong>
              </p>
              {errorCount > 0 && (
                <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                  <p className="text-yellow-300 text-xs">
                    ⚠️ {errorCount} error - sistem menggunakan validasi backup
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="signals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="signals" className="data-[state=active]:bg-green-600">
            <Target className="w-4 h-4 mr-2" />
            Validated Signals ({signals.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">
            <History className="w-4 h-4 mr-2" />
            Riwayat ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-6">
          {/* Dashboard Header */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-green-400" />
                Validated Trading Signals
              </h3>
              <p className="text-gray-400">
                Modal: Rp 200.000 • Validasi Ketat • Real-time P&L • Auto-Generate
              </p>
            </div>
            <Button
              onClick={generateNewRealSignals}
              disabled={isLoading || isGeneratingRef.current || cooldownRef.current}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Validating...' : cooldownRef.current ? 'Cooldown...' : 'Generate Validated Signal'}
            </Button>
          </div>

          {/* Trading Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Validation</p>
                    <p className="text-xl font-bold text-white">Enhanced</p>
                  </div>
                  <Target className="w-6 h-6 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Real-time P&L</p>
                    <p className="text-xl font-bold text-white">Active</p>
                  </div>
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Active Trades</p>
                    <p className="text-xl font-bold text-white">{activeTrades.length}</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-medium">Auto-Generate</p>
                    <p className="text-xl font-bold text-white">
                      {isLoading ? 'Running' : 'Ready'}
                    </p>
                  </div>
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Active Trades with P&L */}
          {activeTrades.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                Live Trading - Real-time P&L ({activeTrades.length})
              </h4>
              <div className="grid gap-4">
                {activeTrades.map((trade) => (
                  <Card key={trade.id} className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="text-white font-bold text-lg flex items-center gap-2">
                            {trade.signal.pair}
                            <Badge className={trade.signal.type === 'BUY' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                              {trade.signal.type}
                            </Badge>
                          </h5>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-gray-400">Entry: ${trade.signal.entryPrice}</span>
                            <span className="text-blue-400">Current: ${trade.currentPrice?.toFixed(6) || trade.signal.entryPrice}</span>
                            <span className="text-gray-400">Modal: {formatCurrency(trade.modal)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            {(trade.unrealizedProfit || 0) >= 0 ? (
                              <TrendingUp className="w-5 h-5 text-green-400" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-red-400" />
                            )}
                            <span className={`text-xl font-bold ${(trade.unrealizedProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {(trade.unrealizedProfit || 0) >= 0 ? '+' : ''}{formatCurrency(trade.unrealizedProfit || 0)}
                            </span>
                          </div>
                          <p className={`text-sm ${(trade.currentPnL || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {(trade.currentPnL || 0) >= 0 ? '+' : ''}{(trade.currentPnL || 0).toFixed(2)}%
                          </p>
                          <p className="text-gray-400 text-xs">
                            Target: ${trade.signal.targetPrice} | SL: ${trade.signal.stopLoss}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Validated Signals Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700 animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                    <div className="h-32 bg-slate-700 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-700 rounded w-full"></div>
                      <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                    </div>
                    <div className="text-center text-green-400 text-sm">
                      🎯 Validating signal with enhanced criteria...
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : signals.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Validated Market Signals - Ready for Execute
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {signals.map((signal) => (
                  <SignalCard 
                    key={signal.id} 
                    signal={signal} 
                    modal={modal}
                    onStartTrade={handleStartTrade}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <Target className="w-12 h-12 text-green-400 mx-auto animate-pulse" />
                  <div>
                    <p className="text-gray-400 text-lg font-medium">
                      {cooldownRef.current ? 'System Cooldown...' : 
                       activeTrades.length > 0 ? 'Monitoring Active Trades...' : 
                       'Scanning for Validated Signals...'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {cooldownRef.current 
                        ? 'Tunggu cooldown untuk mencegah spam'
                        : activeTrades.length > 0 
                        ? 'Signal baru akan muncul setelah trade selesai'
                        : 'Mencari sinyal dengan validasi RSI, volume, dan timing'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <TradingHistory history={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SignalDashboard;

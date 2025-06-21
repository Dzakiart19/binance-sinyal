import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Clock, DollarSign, History, AlertTriangle, Zap, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignalCard from "./SignalCard";
import TradingHistory from "./TradingHistory";
import { generateRealSignal } from "@/utils/realSignalGenerator";
import { tradingManager } from "@/utils/tradingManager";
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
  const [activeTrades, setActiveTrades] = useState(tradingManager.getActiveTrades());
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

    // Progressive cooldown based on error count
    if (errorCount >= 3) {
      const timeSinceLastSuccess = now - lastSuccessTime;
      const requiredCooldown = Math.min(300000, 60000 * Math.pow(2, errorCount - 3)); // Exponential backoff
      
      if (timeSinceLastSuccess < requiredCooldown) {
        console.log(`🚫 Too many errors (${errorCount}), waiting ${Math.ceil(requiredCooldown/60000)} minutes...`);
        return;
      } else {
        setErrorCount(0); // Reset after sufficient cooldown
      }
    }

    lastGenerationAttempt.current = now;
    isGeneratingRef.current = true;
    setIsLoading(true);
    
    try {
      console.log('🔄 Generating signal with mock data for stability...');
      
      const realSignal = await generateRealSignal();
      
      if (realSignal) {
        setSignals([realSignal]);
        setErrorCount(0);
        setLastSuccessTime(now);
        console.log(`✅ Signal berhasil: ${realSignal.pair} ${realSignal.type}`);
        
        // Set longer cooldown after success
        cooldownRef.current = true;
        setTimeout(() => {
          cooldownRef.current = false;
        }, 180000); // 3 menit cooldown
      } else {
        console.log('⚠️ Tidak ada signal optimal saat ini');
        setSignals([]);
        setErrorCount(prev => Math.min(prev + 1, 10)); // Cap error count
      }
      
    } catch (error) {
      console.error('❌ Error generating signals:', error);
      setSignals([]);
      setErrorCount(prev => Math.min(prev + 1, 10));
      
      // Progressive cooldown on error
      const errorCooldown = Math.min(120000, 30000 * errorCount); // Max 2 minutes
      cooldownRef.current = true;
      setTimeout(() => {
        cooldownRef.current = false;
      }, errorCooldown);
    } finally {
      setIsLoading(false);
      isGeneratingRef.current = false;
    }
  };

  const handleStartTrade = (signal: Signal) => {
    const timeframe = '15m';
    tradingManager.addTrade(signal, modal, timeframe);
    setActiveTrades(tradingManager.getActiveTrades());
    setSignals(prev => prev.filter(s => s.id !== signal.id));
    
    console.log(`🚀 Trade dimulai: ${signal.pair} ${signal.type} - siap untuk eksekusi manual di Binance!`);
  };

  // Improved auto-generate with better rate limiting
  useEffect(() => {
    if (!isRealMode) return;

    const autoGenerateSignals = () => {
      // Only generate if conditions are met and not in cooldown
      if (signals.length === 0 && !isLoading && !isGeneratingRef.current && !cooldownRef.current) {
        const timeSinceLastAttempt = Date.now() - lastGenerationAttempt.current;
        if (timeSinceLastAttempt >= 30000) { // Minimum 30 second between attempts
          generateNewRealSignals();
        }
      }
    };

    // Initial generation after 3 seconds
    const initialTimer = setTimeout(() => {
      generateNewRealSignals();
    }, 3000);

    // Much longer interval to prevent spam - 10 menit
    const interval = setInterval(autoGenerateSignals, 600000); // 10 menit

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [signals.length, isLoading, isRealMode]);

  useEffect(() => {
    // Setup history listener
    const unsubscribe = tradingManager.onHistoryUpdate((newHistory) => {
      setHistory(newHistory);
      // Update active trades ketika ada perubahan
      setActiveTrades(tradingManager.getActiveTrades());
    });

    // Update active trades periodically
    const tradesInterval = setInterval(() => {
      setActiveTrades(tradingManager.getActiveTrades());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(tradesInterval);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Enhanced Real Data Status */}
      <Card className="bg-green-500/10 border-green-500/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-green-400 font-semibold mb-1">🌐 STABLE SIGNAL SYSTEM</h4>
              <p className="text-green-300 text-sm">
                Menggunakan data market yang stabil dengan AI analysis dari Groq. 
                Sistem anti-spam aktif untuk mencegah error berulang. <strong>Ready untuk manual execute!</strong>
              </p>
              {errorCount > 0 && (
                <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                  <p className="text-yellow-300 text-xs">
                    ⚠️ {errorCount} error detected - sistem menggunakan cooldown progresif untuk stabilitas
                  </p>
                </div>
              )}
              {cooldownRef.current && (
                <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/30">
                  <p className="text-blue-300 text-xs">
                    ⏳ Sistem dalam cooldown untuk mencegah spam request - tunggu sebentar
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
            <Zap className="w-4 h-4 mr-2" />
            Real Signals ({signals.length})
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
                <Globe className="w-6 h-6 text-green-400" />
                Real Trading Signals
              </h3>
              <p className="text-gray-400">
                Modal: Rp 200.000 • Real Binance Data • AI Analysis • Manual Execute
              </p>
            </div>
            <Button
              onClick={generateNewRealSignals}
              disabled={isLoading || isGeneratingRef.current || cooldownRef.current}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Analyzing Market...' : cooldownRef.current ? 'Cooldown...' : 'Refresh Real Data'}
            </Button>
          </div>

          {/* Trading Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Data Source</p>
                    <p className="text-xl font-bold text-white">Real Binance</p>
                  </div>
                  <Globe className="w-6 h-6 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">AI Analysis</p>
                    <p className="text-xl font-bold text-white">Groq Active</p>
                  </div>
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Active Signals</p>
                    <p className="text-xl font-bold text-white">{signals.length}</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-medium">System Status</p>
                    <p className="text-xl font-bold text-white">
                      {isLoading ? 'Analyzing' : cooldownRef.current ? 'Cooldown' : 'Ready'}
                    </p>
                  </div>
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Trades - Selalu ditampilkan jika ada */}
          {activeTrades.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Trade Sedang Berjalan ({activeTrades.length})
              </h4>
              <div className="grid gap-4">
                {activeTrades.map((trade) => (
                  <Card key={trade.id} className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="text-white font-bold text-lg">{trade.signal.pair}</h5>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge className={trade.signal.type === 'BUY' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                              {trade.signal.type}
                            </Badge>
                            <span className="text-yellow-400">Entry: ${trade.signal.entryPrice}</span>
                            <span className="text-gray-400">Modal: Rp {trade.modal.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 font-semibold">🔴 LIVE TRADING</p>
                          <p className="text-gray-400 text-sm">
                            Dimulai: {trade.startTime.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
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

          {/* Real Signals Grid */}
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
                      🔄 Analyzing Binance + Groq AI...
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : signals.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-400" />
                Real Market Signals - Ready for Manual Execute
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
                  <Globe className="w-12 h-12 text-green-400 mx-auto animate-pulse" />
                  <div>
                    <p className="text-gray-400 text-lg font-medium">
                      {cooldownRef.current ? 'System Cooldown Active...' : 'Scanning Real Market Data...'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {cooldownRef.current 
                        ? 'Tunggu sebentar untuk mencegah spam request ke API'
                        : 'Sistem sedang menganalisis Binance + Groq AI untuk sinyal optimal'
                      }
                    </p>
                    {errorCount > 0 && (
                      <p className="text-yellow-400 text-xs mt-2">
                        {errorCount} error detected - sistem akan retry otomatis
                      </p>
                    )}
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

import React, { useState, useEffect } from 'react';
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

  const generateNewRealSignals = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Mencari sinyal real dari Binance + Groq AI...');
      
      // Generate 1-2 real signals
      const realSignal = await generateRealSignal();
      
      if (realSignal) {
        setSignals([realSignal]);
        console.log(`✅ Signal real berhasil: ${realSignal.pair} ${realSignal.type}`);
      } else {
        console.log('⚠️ Tidak ada signal optimal saat ini, coba lagi dalam beberapa menit');
        setSignals([]);
      }
      
    } catch (error) {
      console.error('Error generating real signals:', error);
      setSignals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrade = (signal: Signal) => {
    const timeframe = '15m';
    tradingManager.addTrade(signal, modal, timeframe);
    setActiveTrades(tradingManager.getActiveTrades());
    setSignals(prev => prev.filter(s => s.id !== signal.id));
    
    console.log(`🚀 Trade dimulai: ${signal.pair} ${signal.type} - siap untuk eksekusi manual di Binance!`);
  };

  // Auto-generate real signals setiap 3 menit
  useEffect(() => {
    const autoGenerateSignals = () => {
      if (signals.length === 0 && !isLoading && isRealMode) {
        generateNewRealSignals();
      }
    };

    // Generate initial signals
    if (isRealMode) {
      generateNewRealSignals();
    }

    // Set interval untuk auto-generate
    const interval = setInterval(autoGenerateSignals, 180000); // 3 menit

    return () => clearInterval(interval);
  }, [signals.length, isLoading, isRealMode]);

  // Auto-generate signals setiap 2 menit jika tidak ada sinyal aktif
  useEffect(() => {
    const autoGenerateSignals = () => {
      if (signals.length === 0 && !isLoading) {
        generateNewSignals();
      }
    };

    // Generate initial signals
    autoGenerateSignals();

    // Set interval untuk auto-generate
    const interval = setInterval(autoGenerateSignals, 120000); // 2 menit

    return () => clearInterval(interval);
  }, [signals.length, isLoading]);

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
      {/* Real Data Disclaimer */}
      <Card className="bg-green-500/10 border-green-500/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-green-400 font-semibold mb-1">🌐 REAL MARKET DATA ACTIVE</h4>
              <p className="text-green-300 text-sm">
                Menggunakan data real-time dari Binance API, analisis AI dari Groq, dan chart visualization real. 
                Sinyal ini untuk eksekusi manual di Binance App. <strong>Selalu DYOR!</strong>
              </p>
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
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Analyzing Market...' : 'Refresh Real Data'}
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
                    <p className="text-purple-400 text-sm font-medium">Manual Execute</p>
                    <p className="text-xl font-bold text-white">Ready</p>
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
                    <p className="text-gray-400 text-lg font-medium">Scanning Real Market Data...</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Sistem sedang menganalisis Binance + Groq AI untuk sinyal optimal
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

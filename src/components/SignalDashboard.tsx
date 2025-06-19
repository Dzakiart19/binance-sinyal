
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Clock, DollarSign, History, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignalCard from "./SignalCard";
import TradingHistory from "./TradingHistory";
import { generateIdealSignal } from "@/utils/signalGenerator";
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
  const [modal] = useState(200000); // Fixed modal 200k IDR

  const generateNewSignals = async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate maksimal 2 sinyal ideal untuk modal kecil
      const newSignals = [
        generateIdealSignal(modal),
        generateIdealSignal(modal)
      ];
      
      setSignals(newSignals);
    } catch (error) {
      console.error('Error generating signals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrade = (signal: Signal) => {
    const timeframe = '15m';
    tradingManager.addTrade(signal, modal, timeframe);
    
    // Update active trades state
    setActiveTrades(tradingManager.getActiveTrades());
    
    // Remove signal from active list
    setSignals(prev => prev.filter(s => s.id !== signal.id));
  };

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
      {/* Disclaimer Warning */}
      <Card className="bg-yellow-500/10 border-yellow-500/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-yellow-400 font-semibold mb-1">⚠️ PERINGATAN: INI ADALAH SIMULASI</h4>
              <p className="text-yellow-300 text-sm">
                Dashboard ini menggunakan data simulasi, bukan data Binance nyata. Gunakan hanya untuk referensi dan pembelajaran. 
                Selalu lakukan analisis sendiri sebelum trading di Binance yang sebenarnya.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="signals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="signals" className="data-[state=active]:bg-blue-600">
            Sinyal Aktif ({signals.length})
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
              <h3 className="text-2xl font-bold text-white">Sinyal Trading Otomatis</h3>
              <p className="text-gray-400">
                Modal: Rp 200.000 • Timeframe: 15 menit • Auto-refresh setiap 2 menit
              </p>
            </div>
            <Button
              onClick={generateNewSignals}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Mencari Sinyal...' : 'Refresh Manual'}
            </Button>
          </div>

          {/* Trading Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Modal Trading</p>
                    <p className="text-xl font-bold text-white">Rp 200.000</p>
                  </div>
                  <DollarSign className="w-6 h-6 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Sinyal Tersedia</p>
                    <p className="text-xl font-bold text-white">{signals.length}</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Trade Aktif</p>
                    <p className="text-xl font-bold text-white">{activeTrades.length}</p>
                  </div>
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-medium">Status</p>
                    <p className="text-xl font-bold text-white">Auto</p>
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

          {/* Signals Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, index) => (
                <Card key={index} className="bg-slate-800/50 border-slate-700 animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                      <div className="h-32 bg-slate-700 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-700 rounded w-full"></div>
                        <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : signals.length > 0 ? (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Sinyal Siap Trading
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
                  <Clock className="w-12 h-12 text-gray-400 mx-auto animate-pulse" />
                  <div>
                    <p className="text-gray-400 text-lg font-medium">Mencari Sinyal Trading Ideal...</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Sistem akan otomatis menghasilkan sinyal baru setiap 2 menit
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

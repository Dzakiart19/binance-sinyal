
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Clock, DollarSign, History } from "lucide-react";
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
    const timeframe = '15m'; // Fixed timeframe
    tradingManager.addTrade(signal, modal, timeframe);
    
    // Remove signal from active list
    setSignals(prev => prev.filter(s => s.id !== signal.id));
  };

  useEffect(() => {
    generateNewSignals();
    
    // Setup history listener
    const unsubscribe = tradingManager.onHistoryUpdate((newHistory) => {
      setHistory(newHistory);
    });

    return unsubscribe;
  }, []);

  const activeTrades = tradingManager.getActiveTrades();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="signals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
          <TabsTrigger value="signals" className="data-[state=active]:bg-blue-600">
            Sinyal Aktif
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
              <h3 className="text-2xl font-bold text-white">Sinyal Ideal untuk Modal Kecil</h3>
              <p className="text-gray-400">
                Modal: Rp 200.000 • Timeframe: 15 menit • Risk/Reward: 1:2
              </p>
            </div>
            <Button
              onClick={generateNewSignals}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Mencari Sinyal...' : 'Refresh Sinyal'}
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
                    <p className="text-purple-400 text-sm font-medium">Timeframe</p>
                    <p className="text-xl font-bold text-white">15 Menit</p>
                  </div>
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Trades */}
          {activeTrades.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Trade Sedang Berjalan</h4>
              <div className="grid gap-4">
                {activeTrades.map((trade) => (
                  <Card key={trade.id} className="bg-yellow-500/10 border-yellow-500/20">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="text-white font-bold">{trade.signal.pair}</h5>
                          <p className="text-yellow-400">
                            {trade.signal.type} • Entry: ${trade.signal.entryPrice} • Modal: Rp {trade.modal.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-yellow-400 text-sm">Sedang Berjalan...</p>
                          <p className="text-gray-400 text-xs">
                            Dimulai: {trade.startTime.toLocaleTimeString('id-ID')} WIB
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
          ) : (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-12 text-center">
                <p className="text-gray-400 text-lg">
                  Tidak ada sinyal ideal tersedia. Klik "Refresh Sinyal" untuk mencari peluang trading terbaru.
                </p>
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

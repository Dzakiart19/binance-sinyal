
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import SignalCard from "./SignalCard";
import { generateMockSignal } from "@/utils/signalGenerator";

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
  const [isLoading, setIsLoading] = useState(false);

  const generateNewSignals = async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newSignals = [
        generateMockSignal('BTCUSDT'),
        generateMockSignal('ETHUSDT'),
        generateMockSignal('ADAUSDT'),
        generateMockSignal('SOLUSDT'),
      ];
      
      setSignals(newSignals);
    } catch (error) {
      console.error('Error generating signals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateNewSignals();
  }, []);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-white">Sinyal Terbaru</h3>
          <p className="text-gray-400">
            {signals.length} sinyal aktif • Diperbarui setiap 5 menit
          </p>
        </div>
        <Button
          onClick={generateNewSignals}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Memuat...' : 'Refresh Sinyal'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Sinyal BUY</p>
                <p className="text-2xl font-bold text-white">
                  {signals.filter(s => s.type === 'BUY').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm font-medium">Sinyal SELL</p>
                <p className="text-2xl font-bold text-white">
                  {signals.filter(s => s.type === 'SELL').length}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Total Sinyal</p>
                <p className="text-2xl font-bold text-white">{signals.length}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Signals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, index) => (
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
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-12 text-center">
            <p className="text-gray-400 text-lg">
              Tidak ada sinyal tersedia. Klik "Refresh Sinyal" untuk memuat data terbaru.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SignalDashboard;

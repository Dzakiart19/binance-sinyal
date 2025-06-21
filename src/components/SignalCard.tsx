
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Target, Shield, DollarSign, TrendingUp, Play } from "lucide-react";
import { Signal } from "./SignalDashboard";

interface SignalCardProps {
  signal: Signal;
  modal?: number;
  onStartTrade?: (signal: Signal) => void;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal, modal = 200000, onStartTrade }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(date) + ' WIB';
  };

  const getSignalColor = (type: string) => {
    return type === 'BUY' 
      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
      : 'bg-red-500/20 text-red-300 border-red-500/30';
  };

  // Target IDR yang realistis
  const targetProfitIDR = 10000; // TP2: +10k IDR
  const tp1ProfitIDR = 5000;     // TP1: +5k IDR
  const stopLossIDR = 3000;      // SL: -3k IDR

  const calculateRiskReward = () => {
    return (targetProfitIDR / stopLossIDR).toFixed(1); // 10k/3k = 3.3
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-white text-xl font-bold">
              {signal.pair}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getSignalColor(signal.type)}>
                {signal.type}
              </Badge>
              <Badge variant="outline" className="text-gray-300">
                15m
              </Badge>
              <div className="flex items-center text-gray-400 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(signal.timestamp)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Risk/Reward</p>
            <p className="text-blue-400 font-bold text-lg">
              1:{calculateRiskReward()}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chart Image with better fallback */}
        <div className="relative">
          <div className="w-full h-40 bg-slate-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className={`w-8 h-8 mx-auto mb-2 ${signal.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`} />
              <p className="text-gray-400 text-sm">Pattern: {signal.type === 'BUY' ? 'Bullish Setup' : 'Bearish Setup'}</p>
              <p className="text-gray-500 text-xs">Target IDR: TP +10k, SL -3k</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            IDR Target
          </div>
        </div>

        {/* Realistic IDR Targets */}
        <div className="bg-blue-500/10 rounded-lg p-4">
          <h4 className="text-blue-400 font-semibold text-sm mb-3">Target IDR dengan Modal {formatIDR(modal)}</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-green-400 text-xs font-medium">TP1 (2.5%)</p>
              <p className="text-green-400 font-bold">+{formatIDR(tp1ProfitIDR)}</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 text-xs font-medium">TP2 (5%)</p>
              <p className="text-green-400 font-bold">+{formatIDR(targetProfitIDR)}</p>
            </div>
            <div className="text-center">
              <p className="text-red-400 text-xs font-medium">SL (1.5%)</p>
              <p className="text-red-400 font-bold">-{formatIDR(stopLossIDR)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-500/20">
            <p className="text-center text-blue-300 text-sm">
              <strong>Target Utama: TP2 (+{formatIDR(targetProfitIDR)})</strong>
            </p>
          </div>
        </div>

        {/* Price Information */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-blue-400 mr-1" />
              <p className="text-blue-400 text-xs font-medium">Entry</p>
            </div>
            <p className="text-white font-bold text-sm">
              {formatPrice(signal.entryPrice)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-green-400 mr-1" />
              <p className="text-green-400 text-xs font-medium">Target</p>
            </div>
            <p className="text-white font-bold text-sm">
              {formatPrice(signal.targetPrice)}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Shield className="w-4 h-4 text-red-400 mr-1" />
              <p className="text-red-400 text-xs font-medium">Stop Loss</p>
            </div>
            <p className="text-white font-bold text-sm">
              {formatPrice(signal.stopLoss)}
            </p>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-slate-700/30 rounded-lg p-4">
          <h4 className="text-purple-400 font-semibold text-sm mb-2 flex items-center">
            <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
            Analisis Groq AI - IDR Targets
          </h4>
          <p className="text-gray-300 text-sm leading-relaxed">
            {signal.analysis}
          </p>
        </div>

        {/* Action Button */}
        {onStartTrade && (
          <Button 
            onClick={() => onStartTrade(signal)}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3"
          >
            <Play className="w-4 h-4 mr-2" />
            Mulai Trading - Target +{formatIDR(targetProfitIDR)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SignalCard;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Shield, DollarSign } from "lucide-react";
import { Signal } from "./SignalDashboard";

interface SignalCardProps {
  signal: Signal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
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

  const calculateProfitPotential = () => {
    const potential = signal.type === 'BUY' 
      ? ((signal.targetPrice - signal.entryPrice) / signal.entryPrice) * 100
      : ((signal.entryPrice - signal.targetPrice) / signal.entryPrice) * 100;
    return potential.toFixed(2);
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
              <div className="flex items-center text-gray-400 text-sm">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(signal.timestamp)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Potensi Profit</p>
            <p className="text-green-400 font-bold text-lg">
              +{calculateProfitPotential()}%
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chart Image */}
        <div className="relative">
          <img
            src={signal.chartUrl}
            alt={`${signal.pair} Chart`}
            className="w-full h-40 object-cover rounded-lg bg-slate-700"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23374151'/%3e%3ctext x='50' y='50' font-family='Arial' font-size='12' fill='%239CA3AF' text-anchor='middle' dy='.3em'%3eChart Loading...%3c/text%3e%3c/svg%3e";
            }}
          />
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            Live Chart
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
            Analisis Groq AI
          </h4>
          <p className="text-gray-300 text-sm leading-relaxed">
            {signal.analysis}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignalCard;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, DollarSign } from "lucide-react";

export interface HistoryRecord {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  modal: number;
  profit: number;
  percentage: number;
  timeframe: string;
  entryTime: Date;
  exitTime: Date;
  reason: string;
  status: 'TP' | 'SL';
}

interface TradingHistoryProps {
  history: HistoryRecord[];
}

const TradingHistory: React.FC<TradingHistoryProps> = ({ history }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(date) + ' WIB';
  };

  const totalProfit = history.reduce((sum, record) => sum + record.profit, 0);
  const winRate = history.length > 0 ? (history.filter(r => r.profit > 0).length / history.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white">Riwayat Trading</h3>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Total P&L</p>
            <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatPrice(totalProfit)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Win Rate</p>
            <p className="text-lg font-bold text-blue-400">{winRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">Belum ada riwayat trading. Mulai trading untuk melihat hasil di sini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <Card key={record.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <h4 className="text-white font-bold text-lg">{record.pair}</h4>
                    <Badge className={record.type === 'BUY' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                      {record.type}
                    </Badge>
                    <Badge variant="outline" className="text-gray-300">
                      {record.timeframe}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {record.profit >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`font-bold ${record.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {record.profit >= 0 ? '+' : ''}{formatPrice(record.profit)}
                      </span>
                      <span className={`text-sm ${record.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ({record.percentage >= 0 ? '+' : ''}{record.percentage.toFixed(2)}%)
                      </span>
                    </div>
                    <Badge className={record.status === 'TP' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                      {record.status === 'TP' ? 'Take Profit' : 'Stop Loss'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-400">Modal</p>
                    <p className="text-white font-semibold">{formatPrice(record.modal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Entry</p>
                    <p className="text-white font-semibold">${record.entryPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Exit</p>
                    <p className="text-white font-semibold">${record.exitPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Durasi</p>
                    <p className="text-white font-semibold">
                      {Math.round((record.exitTime.getTime() - record.entryTime.getTime()) / 60000)}m
                    </p>
                  </div>
                </div>

                <div className="bg-slate-700/30 rounded p-3">
                  <p className="text-gray-400 text-xs mb-1">Alasan {record.status}:</p>
                  <p className="text-gray-300 text-sm">{record.reason}</p>
                </div>

                <div className="flex justify-between items-center mt-3 text-xs text-gray-400">
                  <span>Masuk: {formatTime(record.entryTime)}</span>
                  <span>Keluar: {formatTime(record.exitTime)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TradingHistory;

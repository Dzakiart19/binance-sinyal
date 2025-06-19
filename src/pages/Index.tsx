
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Brain, BarChart3, AlertTriangle, Zap, Database, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SignalDashboard from "@/components/SignalDashboard";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-blue-600/20 text-blue-300 border-blue-400/30">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Trading Signals
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Sinyal Trading AI dengan{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Analisis Groq
              </span>{" "}
              & Chart Real-time
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Dapatkan sinyal trading crypto yang didukung oleh analisis AI dari Groq, lengkap dengan data pasar live dari Binance dan visualisasi chart instan langsung di dashboard Anda.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl text-lg shadow-2xl transform hover:scale-105 transition-all duration-200"
              onClick={() => document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Lihat Dashboard Sinyal
            </Button>
          </div>
        </div>
      </div>

      {/* Technology Architecture Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Didukung oleh Tiga Teknologi Terdepan
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Kombinasi sempurna antara data real-time, analisis AI, dan visualisasi canggih
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Binance API */}
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Database className="w-8 h-8 text-yellow-400" />
              </div>
              <CardTitle className="text-white text-xl">Binance API</CardTitle>
              <CardDescription className="text-yellow-200 font-semibold">
                Sumber Data Pasar Real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center leading-relaxed">
                Menyediakan data harga, volume, dan pergerakan pasar crypto terbaru secara akurat dan tanpa jeda. Ini adalah fondasi dari semua analisis kami.
              </p>
            </CardContent>
          </Card>

          {/* Groq API */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <CardTitle className="text-white text-xl">Groq API</CardTitle>
              <CardDescription className="text-purple-200 font-semibold">
                Mesin Analisis & Narasi Pasar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center leading-relaxed">
                Otak di balik setiap sinyal. Data dari Binance dikirim ke Groq untuk dianalisis dan memberikan justifikasi naratif yang mudah dipahami.
              </p>
            </CardContent>
          </Card>

          {/* Chart-img API */}
          <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/20 hover:border-green-400/40 transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
              <CardTitle className="text-white text-xl">Chart-img.com API</CardTitle>
              <CardDescription className="text-green-200 font-semibold">
                Visualisasi Chart Instan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-center leading-relaxed">
                Setiap sinyal dilengkapi dengan gambar chart yang relevan. Memungkinkan Anda memvalidasi sinyal secara visual dalam hitungan detik.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dashboard Section */}
      <div id="dashboard" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Dashboard Sinyal Real-time Anda
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Semua informasi yang Anda butuhkan ada di satu tempat. Setiap kartu sinyal dirancang untuk memberikan wawasan lengkap secara sekilas.
          </p>
        </div>

        <SignalDashboard />
      </div>

      {/* Risk Warning */}
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center text-red-300 text-xl">
              <AlertTriangle className="w-6 h-6 mr-2" />
              ⚠️ Peringatan Penting Mengenai Risiko
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 leading-relaxed">
              Sinyal yang dihasilkan adalah output dari analisis AI dan disediakan untuk tujuan informasi dan edukasi. Trading cryptocurrency memiliki risiko finansial yang tinggi. Kinerja masa lalu tidak menjamin hasil di masa depan. Selalu lakukan riset Anda sendiri (DYOR) dan jangan pernah berinvestasi dengan dana yang tidak siap Anda tanggung kerugiannya.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex justify-center space-x-8 mb-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Dokumentasi API</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Tentang Kami</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Disclaimer</a>
            </div>
            <p className="text-gray-500">
              © 2024 AI Signal Dashboard. Didukung oleh Binance, Groq, dan Chart-img.com.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Brain, BarChart3, Zap, ArrowRight } from "lucide-react";

const SystemWorkflow = () => {
  const steps = [
    {
      number: 1,
      title: "Ambil Data",
      description: "Secara periodik (setiap 5 menit), sistem mengambil data pasar terbaru (harga, volume) untuk beberapa pasangan crypto dari Binance API.",
      icon: Database,
      color: "text-yellow-400 bg-yellow-500/20"
    },
    {
      number: 2,
      title: "Kirim untuk Analisis",
      description: "Data yang relevan diformat dan dikirim ke Groq API dengan prompt spesifik untuk menentukan sinyal BUY atau SELL yang kuat.",
      icon: Brain,
      color: "text-purple-400 bg-purple-500/20"
    },
    {
      number: 3,
      title: "Proses Hasil Analisis",
      description: "Sistem menerima respons dari Groq dan mengekstrak jenis sinyal (Beli/Jual) beserta justifikasinya.",
      icon: Zap,
      color: "text-blue-400 bg-blue-500/20"
    },
    {
      number: 4,
      title: "Buat Visualisasi Chart",
      description: "Menggunakan data harga dari Binance, sistem membuat URL API untuk chart-img.com untuk menghasilkan gambar chart yang sesuai.",
      icon: BarChart3,
      color: "text-green-400 bg-green-500/20"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">
          Bagaimana Sinyal Dihasilkan
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Proses otomatis yang menggabungkan data real-time, analisis AI, dan visualisasi chart
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <div key={step.number} className="relative">
            <div className="flex items-start gap-6 mb-8">
              {/* Step Number & Icon */}
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full ${step.color} flex items-center justify-center mb-2`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <Badge variant="outline" className="text-white border-gray-600">
                  Step {step.number}
                </Badge>
              </div>

              {/* Content */}
              <Card className="flex-1 bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-xl">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Arrow between steps */}
            {index < steps.length - 1 && (
              <div className="flex justify-center mb-8">
                <ArrowRight className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>
        ))}

        {/* Final Result */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Hasil: Kartu Sinyal Lengkap
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                Semua elemen (data sinyal, justifikasi Groq, dan URL chart) digabungkan dan ditampilkan sebagai "Kartu Sinyal" baru di dashboard website Anda.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SystemWorkflow;

import React from 'react';
import { SplitBillMock } from './SplitBillMock';

export const Hero: React.FC = () => {
  return (
    <section className="pt-8 pb-14 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left / Hero Content */}
          <div className="lg:col-span-7 text-left space-y-5 sm:space-y-6">
            {/* Pill */}
            <div className="inline-block">
              <span className="bg-lime text-ink font-bold text-xs sm:text-sm px-3.5 py-1.5 rounded-full tracking-wide inline-flex items-center">
                Split Bill, Group Wallet, Catatan Keuangan
              </span>
            </div>

            {/* H1 */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight leading-[1.15]">
              Patungan tanpa ribet. Uang bareng tanpa drama.
            </h1>

            {/* Paragraph */}
            <p className="text-ink-muted text-base sm:text-lg leading-relaxed max-w-xl">
              Foto struk, pilih siapa makan apa, dan BillMate menghitung bagian masing-masing. Satu tempat untuk keuangan pribadi dan bersama.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
              <a
                href="#mulai"
                className="min-h-[48px] inline-flex items-center justify-center bg-lime hover:bg-lime-hover text-ink font-bold text-base px-6 py-3.5 rounded-xl shadow-sm transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-ink"
              >
                Coba Split Bill Gratis
              </a>
              <a
                href="#cara"
                className="min-h-[48px] inline-flex items-center justify-center border-2 border-ink text-ink font-bold text-base px-6 py-3.5 rounded-xl hover:bg-ink hover:text-white transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-ink"
              >
                Lihat cara kerja
              </a>
            </div>

            {/* Note */}
            <p className="text-xs sm:text-sm text-ink-muted pt-1">
              Tanpa daftar untuk mencoba. Gratis untuk paket dasar.
            </p>
          </div>

          {/* Right / SplitBillMock */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <SplitBillMock />
          </div>

        </div>
      </div>
    </section>
  );
};


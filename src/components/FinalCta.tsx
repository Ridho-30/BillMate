import React from 'react';

interface FinalCtaProps {
  onActionClick?: () => void;
}

export const FinalCta: React.FC<FinalCtaProps> = ({ onActionClick }) => {
  return (
    <section id="mulai" className="bg-dark text-white py-16 sm:py-20 lg:py-24 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-3 sm:mb-4">
          Siap patungan tanpa drama?
        </h2>
        <p className="text-dark-text/80 text-base sm:text-lg leading-relaxed max-w-md mx-auto mb-8">
          Coba Split Bill sekarang, tanpa perlu daftar.
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onActionClick}
            className="min-h-[48px] inline-flex items-center justify-center bg-lime hover:bg-lime-hover text-ink font-bold text-base px-8 py-3.5 rounded-xl shadow-lg transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-lime"
          >
            Coba Split Bill Gratis
          </button>
        </div>
      </div>
    </section>
  );
};


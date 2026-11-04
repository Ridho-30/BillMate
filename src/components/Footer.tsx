import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-line py-10 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Attribution */}
        <p className="text-ink-muted text-xs sm:text-sm font-medium">
          BillMate. Proyek Model Bisnis Digital, Kelompok 5.
        </p>

        {/* Placeholder Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-ink-muted">
          <a
            href="#privasi"
            onClick={(e) => e.preventDefault()}
            className="hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-ink rounded py-1"
          >
            Kebijakan Privasi
          </a>
          <a
            href="#syarat"
            onClick={(e) => e.preventDefault()}
            className="hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-ink rounded py-1"
          >
            Syarat Layanan
          </a>
          <a
            href="#kontak"
            onClick={(e) => e.preventDefault()}
            className="hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-ink rounded py-1"
          >
            Kontak
          </a>
        </div>
      </div>
    </footer>
  );
};


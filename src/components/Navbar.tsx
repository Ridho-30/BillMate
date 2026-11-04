import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

interface NavbarProps {
  onLoginClick?: () => void;
  isSplitBillPage?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLoginClick,
  isSplitBillPage = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center focus-visible:ring-2 focus-visible:ring-ink rounded-lg py-1"
          aria-label="BillMate Home"
        >
          <Logo />
        </Link>

        <nav
          className="hidden md:flex items-center gap-8 font-medium text-ink"
          aria-label="Menu Utama"
        >
          <Link to="/#fitur" className="text-ink hover:text-ink-muted transition-colors py-2 px-1 rounded">
            Fitur
          </Link>
          <Link to="/#cara" className="text-ink hover:text-ink-muted transition-colors py-2 px-1 rounded">
            Cara kerja
          </Link>
          <Link to="/#harga" className="text-ink hover:text-ink-muted transition-colors py-2 px-1 rounded">
            Harga
          </Link>
        </nav>

        <div>
          {isSplitBillPage ? (
            <Link
              to="/"
              className="min-h-[44px] inline-flex items-center px-5 py-2 rounded-xl border-2 border-ink text-ink font-bold text-sm tracking-wide hover:bg-ink hover:text-white transition-all duration-200"
            >
              Kembali
            </Link>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="min-h-[44px] min-w-[44px] px-5 py-2 rounded-xl border-2 border-ink text-ink font-bold text-sm tracking-wide hover:bg-ink hover:text-white transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-ink"
            >
              Masuk
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
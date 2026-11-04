import React from 'react';

interface StickyCtaProps {
  onActionClick?: () => void;
}

export const StickyCta: React.FC<StickyCtaProps> = ({ onActionClick }) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-line px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      role="region"
      aria-label="Aksi Cepat"
    >
      <a
        href="#mulai"
        onClick={(e) => {
          if (onActionClick) {
            e.preventDefault();
            onActionClick();
          }
        }}
        className="w-full min-h-[48px] bg-lime hover:bg-lime-hover text-ink font-bold text-base py-3 px-4 rounded-xl flex items-center justify-center shadow-sm transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-ink"
      >
        Coba Split Bill Gratis
      </a>
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Sparkles } from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
}

export const WaitlistModal: React.FC<WaitlistModalProps> = ({
  isOpen,
  onClose,
  planName = 'Pro',
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setEmail('');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Masukkan alamat email kamu');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid');
      return;
    }

    setError('');
    setIsSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-line relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-ink flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-ink"
          aria-label="Tutup modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-lime text-ink text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Waitlist
              </span>
              <span className="text-xs font-semibold text-ink-muted">
                Paket {planName}
              </span>
            </div>

            <h3 id="waitlist-title" className="text-2xl font-extrabold text-ink tracking-tight mb-2">
              Join Waitlist BillMate
            </h3>
            
            <p className="text-ink-muted text-sm leading-relaxed mb-6">
              Daftarkan email kamu untuk mendapatkan akses awal ke fitur lengkap BillMate dan penawaran spesial peluncuran.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="waitlist-email" className="block text-xs font-bold text-ink mb-1.5">
                  Email kamu
                </label>
                <input
                  id="waitlist-email"
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="nama@email.com"
                  className={`w-full min-h-[44px] px-4 py-3 rounded-xl border text-sm text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
                    error ? 'border-red-500 focus:ring-red-500' : 'border-line focus:ring-ink'
                  }`}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'waitlist-error' : undefined}
                />
                {error && (
                  <p id="waitlist-error" className="text-red-600 text-xs mt-1.5 font-medium">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] bg-lime hover:bg-lime-hover text-ink font-bold text-sm py-3.5 px-4 rounded-xl transition-all duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-ink"
              >
                Gabung Sekarang
              </button>
            </form>
          </div>
        ) : (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 bg-lime/20 text-ink rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-[#5C8E11]" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-ink tracking-tight mb-1">
                Terima kasih!
              </h3>
              <p className="text-ink-muted text-sm leading-relaxed">
                Email <strong className="text-ink">{email}</strong> telah terdaftar. Kami akan mengabarimu segera setelah paket <strong className="text-ink">{planName}</strong> siap dicoba!
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-6 py-2.5 rounded-xl border-2 border-ink text-ink font-bold text-sm hover:bg-ink hover:text-white transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


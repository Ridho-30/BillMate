import { useRef, useEffect } from 'react';
import { Camera, Lock, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserQuota } from '../lib/supabase';

type ReceiptScanButtonProps = {
  quota: UserQuota;
  isProcessing: boolean;
  onFileSelect: (file: File) => void;
};

export function ReceiptScanButton({
  quota,
  isProcessing,
  onFileSelect,
}: ReceiptScanButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dengarkan event dari tombol floating scan di navbar mobile atau query parameter
  useEffect(() => {
    const handleOpenScan = () => {
      fileInputRef.current?.click();
    };

    window.addEventListener('billmate:open-scan', handleOpenScan);

    if (window.location.search.includes('scan=1')) {
      fileInputRef.current?.click();
    }

    return () => {
      window.removeEventListener('billmate:open-scan', handleOpenScan);
    };
  }, []);

  const handleButtonClick = () => {
    if (isProcessing) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input agar user bisa memilih file yang sama jika ingin mencoba ulang
      e.target.value = '';
    }
  };

  // 1. Kondisi jika Pengguna adalah Tamu (Guest di /coba)
  if (quota.isGuest) {
    return (
      <div className="rounded-2xl border border-line bg-gray-50/80 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-200 text-ink">
              <Camera size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink text-sm sm:text-base">Auto Scan Struk (AI)</span>
                <span className="rounded-md bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">Tamu</span>
              </div>
              <p className="mt-0.5 text-xs text-ink-muted">
                Scan struk otomatis hanya tersedia untuk pengguna terdaftar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-line bg-white px-4 py-2 text-xs font-bold text-ink transition hover:bg-gray-100"
            >
              Masuk
            </Link>
            <Link
              to="/register"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-lime px-4 py-2 text-xs font-bold text-ink transition hover:bg-lime-hover"
            >
              Daftar Gratis
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Kondisi jika Pengguna Paket Free
  if (quota.plan === 'free') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900">
              <Lock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-ink text-sm sm:text-base">Auto Scan Struk</span>
                <span className="rounded-md bg-amber-200/70 px-2 py-0.5 text-[11px] font-semibold text-amber-900">Plus & Pro</span>
              </div>
              <p className="mt-0.5 text-xs text-amber-900/80">
                Fitur auto scan tidak tersedia untuk paket Free. Upgrade untuk menikmati 10 scan/bulan.
              </p>
            </div>
          </div>

          <Link
            to="/upgrade"
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-dark px-4 py-2 text-xs font-bold text-white transition hover:bg-ink-muted"
          >
            <span>Upgrade ke /upgrade</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Kondisi jika Kuota Habis (Plus/Pro)
  const isOutOfQuota = quota.remaining <= 0;

  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-sm transition hover:border-lime">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime/40 text-ink">
              <Sparkles size={16} />
            </div>
            <h3 className="font-bold text-ink text-sm sm:text-base">Auto Scan Struk</h3>
            <span className="rounded-full bg-lime/20 px-2.5 py-0.5 text-[11px] font-semibold text-ink uppercase">
              {quota.plan}
            </span>
          </div>

          <p className="text-xs text-ink-muted">
            {isOutOfQuota ? (
              <span className="text-red-600 font-semibold flex items-center gap-1 mt-1">
                <AlertCircle size={13} />
                Kuota scan bulan ini telah habis ({quota.used}/{quota.total}).
              </span>
            ) : (
              <span>
                Sisa kuota: <strong className="text-ink font-semibold">{quota.remaining} dari {quota.total} scan</strong> bulan ini.
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOutOfQuota ? (
            <Link
              to="/upgrade"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-dark px-5 py-2.5 text-xs font-bold text-white transition hover:bg-ink-muted"
            >
              <span>Upgrade Kuota</span>
              <ArrowUpRight size={14} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={isProcessing}
              className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition shadow-sm ${isProcessing
                ? 'bg-gray-100 text-ink-muted/50 cursor-not-allowed'
                : 'bg-lime text-ink hover:bg-lime-hover active:scale-95'
                }`}
            >
              <Camera size={18} />
              <span>{isProcessing ? 'Memproses...' : 'Scan Struk'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Teks Pemberitahuan Privasi */}
      <div className="mt-3.5 pt-3 border-t border-line/60">
        <p className="text-[11px] leading-relaxed text-ink-muted/80 flex items-start gap-1.5">
          <span className="shrink-0 text-sm">🔒</span>
          <span>
            Foto dibaca langsung di perangkatmu. Agar hasil pembacaan akurat, pastikan foto terlihat jelas, terang, dan tidak blur.
          </span>
        </p>
      </div>
    </div>
  );
}

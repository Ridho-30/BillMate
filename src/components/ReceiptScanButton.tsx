import { useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Lock, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { UserQuota } from '../lib/supabase';

type ReceiptScanButtonProps = {
  quota: UserQuota;
  isProcessing: boolean;
  onFileSelect: (file: File) => void;
};

/**
 * Komponen tombol scan struk di halaman Split Bill.
 * Menyediakan dua opsi: Kamera (via label+input capture) dan Galeri (via label+input biasa).
 * Menggunakan teknik <label htmlFor> agar tidak diblokir browser mobile.
 */
export function ReceiptScanButton({
  quota,
  isProcessing,
  onFileSelect,
}: ReceiptScanButtonProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Listener event custom dari navbar modal (bila sudah di halaman /split-bill)
  useEffect(() => {
    const handleOpenScan = () => {
      galleryInputRef.current?.click();
    };
    window.addEventListener('billmate:open-scan', handleOpenScan);
    return () => window.removeEventListener('billmate:open-scan', handleOpenScan);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = '';
    }
  };

  // 1. Tamu
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

  // 2. Paket Free
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
                <span className="rounded-md bg-amber-200/70 px-2 py-0.5 text-[11px] font-semibold text-amber-900">Plus &amp; Pro</span>
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
            <span>Upgrade Sekarang</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Plus / Pro — tampilkan tombol kamera + galeri
  const isOutOfQuota = quota.remaining <= 0;

  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-sm transition hover:border-lime">

      {/* Hidden inputs — menggunakan teknik label+id agar kompatibel mobile */}
      <input
        ref={cameraInputRef}
        id="splitbill-scan-camera"
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        id="splitbill-scan-gallery"
        type="file"
        accept="image/*"
        className="sr-only"
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

        {/* Tombol aksi */}
        <div className="flex items-center gap-2 shrink-0">
          {isOutOfQuota ? (
            <Link
              to="/upgrade"
              className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-dark px-5 py-2.5 text-xs font-bold text-white transition hover:bg-ink-muted"
            >
              <span>Upgrade Kuota</span>
              <ArrowUpRight size={14} />
            </Link>
          ) : isProcessing ? (
            <div className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold bg-gray-100 text-ink-muted/50 cursor-not-allowed">
              <Camera size={18} />
              <span>Memproses...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Tombol Kamera */}
              <label
                htmlFor="splitbill-scan-camera"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold bg-lime text-ink hover:bg-lime-hover active:scale-95 transition shadow-sm cursor-pointer select-none"
                title="Ambil foto dengan kamera"
              >
                <Camera size={18} />
                <span>Kamera</span>
              </label>

              {/* Tombol Galeri */}
              <label
                htmlFor="splitbill-scan-gallery"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold border border-line bg-white text-ink hover:bg-gray-50 active:scale-95 transition shadow-sm cursor-pointer select-none"
                title="Pilih dari galeri foto"
              >
                <ImageIcon size={18} />
                <span>Galeri</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Privasi */}
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

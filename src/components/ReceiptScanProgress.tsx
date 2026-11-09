import { Loader2, AlertTriangle, AlertCircle, RefreshCw, Edit3, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export type ScanStatus = 'idle' | 'compressing' | 'ocr' | 'ai' | 'success' | 'error';

type ReceiptScanProgressProps = {
  status: ScanStatus;
  ocrProgress: number; // 0 - 100
  errorMessage: string | null;
  hasMismatch: boolean;
  onRetry: () => void;
  onManual: () => void;
  onDismissWarning?: () => void;
};

export function ReceiptScanProgress({
  status,
  ocrProgress,
  errorMessage,
  hasMismatch,
  onRetry,
  onManual,
  onDismissWarning,
}: ReceiptScanProgressProps) {
  if (status === 'idle') return null;

  // 1. Status Sedang Memproses (Kompresi, Tesseract OCR, atau AI Parsing)
  if (status === 'compressing' || status === 'ocr' || status === 'ai') {
    const isOcr = status === 'ocr';
    const isAi = status === 'ai';

    return (
      <div className="rounded-2xl border border-lime/60 bg-lime-tint/50 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
            <Loader2 className="animate-spin" size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-ink text-sm sm:text-base">
                {status === 'compressing' && 'Mengoptimalkan foto di perangkat...'}
                {isOcr && `Membaca foto... (${ocrProgress}%)`}
                {isAi && 'Menyusun item dengan AI...'}
              </h4>
              {isOcr && (
                <span className="text-xs font-semibold text-ink-muted">
                  {ocrProgress}%
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-ink-muted truncate">
              {status === 'compressing' && 'Memastikan foto ringan dan jelas sebelum diproses.'}
              {isOcr && 'Tesseract.js sedang mengenali tulisan pada struk belanja Anda.'}
              {isAi && 'Mengidentifikasi nama pesanan, harga, pajak, dan total struk.'}
            </p>
          </div>
        </div>

        {/* Progress Bar Visual */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-line/80">
          <div
            className="h-full rounded-full bg-lime transition-all duration-300"
            style={{
              width: status === 'compressing'
                ? '15%'
                : isOcr
                  ? `${Math.max(20, ocrProgress)}%`
                  : '90%',
            }}
          />
        </div>
      </div>
    );
  }

  // 2. Status Terjadi Kesalahan (Error)
  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-red-900 text-sm sm:text-base">
              Gagal Memproses Struk
            </h4>
            <p className="mt-1 text-xs text-red-700 leading-relaxed">
              {errorMessage || 'Terjadi kendala saat membaca struk belanja. Periksa kualitas foto atau koneksi Anda.'}
            </p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              {errorMessage && (errorMessage.toLowerCase().includes('kuota') || errorMessage.toLowerCase().includes('habis')) && (
                <Link
                  to="/upgrade"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-dark px-4 py-2 text-xs font-bold text-white transition hover:bg-ink-muted active:scale-95"
                >
                  <span>Upgrade Paket</span>
                  <ArrowUpRight size={14} />
                </Link>
              )}

              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 active:scale-95"
              >
                <RefreshCw size={14} />
                <span>Coba Lagi</span>
              </button>

              <button
                type="button"
                onClick={onManual}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-800 transition hover:bg-red-50 active:scale-95"
              >
                <Edit3 size={14} />
                <span>Isi Manual</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Status Sukses dengan Peringatan Ketidakcocokan Total (Yellow Warning)
  if (status === 'success' && hasMismatch) {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 sm:p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
            <AlertTriangle size={20} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-amber-950 text-sm sm:text-base">
              Validasi dulu hasil scan kamu.
            </h4>
            <p className="mt-1 text-xs text-amber-900/90 leading-relaxed">
              Cek item, diskon, dan pajak di bawah sebelum lanjut menyimpan.
            </p>

            {onDismissWarning && (
              <button
                type="button"
                onClick={onDismissWarning}
                className="mt-3 text-xs font-bold text-amber-900 underline underline-offset-2 hover:text-amber-950"
              >
                Yakin, Simpan Sekarang
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. Status Sukses Sempurna
  if (status === 'success' && !hasMismatch) {
    return (
      <div className="rounded-2xl border border-line bg-lime-tint/40 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime text-ink">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h4 className="font-bold text-ink text-sm">
              Struk Berhasil Diuraikan!
            </h4>
            <p className="text-xs text-ink-muted">
              Item telah dimasukkan ke dalam form. Silakan sesuaikan pembagian anggota untuk tiap item.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}


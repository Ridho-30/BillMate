import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Image as ImageIcon,
  Plus,
  X,
} from 'lucide-react';

type ScanReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ScanReceiptModal({ isOpen, onClose }: ScanReceiptModalProps) {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Tutup modal slider
      onClose();

      // 2. Simpan file di memori global untuk eksekusi instan di Split Bill
      (window as any).__billmatePendingScanFile = file;

      // 3. Kirim event jika Split Bill sudah aktif di halaman
      window.dispatchEvent(
        new CustomEvent('billmate:process-scan-file', { detail: file })
      );

      // 4. Navigasi otomatis ke Split Bill (bila belum berada di Split Bill)
      navigate('/split-bill', {
        state: {
          pendingScanFile: file,
          scanTimestamp: Date.now(),
        },
      });

      // Reset value agar pengguna bisa memilih file yang sama lagi bila diinginkan
      e.target.value = '';
    }
  };

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      // Hanya set capture="environment" di perangkat mobile fisik yang memiliki kamera belakang
      const isMobileDevice =
        typeof navigator !== 'undefined' &&
        /android|iphone|ipad|ipod/i.test(navigator.userAgent);

      if (isMobileDevice) {
        cameraInputRef.current.setAttribute('capture', 'environment');
      } else {
        cameraInputRef.current.removeAttribute('capture');
      }

      cameraInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.removeAttribute('capture');
      galleryInputRef.current.click();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* File inputs yang tidak diblokir oleh browser security (sr-only) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        className="sr-only opacity-0 absolute w-0 h-0 pointer-events-none"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only opacity-0 absolute w-0 h-0 pointer-events-none"
        onChange={handleFileChange}
      />

      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div>
            <h3 className="text-lg font-extrabold text-ink">Auto Scan Struk</h3>
            <p className="text-xs text-ink-muted">Pindai struk untuk mengisi Split Bill otomatis</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-ink-muted hover:text-ink transition cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pilihan Sumber Foto & Manual */}
        <div className="py-4 space-y-3">
          {/* Opsi 1: Ambil dari Kamera */}
          <button
            type="button"
            onClick={handleCameraClick}
            className="w-full min-h-[58px] flex items-center gap-4 rounded-2xl border-2 border-line hover:border-lime bg-white p-4 text-left transition hover:bg-lime-tint/30 active:scale-[0.99] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-lime flex items-center justify-center text-ink shrink-0 shadow-sm">
              <Camera size={22} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-ink text-sm">Ambil Foto dengan Kamera</h4>
              <p className="text-xs text-ink-muted">Buka kamera HP dan potret struk fisik secara langsung</p>
            </div>
          </button>

          {/* Opsi 2: Ambil dari Galeri */}
          <button
            type="button"
            onClick={handleGalleryClick}
            className="w-full min-h-[58px] flex items-center gap-4 rounded-2xl border-2 border-line hover:border-lime bg-white p-4 text-left transition hover:bg-lime-tint/30 active:scale-[0.99] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-lime/30 flex items-center justify-center text-ink shrink-0">
              <ImageIcon size={22} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-ink text-sm">Pilih dari Galeri Foto</h4>
              <p className="text-xs text-ink-muted">Pilih foto atau tangkapan layar struk dari penyimpanan</p>
            </div>
          </button>

          {/* Opsi 3: Tambah Manual dan Masuk ke Split Bill */}
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/split-bill');
            }}
            className="w-full min-h-[58px] flex items-center gap-4 rounded-2xl border-2 border-line hover:border-lime bg-white p-4 text-left transition hover:bg-lime-tint/30 active:scale-[0.99] cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-ink shrink-0">
              <Plus size={22} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-ink text-sm">Tambah Manual</h4>
              <p className="text-xs text-ink-muted">Buka form Split Bill dan masukkan rincian pesanan secara manual</p>
            </div>
          </button>

          {/* Privasi */}
          <p className="text-[11px] text-ink-muted/80 text-center pt-2 leading-relaxed">
            🔒 Foto diproses di perangkatmu, aman & tanpa disimpan di server.
          </p>
        </div>
      </div>
    </div>
  );
}

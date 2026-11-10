import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Image as ImageIcon, Plus, X } from 'lucide-react';

type ScanReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Bottom-sheet modal untuk memilih sumber scan struk.
 *
 * Strategi file input yang kompatibel dengan browser mobile (iOS/Android Chrome):
 * - Setiap opsi adalah <label htmlFor="..."> yang langsung mewrap <input type="file">
 * - Teknik ini tidak memerlukan .click() programatik — browser menghormati interaksi
 *   pengguna secara langsung, sehingga tidak diblokir kebijakan user-activation.
 * - capture="environment" hanya di-set di input kamera untuk membuka kamera belakang HP.
 */
export function ScanReceiptModal({ isOpen, onClose }: ScanReceiptModalProps) {
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = (file: File) => {
    // 1. Tutup modal
    onClose();

    // 2. Simpan file di slot memori global agar Split Bill bisa mengambilnya
    (window as any).__billmatePendingScanFile = file;

    // 3. Dispatch event bila Split Bill sudah aktif di halaman (tidak reload)
    window.dispatchEvent(new CustomEvent('billmate:process-scan-file', { detail: file }));

    // 4. Navigasi ke Split Bill; state sebagai fallback bila event terlewat
    navigate('/split-bill', {
      state: { scanTimestamp: Date.now() },
      replace: false,
    });
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
      e.target.value = '';
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div>
            <h3 className="text-lg font-extrabold text-ink">Auto Scan Struk</h3>
            <p className="text-xs text-ink-muted">Pindai struk untuk mengisi Split Bill otomatis</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-ink-muted hover:text-ink transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-4 space-y-3">

          {/* Opsi 1: Kamera — menggunakan <label> langsung sebagai trigger input file */}
          <label
            htmlFor="scan-modal-camera"
            className="w-full min-h-[58px] flex items-center gap-4 rounded-2xl border-2 border-line hover:border-lime bg-white p-4 text-left transition hover:bg-lime-tint/30 active:scale-[0.99] cursor-pointer select-none"
          >
            {/* Input kamera dengan capture="environment" untuk buka kamera belakang di HP */}
            <input
              ref={cameraInputRef}
              id="scan-modal-camera"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handleCameraChange}
            />
            <div className="w-12 h-12 rounded-xl bg-lime flex items-center justify-center text-ink shrink-0 shadow-sm pointer-events-none">
              <Camera size={22} />
            </div>
            <div className="flex-1 pointer-events-none">
              <h4 className="font-bold text-ink text-sm">Ambil Foto dengan Kamera</h4>
              <p className="text-xs text-ink-muted">Buka kamera HP dan potret struk fisik secara langsung</p>
            </div>
          </label>

          {/* Opsi 2: Galeri — tanpa capture agar membuka file picker */}
          <label
            htmlFor="scan-modal-gallery"
            className="w-full min-h-[58px] flex items-center gap-4 rounded-2xl border-2 border-line hover:border-lime bg-white p-4 text-left transition hover:bg-lime-tint/30 active:scale-[0.99] cursor-pointer select-none"
          >
            <input
              ref={galleryInputRef}
              id="scan-modal-gallery"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleGalleryChange}
            />
            <div className="w-12 h-12 rounded-xl bg-lime/30 flex items-center justify-center text-ink shrink-0 pointer-events-none">
              <ImageIcon size={22} />
            </div>
            <div className="flex-1 pointer-events-none">
              <h4 className="font-bold text-ink text-sm">Pilih dari Galeri Foto</h4>
              <p className="text-xs text-ink-muted">Pilih foto atau tangkapan layar struk dari penyimpanan</p>
            </div>
          </label>

          {/* Opsi 3: Manual */}
          <button
            type="button"
            onClick={() => { onClose(); navigate('/split-bill'); }}
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

          <p className="text-[11px] text-ink-muted/80 text-center pt-2 leading-relaxed">
            🔒 Foto diproses di perangkatmu, aman & tanpa disimpan di server.
          </p>
        </div>
      </div>
    </div>
  );
}

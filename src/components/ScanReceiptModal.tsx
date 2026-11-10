import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Image as ImageIcon,
  Plus,
  X,
  RefreshCw,
  SwitchCamera,
  AlertCircle,
} from 'lucide-react';

type ScanReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Modal Auto Scan Struk dengan dukungan Kamera Langsung di Dalam Browser (Live Viewfinder)
 * dan Galeri Foto.
 *
 * Keunggulan Kamera Langsung (getUserMedia):
 * - Tidak memicu perpindahan ke aplikasi kamera eksternal bawaan HP
 * - Menghindari bug Low Memory Killer (LMK) di Android/MIUI yang sering mematikan Chrome
 *   dan menyebabkan tab reload / 404 "Page doesn't exist" saat foto disetujui.
 * - Pengguna melihat viewfinder secara real-time dan menjepret langsung di dalam web.
 */
export function ScanReceiptModal({ isOpen, onClose }: ScanReceiptModalProps) {
  const navigate = useNavigate();

  // Mode: 'menu' (pilihan sumber) atau 'camera' (viewfinder live)
  const [mode, setMode] = useState<'menu' | 'camera'>('menu');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fallbackCameraInputRef = useRef<HTMLInputElement>(null);

  // Bersihkan stream kamera saat modal ditutup / unmount
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setMode('menu');
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Handle proses pengiriman file ke Split Bill
  const handleFileSelected = (file: File) => {
    stopCamera();
    onClose();

    // 1. Simpan file di slot global untuk akses instan di Split Bill
    (window as any).__billmatePendingScanFile = file;

    // 2. Dispatch custom event jika halaman /split-bill sudah aktif
    window.dispatchEvent(
      new CustomEvent('billmate:process-scan-file', { detail: file })
    );

    // 3. Navigasi ke /split-bill (bila pengguna berada di halaman lain)
    navigate('/split-bill', {
      state: { scanTimestamp: Date.now() },
      replace: false,
    });
  };

  // Mulai streaming kamera langsung di browser
  const startCameraStream = async (desiredFacing: 'environment' | 'user') => {
    stopCamera();
    setCameraLoading(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser ini tidak mendukung akses kamera langsung. Silakan pilih dari galeri atau file.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: desiredFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Gagal akses kamera langsung:', err);
      setCameraLoading(false);

      // Jika kamera belakang tidak bisa diakses, coba kamera apa saja yang tersedia
      if (desiredFacing === 'environment') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          streamRef.current = fallbackStream;
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            await videoRef.current.play();
          }
          return;
        } catch {
          // Abaikan, lanjut ke pesan error
        }
      }

      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Berikan izin kamera di browser Anda atau gunakan opsi Galeri Foto.'
          : 'Kamera tidak dapat diakses langsung. Anda dapat memilih foto dari galeri/penyimpanan.'
      );
    }
  };

  const handleOpenLiveCamera = () => {
    setMode('camera');
    startCameraStream(facingMode);
  };

  const handleSwitchCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCameraStream(nextFacing);
  };

  // Jepret foto dari video stream live
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `struk-kamera-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          handleFileSelected(file);
        }
      },
      'image/jpeg',
      0.85
    );
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
      onClick={() => {
        stopCamera();
        onClose();
      }}
    >
      {/* File input untuk galeri (tanpa capture agar tidak memicu reload LMK) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleGalleryChange}
      />

      {/* Fallback input jika user memilih via file dialog */}
      <input
        ref={fallbackCameraInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleGalleryChange}
      />

      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl transition-all overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TAMPILAN 1: LIVE VIEWFINDER KAMERA */}
        {mode === 'camera' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-lime flex items-center justify-center text-ink font-bold">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Foto Struk Belanja</h3>
                  <p className="text-xs text-ink-muted">Arahkan kamera ke struk fisik</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setMode('menu');
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-ink hover:bg-gray-200 transition cursor-pointer"
                aria-label="Kembali ke menu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Area Video Viewfinder */}
            <div className="relative w-full h-80 bg-black rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Garis Panduan Bingkai Struk */}
              <div className="absolute inset-5 border-2 border-lime/80 rounded-xl pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-lime" />
                  <span className="w-4 h-4 border-t-2 border-r-2 border-lime" />
                </div>
                <p className="text-center text-[11px] font-semibold text-white/90 drop-shadow-md bg-black/40 py-1 px-2 rounded-md mx-auto">
                  Posisikan struk di dalam kotak & pastikan teks terlihat jelas
                </p>
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-lime" />
                  <span className="w-4 h-4 border-b-2 border-r-2 border-lime" />
                </div>
              </div>

              {/* Loading Spinner */}
              {cameraLoading && (
                <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white gap-2">
                  <RefreshCw className="animate-spin text-lime" size={30} />
                  <span className="text-xs font-semibold">Mengaktifkan kamera...</span>
                </div>
              )}

              {/* Error fallback */}
              {cameraError && (
                <div className="absolute inset-0 bg-black/90 p-5 flex flex-col items-center justify-center text-center text-white gap-3">
                  <AlertCircle size={32} className="text-amber-400" />
                  <p className="text-xs leading-relaxed text-gray-200">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="mt-2 min-h-[44px] px-4 py-2 rounded-xl bg-lime text-ink font-bold text-xs hover:bg-lime-hover transition"
                  >
                    Pilih Foto dari Galeri Saja
                  </button>
                </div>
              )}
            </div>

            {/* Tombol Shutter / Jepret */}
            <div className="flex items-center justify-around pt-2">
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setMode('menu');
                }}
                className="text-xs font-semibold text-ink-muted hover:text-ink min-h-[44px] px-3 py-2"
              >
                Kembali
              </button>

              {/* Tombol Jepret Utama */}
              <button
                type="button"
                onClick={handleSnapPhoto}
                disabled={cameraLoading || !!cameraError}
                aria-label="Ambil Foto"
                className="w-16 h-16 rounded-full bg-lime border-4 border-white shadow-lg flex items-center justify-center text-ink active:scale-90 hover:scale-105 transition cursor-pointer disabled:opacity-50"
              >
                <div className="w-11 h-11 rounded-full border-2 border-ink flex items-center justify-center">
                  <Camera size={22} className="text-ink" />
                </div>
              </button>

              {/* Tombol Putar Kamera Depan/Belakang */}
              <button
                type="button"
                onClick={handleSwitchCamera}
                disabled={cameraLoading || !!cameraError}
                aria-label="Ganti Kamera"
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-ink hover:bg-gray-200 transition cursor-pointer disabled:opacity-40"
              >
                <SwitchCamera size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* TAMPILAN 2: MENU PILIHAN SUMBER FOTO */
          <div>
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

            {/* Opsi Pilihan */}
            <div className="py-4 space-y-3">
              {/* Opsi 1: Ambil dengan Kamera Langsung (In-Browser Live Viewfinder) */}
              <button
                type="button"
                onClick={handleOpenLiveCamera}
                className="w-full min-h-[58px] flex items-center gap-4 rounded-2xl border-2 border-line hover:border-lime bg-white p-4 text-left transition hover:bg-lime-tint/30 active:scale-[0.99] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-lime flex items-center justify-center text-ink shrink-0 shadow-sm">
                  <Camera size={22} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-ink text-sm">Ambil Foto dengan Kamera</h4>
                  <p className="text-xs text-ink-muted">Buka kamera langsung di aplikasi dan potret struk</p>
                </div>
              </button>

              {/* Opsi 2: Ambil dari Galeri Foto */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
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

              {/* Opsi 3: Tambah Manual */}
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
                🔒 Foto diproses langsung di perangkatmu, aman & tanpa disimpan di server.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

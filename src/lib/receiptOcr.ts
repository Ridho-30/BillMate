/**
 * Mengompres gambar di browser sisi klien:
 * - Maksimal sisi terpanjang 1600px
 * - Kualitas kompresi JPEG 0.8
 * - Berjalan 100% di browser pengguna tanpa upload ke server
 */
export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const maxDimension = 1600;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Gagal menginisialisasi canvas untuk kompresi foto.'));
        }

        // Gambar latar putih sebelum menggambar (mencegah background hitam untuk transparansi PNG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke JPEG dengan kualitas 0.8
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Gagal membaca data gambar struk.'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas foto.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Membaca teks mentah dari gambar menggunakan Tesseract.js:
 * - Lazy load worker supaya tidak membebani initial bundle
 * - Bahasa gabungan "ind+eng"
 * - Callback onProgress dengan persentase 0-100%
 */
export async function recognizeReceipt(
  imageSource: string | File,
  onProgress?: (percent: number) => void
): Promise<string> {
  // Lazy load Tesseract.js
  const { createWorker } = await import('tesseract.js');

  const worker = await createWorker(['ind', 'eng'], 1, {
    logger: (m: { status?: string; progress?: number }) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        const pct = Math.min(100, Math.max(0, Math.round(m.progress * 100)));
        onProgress?.(pct);
      }
    },
  });

  try {
    const result = await worker.recognize(imageSource);
    const rawText = result.data.text || '';
    return rawText;
  } finally {
    await worker.terminate();
  }
}


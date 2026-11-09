export type OcrItem = {
  nama_barang?: string;
  name?: string;
  qty?: number;
  quantity?: number;
  harga_satuan?: number;
  price?: number;
  subtotal?: number;
};

export type OcrFee = {
  label?: string;
  nominal?: number;
  persen?: number;
};

export type OcrParsedData = {
  merchant?: string;
  items?: OcrItem[];
  pajak?: OcrFee | number;
  tax?: OcrFee | number;
  service?: OcrFee | number;
  service_charge?: OcrFee | number;
  diskon?: OcrFee | number;
  discount?: OcrFee | number;
  subtotal_items?: number;
  subtotal?: number;
  grand_total?: number;
  total?: number;
};

export type OcrApiResponse = {
  success: boolean;
  message?: string;
  data: OcrParsedData;
};

/**
 * Mengirim teks mentah hasil OCR ke external API (OxFlow backend)
 * untuk diurai menjadi format terstruktur JSON oleh AI.
 */
export async function parseReceipt(rawText: string): Promise<OcrParsedData> {
  if (!rawText || !rawText.trim()) {
    throw new Error('Teks hasil baca struk kosong. Mohon pastikan foto struk memiliki teks yang terbaca jelas.');
  }

  const rawBaseUrl = import.meta.env.VITE_OCR_API_URL || 'https://ox-flow-backend.vercel.app';
  // Hapus trailing slash jika ada
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  const endpoint = `${baseUrl}/api/ocr/parse`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 30000); // Timeout 30 detik

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // Catatan: Header Authorization sengaja tidak dikirim saat ini untuk uji coba.
      // Jika nanti auth diaktifkan kembali, tambahkan di sini:
      // 'Authorization': `Bearer ${token}`
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ rawText }),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      if (fetchErr.name === 'AbortError') {
        throw new Error('Pemrosesan struk melebihi batas waktu (timeout 30 detik). Silakan coba lagi atau gunakan opsi isi manual.');
      }

      if (!navigator.onLine) {
        throw new Error('Koneksi internet terputus. Pastikan perangkat Anda terhubung ke internet lalu coba lagi.');
      }

      // Jika di lingkungan dev lokal terjadi blokir CORS, coba via Vite dev proxy (/api/ocr/parse)
      if (import.meta.env.DEV && !endpoint.startsWith('/api/ocr')) {
        try {
          response = await fetch('/api/ocr/parse', {
            method: 'POST',
            headers,
            body: JSON.stringify({ rawText }),
            signal: controller.signal,
          });
        } catch {
          throw new Error(
            `Gagal menghubungi server OCR (Network/CORS Error). Pastikan origin ${window.location.origin} diizinkan pada pengaturan CORS server backend.`
          );
        }
      } else {
        // Deteksi kemungkinan issue CORS
        throw new Error(
          `Gagal menghubungi server OCR (Network/CORS Error). Pastikan origin ${window.location.origin} diizinkan pada pengaturan CORS server backend.`
        );
      }
    }

    if (!response.ok) {
      let serverErrorMsg = '';
      try {
        const errorJson = await response.json();
        serverErrorMsg = errorJson.message || errorJson.error || '';
      } catch {
        // Response bukan JSON
      }

      switch (response.status) {
        case 400:
          throw new Error(serverErrorMsg || 'Format teks struk tidak valid atau tidak dapat dibaca.');
        case 401:
          throw new Error(serverErrorMsg || 'Akses ditolak: Autentikasi diperlukan.');
        case 500:
          throw new Error(serverErrorMsg || 'Terjadi kesalahan internal pada server OCR.');
        case 502:
          throw new Error(serverErrorMsg || 'Gagal mengurai teks struk dengan AI. Silakan coba kembali atau isi manual.');
        default:
          throw new Error(
            serverErrorMsg || `Server mengembalikan status error ${response.status} (${response.statusText}).`
          );
      }
    }

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error('Respon dari server OCR tidak dapat dibaca sebagai format JSON yang valid.');
    }

    // Validasi skema respon
    if (!json || typeof json !== 'object') {
      throw new Error('Struktur respon dari server OCR tidak valid.');
    }

    // Backend ox-flow mengembalikan format { success: true, data: { items: [...], ... } }
    const parsedData: OcrParsedData = json.data || json;

    if (!parsedData || typeof parsedData !== 'object' || !Array.isArray(parsedData.items)) {
      throw new Error('Respon server OCR tidak memuat daftar item pesanan yang valid.');
    }

    return parsedData;
  } finally {
    clearTimeout(timeoutId);
  }
}


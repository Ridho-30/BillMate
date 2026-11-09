import type { OcrParsedData, OcrFee } from './ocrApi';

export type BillItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  memberIds: number[];
  memberPortions?: Record<number, number>;
};

export type MappedReceipt = {
  activity: string;
  items: BillItem[];
  taxPercent: number;
  taxAmount: number;
  servicePercent: number;
  serviceAmount: number;
  discount: number;
  subtotal: number;
  calculatedTotal: number;
  receiptGrandTotal: number;
  hasMismatch: boolean;
};

/**
 * Ekstrak nilai nominal integer dari objek fee / angka bebas
 */
function extractNominal(fee?: OcrFee | number): number {
  if (fee === undefined || fee === null) return 0;
  if (typeof fee === 'number') {
    return Math.max(0, Math.round(fee));
  }
  if (typeof fee === 'object' && typeof fee.nominal === 'number') {
    return Math.max(0, Math.round(fee.nominal));
  }
  return 0;
}

/**
 * Coba membaca persentase dari label (misal "PB1 10%", "Service 5%")
 * Jika tidak ada label, hitung persentase dari nominal terhadap subtotal.
 */
function extractPercentage(fee?: OcrFee | number, nominal = 0, subtotal = 0): number {
  if (typeof fee === 'object' && fee?.label) {
    const match = fee.label.match(/(\d+(?:[.,]\d+)?)\s*%/);
    if (match) {
      const pct = parseFloat(match[1].replace(',', '.'));
      if (!isNaN(pct) && pct >= 0 && pct <= 100) {
        return Math.round(pct);
      }
    }
  }

  if (typeof fee === 'object' && typeof fee?.persen === 'number') {
    return Math.min(100, Math.max(0, Math.round(fee.persen)));
  }

  // Jika berupa angka di bawah atau sama dengan 50, bisa jadi itu sudah persen
  if (typeof fee === 'number' && fee > 0 && fee <= 50) {
    return Math.round(fee);
  }

  // Hitung proporsi terhadap subtotal
  if (subtotal > 0 && nominal > 0) {
    return Math.min(100, Math.max(0, Math.round((nominal / subtotal) * 100)));
  }

  return 0;
}

/**
 * Mengubah respon API OCR ke bentuk data yang digunakan form Split Bill BillMate.
 * - Memastikan semua nominal adalah integer rupiah
 * - Membuang item tanpa nama atau harga yang tidak masuk akal
 * - Menghitung validasi total item + pajak + service - diskon vs total struk
 */
export function mapOcrResponseToBill(data: OcrParsedData): MappedReceipt {
  const rawItems = Array.isArray(data.items) ? data.items : [];
  const baseTimestamp = Date.now();

  const items: BillItem[] = [];

  rawItems.forEach((raw, index) => {
    const rawName = (raw.nama_barang || raw.name || '').trim();
    if (!rawName) return;

    const quantity = Math.max(1, Math.round(Number(raw.qty || raw.quantity || 1)));

    let price = 0;
    if (raw.harga_satuan !== undefined && !isNaN(Number(raw.harga_satuan))) {
      price = Math.round(Number(raw.harga_satuan));
    } else if (raw.price !== undefined && !isNaN(Number(raw.price))) {
      price = Math.round(Number(raw.price));
    } else if (raw.subtotal !== undefined && !isNaN(Number(raw.subtotal))) {
      price = Math.round(Number(raw.subtotal) / quantity);
    }

    // Buang item jika harga tidak masuk akal (<= 0 atau NaN)
    if (price <= 0 || isNaN(price)) return;

    items.push({
      id: baseTimestamp + index,
      name: rawName,
      price,
      quantity,
      memberIds: [],
      memberPortions: {},
    });
  });

  // Hitung subtotal dari item valid
  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);

  // Pajak
  const taxFee = data.pajak ?? data.tax;
  const taxNominal = extractNominal(taxFee);
  const taxPercent = extractPercentage(taxFee, taxNominal, subtotal);
  const taxAmount = Math.round((subtotal * taxPercent) / 100);

  // Service charge
  const serviceFee = data.service ?? data.service_charge;
  const serviceNominal = extractNominal(serviceFee);
  const servicePercent = extractPercentage(serviceFee, serviceNominal, subtotal);
  const serviceAmount = Math.round((subtotal * servicePercent) / 100);

  // Diskon
  const discountFee = data.diskon ?? data.discount;
  const discount = Math.abs(extractNominal(discountFee));

  // Grand total dari struk
  const receiptGrandTotal = Math.max(
    0,
    Math.round(Number(data.grand_total ?? data.total ?? subtotal + taxAmount + serviceAmount - discount))
  );

  // Total yang dihitung BillMate
  const calculatedTotal = Math.max(0, subtotal + taxAmount + serviceAmount - discount);

  // Validasi kecocokan total (toleransi pembulatan +- 1 rupiah jika ada desimal)
  const hasMismatch = Math.abs(calculatedTotal - receiptGrandTotal) > 1 && receiptGrandTotal > 0;

  // Nama aktivitas dari merchant struk jika tersedia
  const merchantName = (data.merchant || '').trim();
  const activity = merchantName ? `Makan di ${merchantName}` : 'Makan Bersama';

  return {
    activity,
    items,
    taxPercent,
    taxAmount,
    servicePercent,
    serviceAmount,
    discount,
    subtotal,
    calculatedTotal,
    receiptGrandTotal,
    hasMismatch,
  };
}


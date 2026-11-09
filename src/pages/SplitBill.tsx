import { useMemo, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  Plus,
  Minus,
  Trash2,
  Users,
  Receipt,
  Calculator,
  CheckCircle2,
  Utensils,
  X,
  Save,
} from 'lucide-react';
import { auth } from '../firebase';
import { Navbar } from '../components/Navbar';
import { ReceiptScanButton } from '../components/ReceiptScanButton';
import { ReceiptScanProgress, ScanStatus } from '../components/ReceiptScanProgress';
import { compressImage, recognizeReceipt } from '../lib/receiptOcr';
import { parseReceipt } from '../lib/ocrApi';
import { mapOcrResponseToBill, BillItem } from '../lib/receiptMapper';
import {
  getReceiptScanQuota,
  recordReceiptScan,
  markReceiptScanCorrected,
  UserQuota,
} from '../lib/supabase';

type Member = {
  id: number;
  name: string;
  paid: boolean;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Mengambil nama pertama (first name) user untuk dijadikan anggota awal otomatis
 * Contoh: "Ridho Rizky Prasetyo" -> "Ridho"
 */
function extractFirstName(user: FirebaseUser | null): string {
  if (!user) return 'Saya';
  const raw = (user.displayName || user.email?.split('@')[0] || '').trim();
  if (!raw) return 'Saya';
  const cleaned = raw.replace(/[._-]+/g, ' ').trim();
  const firstWord = cleaned.split(/\s+/)[0] || '';
  if (!firstWord) return 'Saya';
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
}

type OriginalScanSnapshot = {
  items: { name: string; price: number; quantity: number }[];
  tax: number;
  service: number;
  discount: number;
};

function SplitBill() {
  const location = useLocation();
  const isGuestUrl = location.pathname === '/coba';

  const [activity, setActivity] = useState('Makan Mabar Bareng');
  const [members, setMembers] = useState<Member[]>([]);
  const [items, setItems] = useState<BillItem[]>([]);

  const [tax, setTax] = useState(0);
  const [service, setService] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [newMember, setNewMember] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  // State untuk Fitur Auto Scan Receipt
  const [quota, setQuota] = useState<UserQuota>({
    isGuest: isGuestUrl,
    userId: null,
    plan: isGuestUrl ? 'guest' : 'plus',
    used: 3,
    total: 10,
    remaining: 7,
  });

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [scanError, setScanError] = useState<string | null>(null);
  const [receiptScanId, setReceiptScanId] = useState<string | null>(null);
  const [receiptGrandTotal, setReceiptGrandTotal] = useState<number | null>(null);
  const [originalSnapshot, setOriginalSnapshot] = useState<OriginalScanSnapshot | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  const lastSelectedFileRef = useRef<File | null>(null);

  // Ambil kuota saat komponen dimuat
  useEffect(() => {
    async function loadQuota() {
      if (isGuestUrl) {
        setQuota({
          isGuest: true,
          userId: null,
          plan: 'guest',
          used: 0,
          total: 0,
          remaining: 0,
        });
        return;
      }

      const q = await getReceiptScanQuota();
      setQuota(q);
    }

    loadQuota();
  }, [isGuestUrl]);

  // Otomatis masukkan user yang sedang login sebagai anggota awal jika belum ada anggota
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && !isGuestUrl) {
        const firstName = extractFirstName(currentUser);
        setMembers((prev) => {
          if (prev.length === 0) {
            return [{ id: 1, name: firstName, paid: false }];
          }
          return prev;
        });
      }
    });

    return () => unsubscribe();
  }, [isGuestUrl]);

  // Efek untuk menangani struk yang dipindai dari modal navbar mobile
  useEffect(() => {
    const autoFill = (location.state as any)?.autoFillReceipt;
    if (autoFill) {
      if (autoFill.activity) setActivity(autoFill.activity);
      if (Array.isArray(autoFill.items) && autoFill.items.length > 0) {
        setItems(autoFill.items);
      }
      if (typeof autoFill.taxPercent === 'number') setTax(autoFill.taxPercent);
      if (typeof autoFill.servicePercent === 'number') setService(autoFill.servicePercent);
      if (typeof autoFill.discount === 'number') setDiscount(autoFill.discount);
      if (typeof autoFill.receiptGrandTotal === 'number') {
        setReceiptGrandTotal(autoFill.receiptGrandTotal);
      }

      // Pastikan user yang login terdaftar sebagai anggota jika belum ada anggota
      if (auth.currentUser && !isGuestUrl) {
        const firstName = extractFirstName(auth.currentUser);
        setMembers((prev) => {
          if (prev.length === 0) {
            return [{ id: 1, name: firstName, paid: false }];
          }
          return prev;
        });
      }

      setOriginalSnapshot({
        items: autoFill.items.map((it: any) => ({
          name: it.name,
          price: it.price,
          quantity: it.quantity,
        })),
        tax: autoFill.taxPercent,
        service: autoFill.servicePercent,
        discount: autoFill.discount,
      });

      setScanStatus('success');

      // Bersihkan history state agar tidak mengisi ulang jika user me-refresh halaman
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isGuestUrl]);

  // Perhitungan Keuangan
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const taxAmount = Math.round((subtotal * tax) / 100);
  const serviceAmount = Math.round((subtotal * service) / 100);
  const grandTotal = Math.max(0, subtotal + taxAmount + serviceAmount - discount);

  // Validasi kecocokan dengan struk secara dinamis
  const hasMismatch = useMemo(() => {
    if (receiptGrandTotal === null || receiptGrandTotal <= 0) return false;
    // Toleransi pembulatan +- 1 rupiah
    return Math.abs(grandTotal - receiptGrandTotal) > 1;
  }, [grandTotal, receiptGrandTotal]);

  const calculations = useMemo(() => {
    const baseAmounts = members.map((member) => {
      const amount = items.reduce((total, item) => {
        if (!item.memberIds.includes(member.id)) return total;
        if (item.memberIds.length === 0) return total;

        // Porsi anggota ini pada item (default 1)
        const memberPortion = item.memberPortions?.[member.id] ?? 1;
        // Total seluruh porsi yang dibagi di item ini
        const totalPortions = item.memberIds.reduce((sum, mId) => {
          return sum + (item.memberPortions?.[mId] ?? 1);
        }, 0);

        if (totalPortions <= 0) return total;

        // Biaya item dialokasikan secara proporsional sesuai porsi yang diambil
        const itemTotal = item.price * item.quantity;
        return total + (itemTotal * memberPortion) / totalPortions;
      }, 0);

      return { id: member.id, amount };
    });

    const totalBase = baseAmounts.reduce(
      (total, member) => total + member.amount,
      0
    );

    const result = baseAmounts.map((member) => ({
      id: member.id,
      amount:
        totalBase > 0
          ? Math.round((member.amount / totalBase) * grandTotal)
          : 0,
    }));

    const difference =
      grandTotal -
      result.reduce((total, member) => total + member.amount, 0);

    if (difference !== 0) {
      const firstMember = result.find((member) => member.amount > 0);
      if (firstMember) firstMember.amount += difference;
    }

    return result;
  }, [members, items, grandTotal]);

  // Handler Proses Foto Struk
  const handleProcessReceiptFile = async (file: File) => {
    lastSelectedFileRef.current = file;
    setScanError(null);
    setOcrProgress(0);
    setSavedSuccessMessage(null);

    try {
      // 1. Kompresi gambar di browser
      setScanStatus('compressing');
      const compressedDataUrl = await compressImage(file);

      // 2. OCR Tesseract.js (berjalan 100% lokal di browser)
      setScanStatus('ocr');
      const rawText = await recognizeReceipt(compressedDataUrl, (pct) => {
        setOcrProgress(pct);
      });

      if (!rawText || !rawText.trim()) {
        throw new Error('Tidak ada teks yang dapat dibaca dari foto struk. Pastikan foto memiliki pencahayaan cukup dan teks terlihat fokus.');
      }

      // 3. Parsing JSON terstruktur via AI OCR API
      setScanStatus('ai');
      const ocrParsed = await parseReceipt(rawText);

      // 4. Transformasi ke format form Split Bill
      const mapped = mapOcrResponseToBill(ocrParsed);

      if (mapped.items.length === 0) {
        throw new Error('Tidak ditemukan item belanja yang valid pada struk. Silakan periksa kembali foto atau masukkan manual.');
      }

      // 5. Isi form dengan hasil pemindaian (Buat Split Bill Baru otomatis)
      if (mapped.activity) setActivity(mapped.activity);
      setItems(mapped.items);
      setTax(mapped.taxPercent);
      setService(mapped.servicePercent);
      setDiscount(mapped.discount);
      setReceiptGrandTotal(mapped.receiptGrandTotal);

      // Pastikan ada anggota (minimal user yang sedang login)
      if (auth.currentUser && !isGuestUrl) {
        const firstName = extractFirstName(auth.currentUser);
        setMembers((prev) => {
          if (prev.length === 0) {
            return [{ id: 1, name: firstName, paid: false }];
          }
          return prev;
        });
      }

      // Simpan snapshot untuk melacak apakah user mengoreksi hasil scan
      setOriginalSnapshot({
        items: mapped.items.map((it) => ({
          name: it.name,
          price: it.price,
          quantity: it.quantity,
        })),
        tax: mapped.taxPercent,
        service: mapped.servicePercent,
        discount: mapped.discount,
      });

      setScanStatus('success');

      // 6. Catat receipt_scans di database (non-blocking agar tidak menggagalkan pengisian form)
      try {
        if (quota.userId) {
          const recordResult = await recordReceiptScan(quota.userId);
          if (recordResult?.id) {
            setReceiptScanId(recordResult.id);
          }
          setQuota((prev) => ({
            ...prev,
            used: prev.used + 1,
            remaining: Math.max(0, prev.remaining - 1),
          }));
        }
      } catch (dbErr) {
        console.warn('Catatan database non-fatal:', dbErr);
      }
    } catch (err: any) {
      console.error('Scan receipt error:', err);
      setScanStatus('error');
      setScanError(err.message || 'Terjadi kegagalan saat membaca struk.');
    }
  };

  const handleRetryScan = () => {
    if (lastSelectedFileRef.current) {
      handleProcessReceiptFile(lastSelectedFileRef.current);
    } else {
      setScanStatus('idle');
      setScanError(null);
    }
  };

  const handleManualInput = () => {
    setScanStatus('idle');
    setScanError(null);
  };

  // Tangani file scan struk dari modal navbar mobile (baik saat navigasi dari halaman lain maupun saat sudah di /split-bill)
  useEffect(() => {
    // 1. Cek file di memori global
    const pendingFile = (window as any).__billmatePendingScanFile;
    if (pendingFile instanceof File) {
      delete (window as any).__billmatePendingScanFile;
      handleProcessReceiptFile(pendingFile);
      return;
    }

    // 2. Cek file dari router state
    const stateFile = (location.state as any)?.pendingScanFile;
    if (stateFile instanceof File) {
      window.history.replaceState({}, document.title);
      handleProcessReceiptFile(stateFile);
    }
  }, [location.state]);

  // 3. Listener event custom untuk reaksi instan tanpa reload saat modal navbar digunakan di /split-bill
  useEffect(() => {
    const handleScanFileEvent = (e: any) => {
      const file = e.detail;
      if (file instanceof File) {
        handleProcessReceiptFile(file);
      }
    };

    window.addEventListener('billmate:process-scan-file', handleScanFileEvent);
    return () => {
      window.removeEventListener('billmate:process-scan-file', handleScanFileEvent);
    };
  }, []);

  // Simpan Tagihan & Deteksi Koreksi User
  const handleSaveBill = async () => {
    if (hasMismatch) {
      const confirmSave = window.confirm(
        'Perhatian: Total hasil scan tidak cocok dengan struk. Apakah Anda yakin ingin tetap menyimpan tagihan ini?'
      );
      if (!confirmSave) return;
    }

    // Periksa apakah user mengoreksi hasil scan
    if (receiptScanId && originalSnapshot) {
      const hasItemChanges =
        items.length !== originalSnapshot.items.length ||
        items.some((item, idx) => {
          const orig = originalSnapshot.items[idx];
          if (!orig) return true;
          return (
            orig.name !== item.name ||
            orig.price !== item.price ||
            orig.quantity !== item.quantity
          );
        });

      const hasFeeChanges =
        tax !== originalSnapshot.tax ||
        service !== originalSnapshot.service ||
        discount !== originalSnapshot.discount;

      if (hasItemChanges || hasFeeChanges) {
        // Tandai dikoreksi = true pada receipt_scans
        await markReceiptScanCorrected(receiptScanId);
      }
    }

    setSavedSuccessMessage('Tagihan berhasil disimpan!');
    setTimeout(() => {
      setSavedSuccessMessage(null);
    }, 4000);
  };

  const addMember = () => {
    if (!newMember.trim()) return;

    setMembers([
      ...members,
      {
        id: Date.now(),
        name: newMember.trim(),
        paid: false,
      },
    ]);

    setNewMember('');
  };

  const removeMember = (id: number) => {
    setMembers(members.filter((member) => member.id !== id));
    setItems(
      items.map((item) => {
        const updatedPortions = { ...(item.memberPortions || {}) };
        delete updatedPortions[id];
        return {
          ...item,
          memberIds: item.memberIds.filter((memberId) => memberId !== id),
          memberPortions: updatedPortions,
        };
      })
    );
  };

  const addItem = () => {
    const price = Number(newItemPrice);
    const quantity = Number(newItemQuantity);

    if (!newItemName.trim() || price <= 0 || quantity < 1) return;

    setItems([
      ...items,
      {
        id: Date.now(),
        name: newItemName.trim(),
        price,
        quantity,
        memberIds: [],
        memberPortions: {},
      },
    ]);

    setNewItemName('');
    setNewItemPrice('');
    setNewItemQuantity('1');
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (
    id: number,
    field: 'name' | 'price' | 'quantity',
    value: string | number
  ) => {
    setItems(
      items.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          [field]: field === 'name' ? String(value) : Math.max(0, Number(value)),
        };
      })
    );
  };

  /**
   * Menambah / Mengurangi porsi seorang anggota untuk item tertentu
   * - Jika belum dipilih & delta > 0: pilih anggota dengan 1 porsi
   * - Jika porsi berkurang hingga 0: batalkan pilihan (hapus dari memberIds)
   */
  const changeMemberPortion = (itemId: number, memberId: number, delta: number) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== itemId) return item;

        const currentPortion = item.memberPortions?.[memberId] ?? 1;
        const isCurrentlySelected = item.memberIds.includes(memberId);

        if (!isCurrentlySelected) {
          if (delta > 0) {
            return {
              ...item,
              memberIds: [...item.memberIds, memberId],
              memberPortions: {
                ...(item.memberPortions || {}),
                [memberId]: 1,
              },
            };
          }
          return item;
        }

        const newPortion = currentPortion + delta;

        if (newPortion <= 0) {
          const updatedPortions = { ...(item.memberPortions || {}) };
          delete updatedPortions[memberId];
          return {
            ...item,
            memberIds: item.memberIds.filter((id) => id !== memberId),
            memberPortions: updatedPortions,
          };
        }

        return {
          ...item,
          memberPortions: {
            ...(item.memberPortions || {}),
            [memberId]: newPortion,
          },
        };
      })
    );
  };

  const togglePaid = (id: number) => {
    setMembers(
      members.map((member) =>
        member.id === id ? { ...member, paid: !member.paid } : member
      )
    );
  };

  const paidTotal = members.reduce((total, member) => {
    if (!member.paid) return total;

    return (
      total +
      (calculations.find((item) => item.id === member.id)?.amount || 0)
    );
  }, 0);

  const inputClass =
    'w-full min-h-[48px] rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-ink focus:ring-2 focus:ring-lime';

  return (
    <div className="min-h-screen bg-white text-ink font-sans">
      <Navbar isSplitBillPage />

      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-ink">
            <Receipt size={14} />
            BillMate Split Bill
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            Bagi tagihan tanpa ribet.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted md:text-base">
            Pindai struk belanja dengan AI atau masukkan pesanan masing-masing, biarkan BillMate menghitung pembagian tagihan secara otomatis.
          </p>
        </div>

        {/* Notifikasi Tagihan Tersimpan */}
        {savedSuccessMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-lime bg-lime-tint/70 p-4 shadow-sm animate-fade-in">
            <CheckCircle2 className="text-ink" size={20} />
            <p className="text-sm font-bold text-ink">{savedSuccessMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Bagian Auto Scan Struk */}
            <ReceiptScanButton
              quota={quota}
              isProcessing={
                scanStatus === 'compressing' ||
                scanStatus === 'ocr' ||
                scanStatus === 'ai'
              }
              onFileSelect={handleProcessReceiptFile}
            />

            {/* Indikator Status & Progres Pemindaian Struk */}
            <ReceiptScanProgress
              status={scanStatus}
              ocrProgress={ocrProgress}
              errorMessage={scanError}
              hasMismatch={hasMismatch}
              onRetry={handleRetryScan}
              onManual={handleManualInput}
              onDismissWarning={() => setReceiptGrandTotal(null)}
            />

            {/* Bagian Informasi Tagihan */}
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-ink">
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-ink">Informasi Tagihan</h2>
                  <p className="text-xs text-ink-muted">Detail aktivitas bersama</p>
                </div>
              </div>

              <label className="mb-2 block text-sm font-medium">
                Nama aktivitas
              </label>
              <input
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className={inputClass}
                placeholder="Contoh: Makan Bersama"
              />
            </section>

            {/* Bagian Anggota */}
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/30 text-ink">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-ink">Anggota</h2>
                    <p className="text-xs text-ink-muted">
                      {members.length} orang dalam tagihan
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-xs font-bold text-ink">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{member.name}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      className="ml-1 text-ink-muted/70 hover:text-red-500 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      aria-label={`Hapus ${member.name}`}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMember()}
                  className={inputClass}
                  placeholder="Masukkan nama anggota"
                />
                <button
                  type="button"
                  onClick={addMember}
                  className="flex shrink-0 min-h-[48px] items-center gap-2 rounded-xl bg-lime px-4 py-3 text-sm font-bold text-ink transition hover:bg-lime-hover"
                >
                  <Plus size={17} />
                  <span className="hidden sm:inline">Tambah</span>
                </button>
              </div>
            </section>

            {/* Bagian Daftar Pesanan */}
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/30 text-ink">
                    <Utensils size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-ink">Daftar Pesanan</h2>
                    <p className="text-xs text-ink-muted">
                      {items.length} item pesanan • Tentukan siapa yang memesan setiap item
                    </p>
                  </div>
                </div>

                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 min-h-[44px] px-2 flex items-center"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-line p-4 transition hover:border-lime/60"
                  >
                    <div className="mb-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        {/* Input nama item (bisa langsung dikoreksi oleh user) */}
                        <input
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="w-full font-semibold text-ink text-sm sm:text-base border-b border-transparent hover:border-line focus:border-ink focus:outline-none py-1"
                          placeholder="Nama item"
                        />
                        <div className="flex items-center gap-2 text-xs text-ink-muted">
                          <label className="flex items-center gap-1">
                            <span>Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, 'quantity', e.target.value)
                              }
                              className="w-14 rounded-lg border border-line px-2 py-1 text-center text-xs font-semibold text-ink focus:border-ink focus:outline-none"
                            />
                          </label>
                          <span>×</span>
                          <label className="flex items-center gap-1">
                            <span>Rp</span>
                            <input
                              type="number"
                              min="0"
                              value={item.price}
                              onChange={(e) =>
                                updateItem(item.id, 'price', e.target.value)
                              }
                              className="w-24 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink focus:border-ink focus:outline-none"
                            />
                          </label>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-line">
                        <p className="font-bold text-ink">
                          {formatRupiah(item.price * item.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="mt-1 text-ink-muted/70 transition hover:text-red-500 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink-muted">
                        Siapa yang memesan?
                      </p>
                      {item.quantity > 1 && (
                        <span className="text-[11px] text-ink-muted/80">
                          Total item: <strong>{item.quantity} porsi</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {members.map((member) => {
                        const selected = item.memberIds.includes(member.id);
                        const portion = item.memberPortions?.[member.id] ?? 1;

                        if (selected) {
                          return (
                            <div
                              key={member.id}
                              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border-2 border-ink bg-lime/35 px-2 py-1 shadow-sm transition"
                            >
                              <button
                                type="button"
                                onClick={() => changeMemberPortion(item.id, member.id, -1)}
                                className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-ink font-bold flex items-center justify-center transition active:scale-90 text-sm shadow-xs border border-line/40"
                                title={portion === 1 ? 'Batalkan pilihan' : 'Kurangi 1 porsi'}
                                aria-label={`Kurangi porsi ${member.name}`}
                              >
                                <Minus size={13} />
                              </button>

                              <div className="px-1.5 flex items-center gap-1.5 select-none">
                                <span className="text-xs font-bold text-ink">{member.name}</span>
                                <span className="inline-flex items-center justify-center rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-extrabold text-lime leading-none">
                                  {portion}x
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => changeMemberPortion(item.id, member.id, 1)}
                                className="w-7 h-7 rounded-lg bg-ink hover:bg-ink-muted text-white font-bold flex items-center justify-center transition active:scale-90 text-sm shadow-xs"
                                title="Tambah 1 porsi"
                                aria-label={`Tambah porsi ${member.name}`}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => changeMemberPortion(item.id, member.id, 1)}
                            className="min-h-[44px] rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink-muted hover:border-ink hover:text-ink hover:bg-gray-50 transition flex items-center gap-1.5 active:scale-95"
                          >
                            <Plus size={13} />
                            <span>{member.name}</span>
                          </button>
                        );
                      })}

                      {members.length === 0 && (
                        <p className="text-xs text-ink-muted/70 italic">
                          Tambahkan nama anggota di bagian "Anggota" terlebih dahulu.
                        </p>
                      )}
                    </div>

                    {(() => {
                      if (item.memberIds.length === 0) {
                        return (
                          <p className="mt-3 text-xs text-ink-muted/70">
                            Belum ada anggota yang dipilih
                          </p>
                        );
                      }

                      const totalPortions = item.memberIds.reduce(
                        (sum, mId) => sum + (item.memberPortions?.[mId] ?? 1),
                        0
                      );
                      const itemTotal = item.price * item.quantity;
                      const pricePerPortion =
                        totalPortions > 0 ? Math.round(itemTotal / totalPortions) : 0;
                      const isExactMatch = totalPortions === item.quantity;

                      return (
                        <div className="mt-3 space-y-1.5 pt-2 border-t border-line/50">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-ink">
                              {totalPortions} porsi terbagi ({formatRupiah(pricePerPortion)}/porsi)
                            </span>

                            {item.quantity > 1 && (
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                  isExactMatch
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isExactMatch
                                  ? '✓ Pas dengan jumlah item'
                                  : `${totalPortions} dari ${item.quantity} item terbagi`}
                              </span>
                            )}
                          </div>

                          {/* Rincian cepat pembagian per orang */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                            {item.memberIds.map((mId, idx) => {
                              const mName =
                                members.find((m) => m.id === mId)?.name || 'Anggota';
                              const p = item.memberPortions?.[mId] ?? 1;
                              const memberCost = Math.round(
                                (itemTotal * p) / totalPortions
                              );
                              return (
                                <span key={mId}>
                                  {idx > 0 && <span className="opacity-40 mr-3">•</span>}
                                  <strong className="text-ink font-semibold">{mName}</strong>:{' '}
                                  {p}x ({formatRupiah(memberCost)})
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="rounded-xl bg-gray-50 py-8 text-center text-sm text-ink-muted/70">
                    Belum ada item pesanan. Scan struk belanja Anda atau tambahkan item secara manual di bawah.
                  </div>
                )}
              </div>

              {/* Form Tambah Item Manual */}
              <div className="mt-5 border-t border-line pt-5">
                <h3 className="mb-3 text-sm font-bold text-ink">
                  Tambahkan Item Manual
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className={inputClass}
                    placeholder="Nama item"
                  />
                  <input
                    type="number"
                    min="1"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className={inputClass}
                    placeholder="Harga item (Rp)"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className={inputClass}
                    placeholder="Jumlah"
                  />
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-dark px-4 py-3 text-sm font-bold text-white transition hover:bg-ink-muted"
                  >
                    <Plus size={17} />
                    Tambahkan Item
                  </button>
                </div>
                <p className="mt-2 text-xs text-ink-muted/70">
                  Setelah item ditambahkan, pilih anggota yang memesan item tersebut.
                </p>
              </div>
            </section>

            {/* Bagian Biaya Tambahan & Diskon */}
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/30 text-ink">
                  <Calculator size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-ink">Biaya Tambahan & Diskon</h2>
                  <p className="text-xs text-ink-muted">
                    Atur persentase pajak, service charge, serta potongan diskon
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Pajak (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tax}
                    onChange={(e) =>
                      setTax(Math.max(0, Math.min(100, Number(e.target.value))))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Service charge (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={service}
                    onChange={(e) =>
                      setService(
                        Math.max(0, Math.min(100, Number(e.target.value)))
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) =>
                      setDiscount(Math.max(0, Number(e.target.value)))
                    }
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-ink-muted/70">
                Pajak dan biaya service dihitung proporsional, serta diskon dikurangkan sebelum pembagian total tagihan.
              </p>
            </section>
          </div>

          {/* Kolom Samping Ringkasan Pembayaran */}
          <aside className="space-y-6">
            <section className="rounded-2xl bg-dark p-6 text-white shadow-lg">
              <p className="text-sm font-medium text-white/75">Total Tagihan</p>
              <h2 className="mt-2 text-3xl font-bold">
                {formatRupiah(grandTotal)}
              </h2>

              <div className="mt-6 space-y-3 border-t border-white/20 pt-4 text-sm">
                <div className="flex justify-between text-white/75">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-white/75">
                  <span>Pajak ({tax}%)</span>
                  <span>{formatRupiah(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-white/75">
                  <span>Service ({service}%)</span>
                  <span>{formatRupiah(serviceAmount)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-lime">
                    <span>Diskon</span>
                    <span>-{formatRupiah(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/20 pt-3 font-bold text-base">
                  <span>Grand Total</span>
                  <span>{formatRupiah(grandTotal)}</span>
                </div>
              </div>

              {/* Tombol Simpan Tagihan */}
              <div className="mt-6 pt-2">
                <button
                  type="button"
                  onClick={handleSaveBill}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3 text-sm font-bold text-ink transition hover:bg-lime-hover active:scale-95"
                >
                  <Save size={18} />
                  <span>Simpan Tagihan</span>
                </button>
              </div>
            </section>

            {/* Pembagian Tagihan Per Anggota */}
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="font-bold text-ink">Pembagian Tagihan</h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Total pembayaran setiap anggota
                </p>
              </div>

              <div className="space-y-4">
                {members.map((member) => {
                  const amount =
                    calculations.find((item) => item.id === member.id)?.amount ||
                    0;

                  return (
                    <div
                      key={member.id}
                      className="border-b border-line pb-4 last:border-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-sm font-bold text-ink">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              {member.name}
                            </p>
                            <p className="text-xs text-ink-muted/70">
                              {member.paid ? 'Sudah membayar' : 'Belum membayar'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-ink">
                            {formatRupiah(amount)}
                          </p>
                          <button
                            type="button"
                            onClick={() => togglePaid(member.id)}
                            className={`mt-1 text-xs font-semibold min-h-[32px] px-2 rounded-md ${
                              member.paid
                                ? 'text-ink bg-lime/30'
                                : 'text-ink-muted hover:text-ink hover:bg-gray-100'
                            }`}
                          >
                            {member.paid ? '✓ Lunas' : 'Tandai lunas'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {members.length === 0 && (
                  <p className="py-4 text-center text-sm text-ink-muted/70">
                    Belum ada anggota. Tambahkan anggota di sebelah kiri untuk melihat pembagian.
                  </p>
                )}
              </div>
            </section>

            {/* Ringkasan Status Pembayaran */}
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-bold text-ink">
                Ringkasan Pembayaran
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Sudah dibayar</span>
                  <span className="font-semibold text-ink">
                    {formatRupiah(paidTotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Belum dibayar</span>
                  <span className="font-semibold text-ink-muted">
                    {formatRupiah(Math.max(0, grandTotal - paidTotal))}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-lime transition-all duration-300"
                    style={{
                      width: `${
                        grandTotal > 0
                          ? Math.min(100, (paidTotal / grandTotal) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <p className="text-xs text-ink-muted/70">
                  {members.filter((member) => member.paid).length} dari{' '}
                  {members.length} anggota sudah membayar.
                </p>
              </div>
            </section>

            <div className="rounded-xl border border-line bg-lime-tint/60 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="shrink-0 text-ink" size={20} />
                <div>
                  <p className="text-sm font-bold text-ink">
                    Pembagian Otomatis & Adil
                  </p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    BillMate membagi harga item berdasarkan anggota yang dipilih, serta membebankan pajak dan potongan diskon secara proporsional.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-10 border-t border-line bg-white py-6 pb-24 md:pb-6">
        <p className="text-center text-xs text-ink-muted">
          © 2026 BillMate. Manage money together, effortlessly.
        </p>
      </footer>
    </div>
  );
}

export default SplitBill;

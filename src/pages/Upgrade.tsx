import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Sparkles,
  QrCode,
  CreditCard,
  Building2,
  Copy,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { updateUserPlan } from '../lib/supabase';

type PlanOption = 'plus' | 'pro';
type PaymentMethod = 'qris' | 'briva' | 'cc';

export default function Upgrade() {
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>('plus');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qris');
  const [step, setStep] = useState<'plan' | 'checkout' | 'success'>('plan');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form Kartu Kredit
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const planDetails = {
    plus: {
      name: 'Plus',
      price: 24900,
      priceFormatted: 'Rp24.900',
      period: '/bulan',
      scans: '10 scan struk / bulan',
      features: [
        'Auto Scan Struk (AI) 10x per bulan',
        'Split Bill hingga 10x per bulan',
        'Pembagian tagihan per item otomatis',
        'Group Wallet hingga 5 anggota',
        'Bebas iklan sepenuhnya',
      ],
    },
    pro: {
      name: 'Pro',
      price: 29000,
      priceFormatted: 'Rp29.000',
      period: '/bulan',
      badge: 'Paling Populer',
      scans: '30 scan struk / bulan (Fair Use)',
      features: [
        'Auto Scan Struk (AI) 30x per bulan',
        'Split Bill tanpa batas (Unlimited)',
        'Kategori pengeluaran tanpa batas',
        'Group Wallet hingga 10 anggota + Settle Up',
        'Prioritas pemrosesan AI OCR tercepat',
        'Bebas iklan sepenuhnya',
      ],
    },
  };

  const currentPlan = planDetails[selectedPlan];
  const adminFee = selectedMethod === 'briva' ? 1000 : 0;
  const totalPayment = currentPlan.price + adminFee;

  const handleCopyVa = () => {
    navigator.clipboard.writeText('8801081294821920');
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);

    // Simulasi verifikasi payment gateway selama 1.5 detik
    setTimeout(async () => {
      await updateUserPlan(selectedPlan);
      setIsProcessing(false);
      setStep('success');
    }, 1500);
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="min-h-screen bg-[#F8FAF5] text-ink font-sans pb-28 md:pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-5 py-8 md:py-12">
        {/* Header Breadcrumb */}
        {step !== 'success' && (
          <div className="mb-8">
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink transition mb-3"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Profil</span>
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
              {step === 'plan' ? 'Upgrade Paket BillMate' : 'Selesaikan Pembayaran'}
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              {step === 'plan'
                ? 'Pilih paket terbaik untuk menikmati fitur Auto Scan Struk tanpa ribet.'
                : 'Pilih metode pembayaran aman dan instan untuk mengaktifkan paket.'}
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 1: PILIH PAKET                                          */}
        {/* ============================================================ */}
        {step === 'plan' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Plus */}
              <div
                onClick={() => setSelectedPlan('plus')}
                className={`cursor-pointer rounded-3xl p-6 md:p-8 transition-all border-2 relative bg-white ${
                  selectedPlan === 'plus'
                    ? 'border-ink shadow-lg ring-4 ring-lime/30'
                    : 'border-line hover:border-gray-300 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-ink text-lg">Paket Plus</span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === 'plus'
                        ? 'border-ink bg-lime text-ink'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedPlan === 'plus' && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-extrabold text-ink">
                    {planDetails.plus.priceFormatted}
                  </span>
                  <span className="text-xs text-ink-muted"> {planDetails.plus.period}</span>
                </div>

                <div className="mb-6 rounded-xl bg-lime-tint p-3 border border-lime/40">
                  <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <Sparkles size={14} className="text-lime-dark" />
                    <span>{planDetails.plus.scans}</span>
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-ink/80 mb-6">
                  {planDetails.plus.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check size={14} className="text-[#75B51B] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Pro */}
              <div
                onClick={() => setSelectedPlan('pro')}
                className={`cursor-pointer rounded-3xl p-6 md:p-8 transition-all border-2 relative bg-white ${
                  selectedPlan === 'pro'
                    ? 'border-ink shadow-lg ring-4 ring-lime/30'
                    : 'border-line hover:border-gray-300 shadow-sm'
                }`}
              >
                <div className="absolute -top-3 right-6 bg-lime text-ink font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  {planDetails.pro.badge}
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-ink text-lg">Paket Pro</span>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === 'pro'
                        ? 'border-ink bg-lime text-ink'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedPlan === 'pro' && <Check size={14} strokeWidth={3} />}
                  </div>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-extrabold text-ink">
                    {planDetails.pro.priceFormatted}
                  </span>
                  <span className="text-xs text-ink-muted"> {planDetails.pro.period}</span>
                </div>

                <div className="mb-6 rounded-xl bg-dark text-white p-3 shadow-sm">
                  <p className="text-xs font-bold text-lime flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>{planDetails.pro.scans}</span>
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-ink/80 mb-6">
                  {planDetails.pro.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check size={14} className="text-[#75B51B] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tombol Lanjut ke Checkout */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full sm:w-auto min-h-[50px] inline-flex items-center justify-center gap-2 rounded-2xl bg-lime px-8 py-3.5 text-sm font-bold text-ink transition hover:bg-lime-hover shadow-sm active:scale-95"
              >
                <span>Lanjut ke Pembayaran ({currentPlan.priceFormatted})</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: CHECKOUT & PAYMENT GATEWAY                           */}
        {/* ============================================================ */}
        {step === 'checkout' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Pilihan Metode Pembayaran */}
              <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-sm">
                <h3 className="font-bold text-ink text-base mb-4">Pilih Metode Pembayaran</h3>

                <div className="space-y-3">
                  {/* Metode 1: QRIS */}
                  <label
                    onClick={() => setSelectedMethod('qris')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                      selectedMethod === 'qris'
                        ? 'border-ink bg-lime-tint/30'
                        : 'border-line hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-line flex items-center justify-center text-ink">
                        <QrCode size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-ink">QRIS (Instant)</p>
                        <p className="text-xs text-ink-muted">GoPay, OVO, Dana, BCA, Livin, ShopeePay</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#75B51B] bg-lime/20 px-2 py-0.5 rounded-md">
                      Bebas Biaya
                    </span>
                  </label>

                  {/* Metode 2: BRIVA / Virtual Account */}
                  <label
                    onClick={() => setSelectedMethod('briva')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                      selectedMethod === 'briva'
                        ? 'border-ink bg-lime-tint/30'
                        : 'border-line hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-line flex items-center justify-center text-ink">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-ink">Virtual Account (BRIVA / Bank)</p>
                        <p className="text-xs text-ink-muted">Bank BRI, BCA, Mandiri, BNI</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-ink-muted">
                      Admin Rp1.000
                    </span>
                  </label>

                  {/* Metode 3: Kartu Kredit / Debit */}
                  <label
                    onClick={() => setSelectedMethod('cc')}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                      selectedMethod === 'cc'
                        ? 'border-ink bg-lime-tint/30'
                        : 'border-line hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-line flex items-center justify-center text-ink">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-ink">Kartu Kredit / Debit Online</p>
                        <p className="text-xs text-ink-muted">Visa, Mastercard, JCB</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#75B51B] bg-lime/20 px-2 py-0.5 rounded-md">
                      Instan
                    </span>
                  </label>
                </div>
              </div>

              {/* Detail Instruksi Sesuai Metode Terpilih */}
              <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-sm">
                {selectedMethod === 'qris' && (
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-xs text-ink-muted font-medium">
                      <Clock size={13} />
                      <span>Selesaikan dalam 15:00</span>
                    </div>

                    <div className="w-56 h-56 mx-auto bg-white border-2 border-line rounded-2xl p-3 flex flex-col items-center justify-center shadow-inner">
                      {/* Visual QR Code Mockup */}
                      <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full text-ink"
                        fill="currentColor"
                      >
                        <rect x="10" y="10" width="25" height="25" fill="#111" />
                        <rect x="15" y="15" width="15" height="15" fill="#fff" />
                        <rect x="18" y="18" width="9" height="9" fill="#111" />

                        <rect x="65" y="10" width="25" height="25" fill="#111" />
                        <rect x="70" y="15" width="15" height="15" fill="#fff" />
                        <rect x="73" y="18" width="9" height="9" fill="#111" />

                        <rect x="10" y="65" width="25" height="25" fill="#111" />
                        <rect x="15" y="70" width="15" height="15" fill="#fff" />
                        <rect x="18" y="73" width="9" height="9" fill="#111" />

                        <rect x="42" y="12" width="6" height="6" fill="#111" />
                        <rect x="52" y="20" width="6" height="6" fill="#111" />
                        <rect x="40" y="42" width="20" height="20" fill="#111" />
                        <rect x="45" y="47" width="10" height="10" fill="#9AD72B" />

                        <rect x="68" y="45" width="8" height="8" fill="#111" />
                        <rect x="80" y="55" width="8" height="8" fill="#111" />
                        <rect x="45" y="70" width="8" height="8" fill="#111" />
                        <rect x="68" y="75" width="18" height="8" fill="#111" />
                      </svg>
                    </div>

                    <p className="text-xs text-ink-muted">
                      Scan kode QRIS di atas melalui m-Banking atau e-Wallet apa pun.
                    </p>
                  </div>
                )}

                {selectedMethod === 'briva' && (
                  <div className="space-y-4">
                    <p className="text-xs text-ink-muted">Nomor BRIVA (Virtual Account BRI)</p>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-line">
                      <span className="font-mono text-xl font-bold tracking-wider text-ink">
                        8801 0812 9482 1920
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyVa}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-line text-xs font-bold text-ink hover:bg-gray-100 transition"
                      >
                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Atas Nama: <strong>BillMate Subscription</strong>
                      <br />
                      Transfer dapat dilakukan dari ATM BRI, BRImo, atau transfer antar bank.
                    </p>
                  </div>
                )}

                {selectedMethod === 'cc' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Nomor Kartu</label>
                      <input
                        type="text"
                        maxLength={19}
                        placeholder="4123 •••• •••• 1234"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-ink"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">Berlaku Hingga</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full min-h-[44px] rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-ink mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={3}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full min-h-[44px] rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-ink"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-ink mb-1">Nama Pemegang Kartu</label>
                      <input
                        type="text"
                        placeholder="Sesuai nama pada kartu"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-ink"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Kolom Samping: Ringkasan Tagihan */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-line bg-white p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-ink text-base">Ringkasan Pesanan</h3>

                <div className="space-y-2.5 text-xs text-ink-muted pb-4 border-b border-line">
                  <div className="flex justify-between">
                    <span>Paket</span>
                    <strong className="text-ink">Paket {currentPlan.name} (1 Bulan)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Harga Langganan</span>
                    <span className="text-ink">{formatRupiah(currentPlan.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biaya Layanan</span>
                    <span className="text-ink">{adminFee > 0 ? formatRupiah(adminFee) : 'Gratis'}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-ink">Total Pembayaran</span>
                  <span className="text-xl font-extrabold text-ink">
                    {formatRupiah(totalPayment)}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleSimulatePayment}
                  className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-2xl bg-lime px-4 py-3 text-sm font-bold text-ink transition hover:bg-lime-hover disabled:opacity-50 active:scale-95 shadow-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Memverifikasi Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={18} />
                      <span>Bayar Sekarang ({formatRupiah(totalPayment)})</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-ink-muted/70 text-center leading-relaxed">
                  🔒 Pembayaran dienkripsi secara aman dan paket langsung aktif seketika.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep('plan')}
                className="w-full text-center text-xs font-bold text-ink-muted hover:text-ink py-2"
              >
                ← Ganti Paket Lain
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: SUKSES UPGRADE                                       */}
        {/* ============================================================ */}
        {step === 'success' && (
          <div className="max-w-md mx-auto rounded-3xl border border-line bg-white p-8 text-center shadow-lg space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-lime flex items-center justify-center mx-auto text-ink shadow-md">
              <CheckCircle2 size={44} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-ink">Pembayaran Berhasil!</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                Akun Anda telah resmi ditingkatkan ke <strong>Paket {currentPlan.name}</strong>.
                Seluruh fitur premium dan kuota scan struk sudah aktif seketika.
              </p>
            </div>

            <div className="rounded-2xl bg-[#F8FAF5] p-4 text-left border border-line/70 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">Status Akun:</span>
                <span className="font-bold text-[#75B51B] uppercase">Aktif ({currentPlan.name})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Kuota Auto Scan:</span>
                <strong className="text-ink">{currentPlan.scans}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Metode:</span>
                <span className="text-ink uppercase">{selectedMethod}</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <Link
                to="/split-bill"
                className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-lime px-4 py-3 text-sm font-bold text-ink transition hover:bg-lime-hover shadow-sm"
              >
                <span>Mulai Scan Struk Sekarang</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/profile"
                className="w-full min-h-[44px] flex items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-xs font-bold text-ink hover:bg-gray-100 transition"
              >
                Lihat Profil Akun
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

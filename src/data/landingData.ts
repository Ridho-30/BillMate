export interface ProblemItem {
  id: string;
  title: string;
  description: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  badge?: string;
  features: string[];
  cta: string;
  isPro?: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const PROBLEMS_DATA: ProblemItem[] = [
  {
    id: 'hitung-manual',
    title: 'Hitung tagihan manual',
    description: 'Pembagian saat makan bersama masih pakai kalkulator, dan rawan salah hitung.',
  },
  {
    id: 'catatan-lupa',
    title: 'Catatan pribadi sering lupa',
    description: 'Mencatat tiap pemasukan dan pengeluaran terasa ribet, jadi sulit memantau kondisi keuangan.',
  },
  {
    id: 'uang-kelompok',
    title: 'Uang kelompok berantakan',
    description: 'Trip dan acara organisasi sulit dilacak: siapa sudah bayar, siapa belum, dan kontribusi tiap anggota.',
  },
];

export const FEATURES_DATA: FeatureItem[] = [
  {
    id: 'split-bill',
    title: 'Split Bill',
    description: 'Bagi rata, per item, atau nominal custom. Pajak dan service charge dibagi proporsional otomatis.',
  },
  {
    id: 'auto-scan',
    title: 'Auto Scan Receipt',
    description: 'Foto struk, item dan harga terbaca otomatis, lalu bisa kamu koreksi sebelum disimpan.',
  },
  {
    id: 'group-wallet',
    title: 'Group Wallet',
    description: 'Catat pengeluaran bersama untuk trip, kos, atau organisasi. Saldo utang-piutang tiap anggota terlihat jelas.',
  },
  {
    id: 'catatan-keuangan',
    title: 'Catatan Keuangan',
    description: 'Catat pemasukan dan pengeluaran per kategori, lengkap dengan dashboard ringkas.',
  },
];

export const HOW_IT_WORKS_DATA: HowItWorksStep[] = [
  {
    step: 1,
    title: 'Foto struk',
    description: 'Upload foto atau masukkan item secara manual.',
  },
  {
    step: 2,
    title: 'Pilih siapa makan apa',
    description: 'Hasil pembagian muncul otomatis, termasuk pajak.',
  },
  {
    step: 3,
    title: 'Bagikan dan lacak',
    description: 'Kirim ringkasan ke WhatsApp, lalu tandai siapa yang sudah bayar.',
  },
];

export const PRICING_DATA: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'Rp0',
    features: [
      '3 kategori',
      'Split Bill 3x/bulan',
      'Bonus Split Bill lewat iklan (maks. 2x)',
      'Bisa diundang ke grup',
    ],
    cta: 'Mulai gratis',
    isPro: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 'Rp24.900',
    period: '/bulan',
    features: [
      '5 kategori',
      'Auto Scan 10x/bulan',
      'Split Bill 10x/bulan',
      'Group Wallet 5 anggota',
      'Tanpa iklan',
    ],
    cta: 'Pilih Plus',
    isPro: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Rp29.000',
    period: '/bulan',
    badge: 'Paling Worth It',
    features: [
      'Kategori unlimited',
      'Auto Scan unlimited (fair use 30x)',
      'Split Bill unlimited',
      'Group Wallet 10 anggota + settle up',
      'Tanpa iklan',
    ],
    cta: 'Pilih Pro',
    isPro: true,
  },
];

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'apakah-gratis',
    question: 'Apakah gratis?',
    answer: 'Ya. Paket Free cukup untuk mencoba Split Bill dan catatan keuangan dasar.',
  },
  {
    id: 'teman-punya-akun',
    question: 'Teman harus punya akun?',
    answer: 'Tidak. Teman cukup membuka link hasil Split Bill untuk melihat bagiannya.',
  },
  {
    id: 'keamanan-data',
    question: 'Bagaimana dengan data saya?',
    answer: 'Data keuangan dienkripsi dan tidak dibagikan ke pihak lain. Kebijakan privasi tersedia di footer.',
  },
];

export const SPLIT_BILL_MOCK = {
  title: 'Makan Malam Sabtu',
  memberCount: '3 orang',
  items: [
    { name: 'Nasi Goreng (Tia)', price: 'Rp28.000' },
    { name: 'Ayam Bakar (Bintang)', price: 'Rp35.000' },
    { name: 'Mie Ayam (Ridho)', price: 'Rp22.000' },
    { name: 'Es Teh x3 (dibagi rata)', price: 'Rp15.000' },
    { name: 'Pajak 10%', price: 'Rp10.000' },
  ],
  results: [
    { name: 'Tia', amount: 'Rp36.300', paid: true, statusText: 'Sudah bayar' },
    { name: 'Bintang', amount: 'Rp44.000', paid: false, statusText: 'Belum' },
    { name: 'Ridho', amount: 'Rp29.700', paid: false, statusText: 'Belum' },
  ],
  ctaText: 'Bagikan ke WhatsApp',
};


# BillMate — Landing Page (MVP Fase 1)

Landing page responsif mobile-first untuk **BillMate** ("One Place for All Your Finances") yang dibangun menggunakan React, Vite, TypeScript, dan Tailwind CSS.

## Fitur & Implementasi
- **Mobile-First Design**: Dioptimalkan mulai dari lebar layar 390px hingga 1440px tanpa scroll horizontal.
- **Design Tokens Khusus**:
  - `lime`: `#9AD72B` (Aksen utama / tombol)
  - `lime-hover`: `#86C21F`
  - `lime-soft`: `#D6F0A2`
  - `lime-tint`: `#EEF8D3` (Latar HowItWorks)
  - `ink`: `#111111` (Teks utama)
  - `ink-muted`: `#4B5240` (Teks pendukung)
  - `dark`: `#161A0E` (Latar gelap)
  - `dark-card`: `#232A16` (Kartu di atas dark)
  - `dark-text`: `#E6EBD9` (Teks di atas dark)
  - `line`: `#E3E7DA` (Border)
- **Komponen Modular**:
  - `Navbar`: Sticky header dengan logo wordmark italic & outline, tautan navigasi desktop, tombol masuk.
  - `Hero`: Tagline, pill kategori, H1, deskripsi, CTA ganda, dan kartu SplitBillMock.
  - `SplitBillMock`: Simulasi struk makan malam 3 orang (Tia, Bintang, Ridho) dengan total pas Rp110.000.
  - `Problems`: Section gelap dengan 3 masalah utama.
  - `Features`: 4 fitur utama dalam grid responsif.
  - `HowItWorks`: Latar lime-tint dengan 3 langkah bernomor.
  - `Pricing`: 3 paket harga (Free, Plus, Pro) dengan urutan responsif (Mobile: Pro, Plus, Free; Desktop: Free, Plus, Pro).
  - `Faq`: Accordion interaktif dengan tombol dan `aria-expanded`.
  - `FinalCta`: Section gelap dengan tombol lime.
  - `Footer`: Attribution Kelompok 5 dan tautan placeholder.
  - `StickyCta`: Bar cepat khusus mobile dengan safe area inset.
  - `WaitlistModal`: Modal interaktif dengan validasi input email dan state sukses lokal.

## Cara Menjalankan

### 1. Menjalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Buka browser di `http://localhost:5173`.

### 2. Membangun untuk Produksi (Build)
```bash
npm run build
```

### 3. Meninjau Hasil Build (Preview)
```bash
npm run preview
```


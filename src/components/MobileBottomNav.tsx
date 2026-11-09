import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, History, Wallet, User } from 'lucide-react';
import { auth } from '../firebase';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ScanReceiptModal } from './ScanReceiptModal';

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Navbar bawah mobile HANYA muncul ketika pengguna sudah login
  if (!currentUser) {
    return null;
  }

  // Sembunyikan juga di halaman autentikasi
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const currentPath = location.pathname;

  const isBerandaActive = currentPath === '/dashboard';
  const isRiwayatActive = currentPath === '/personal-finance';
  const isScanActive = currentPath === '/split-bill' || currentPath === '/coba';
  const isBudgetActive = currentPath === '/personal-finance/budget';
  const isProfilActive = currentPath === '/profile';

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#D8F29E] border-t border-[#C7E885] rounded-t-[26px] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-2 pb-safe"
      aria-label="Navigasi Bawah Mobile"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto relative">
        {/* 1. Beranda -> Dashboard */}
        <Link
          to="/dashboard"
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-all ${isBerandaActive
            ? 'text-ink font-bold'
            : 'text-[#445228] hover:text-ink font-medium'
            }`}
        >
          <Home
            size={22}
            className={`transition-transform duration-200 ${isBerandaActive ? 'scale-110 stroke-[2.4px]' : 'stroke-[1.8px]'
              }`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight">Beranda</span>
        </Link>

        {/* 2. Riwayat -> Personal Finance */}
        <Link
          to="/personal-finance"
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-all ${isRiwayatActive
            ? 'text-ink font-bold'
            : 'text-[#445228] hover:text-ink font-medium'
            }`}
        >
          <History
            size={22}
            className={`transition-transform duration-200 ${isRiwayatActive ? 'scale-110 stroke-[2.4px]' : 'stroke-[1.8px]'
              }`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight">Riwayat</span>
        </Link>

        {/* 3. Tombol Tengah Terapung (Scan Struk Langsung Kamera/Galeri) */}
        <div className="flex-1 flex items-center justify-center h-full relative">
          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            aria-label="Scan Struk dan Split Bill"
            className={`absolute -top-6 flex items-center justify-center w-[60px] h-[60px] rounded-full bg-[#B2E64C] shadow-[0_6px_18px_rgba(0,0,0,0.2)] text-ink transition-all duration-200 active:scale-95 hover:scale-105 cursor-pointer z-10 border-2 ${isScanActive ? 'border-ink' : 'border-[#9FD639]'
              }`}
          >
            {/* Custom Scan + Plus Icon sesuai desain di screenshot */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#111111"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 8V6a2 2 0 0 1 2-2h2" />
              <path d="M4 16v2a2 2 0 0 0 2 2h2" />
              <path d="M16 4h2a2 2 0 0 1 2 2v2" />
              <path d="M16 20h2a2 2 0 0 0 2-2v-2" />
              <line x1="12" y1="9" x2="12" y2="15" />
              <line x1="9" y1="12" x2="15" y2="12" />
            </svg>
          </button>
        </div>

        {/* 4. Budget -> Personal Finance Budget */}
        <Link
          to="/personal-finance/budget"
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-all ${isBudgetActive
            ? 'text-ink font-bold'
            : 'text-[#445228] hover:text-ink font-medium'
            }`}
        >
          <Wallet
            size={22}
            className={`transition-transform duration-200 ${isBudgetActive ? 'scale-110 stroke-[2.4px]' : 'stroke-[1.8px]'
              }`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight">Budget</span>
        </Link>

        {/* 5. Profil -> Akun / Login / Logout di Dashboard */}
        <button
          type="button"
          onClick={handleProfileClick}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-all ${isProfilActive
            ? 'text-ink font-bold'
            : 'text-[#445228] hover:text-ink font-medium'
            }`}
        >
          <User
            size={22}
            className={`transition-transform duration-200 ${isProfilActive ? 'scale-110 stroke-[2.4px]' : 'stroke-[1.8px]'
              }`}
          />
          <span className="text-[11px] mt-0.5 tracking-tight">Profil</span>
        </button>
      </div>

      {/* Modal Pilihan Sumber Foto (Kamera / Galeri / Contoh) */}
      <ScanReceiptModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />
    </nav>
  );
}


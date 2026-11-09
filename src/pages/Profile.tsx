import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  Mail,
  ShieldCheck,
  Sparkles,
  LogOut,
  Calendar,
  Receipt,
  ArrowRight,
} from 'lucide-react';
import { auth } from '../firebase';
import { Navbar } from '../components/Navbar';
import { getReceiptScanQuota, UserQuota } from '../lib/supabase';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<UserQuota | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // Jika belum login, arahkan ke halaman login
        navigate('/login', { replace: true });
        return;
      }
      setUser(currentUser);
      setLoading(false);

      const q = await getReceiptScanQuota();
      setQuota(q);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Gagal logout:', error);
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-lime border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-ink-muted">Memuat data profil...</p>
        </div>
      </div>
    );
  }

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Pengguna BillMate';
  const email = user?.email || 'Tidak ada email';
  const photoURL = user?.photoURL;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAF5] text-ink font-sans pb-28 md:pb-12">
      <Navbar />

      <main className="max-w-2xl mx-auto px-5 py-8 md:py-12">
        {/* Header Profil */}
        <div className="rounded-3xl border border-line bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="w-24 h-24 rounded-full border-4 border-lime/40 object-cover shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-lime flex items-center justify-center text-3xl font-extrabold text-ink shadow-sm">
                {initial}
              </div>
            )}

            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold text-ink">{displayName}</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-lime/25 px-2.5 py-0.5 text-xs font-bold text-ink">
                  <ShieldCheck size={13} />
                  Akun Terverifikasi
                </span>
              </div>

              <p className="text-sm text-ink-muted flex items-center justify-center sm:justify-start gap-1.5">
                <Mail size={15} />
                <span>{email}</span>
              </p>

              <p className="text-xs text-ink-muted/70 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                <Calendar size={14} />
                <span>
                  Bergabung sejak{' '}
                  {user?.metadata.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString('id-ID', {
                      month: 'long',
                      year: 'numeric',
                    })
                    : '2026'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Informasi Kuota Scan & Paket */}
        <div className="mt-6 rounded-3xl border border-line bg-white p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime/30 text-ink">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="font-bold text-ink text-base">Paket & Kuota Scan</h2>
                <p className="text-xs text-ink-muted">Status fitur Auto Scan Struk</p>
              </div>
            </div>

            <span className="rounded-full bg-dark px-3 py-1 text-xs font-bold text-lime uppercase tracking-wide">
              {quota?.plan || 'Plus'}
            </span>
          </div>

          <div className="rounded-2xl bg-[#F8FAF5] p-4 border border-line/70">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-ink-muted font-medium">Sisa Kuota Scan Bulan Ini</span>
              <span className="font-bold text-ink">
                {quota?.remaining ?? 7} dari {quota?.total ?? 10} scan
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-lime transition-all duration-300"
                style={{
                  width: `${quota?.total
                      ? Math.min(100, ((quota.total - (quota.remaining ?? 0)) / quota.total) * 100)
                      : 30
                    }%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-ink-muted/80">
              Kuota diperbarui setiap awal bulan kalender sesuai paket akun Anda.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link
              to="/split-bill"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-lime px-4 py-2 text-xs font-bold text-ink transition hover:bg-lime-hover"
            >
              <Receipt size={16} />
              <span>Gunakan Scan Struk</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              to="/#pricing"
              className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-line px-4 py-2 text-xs font-bold text-ink transition hover:bg-gray-100"
            >
              <span>Upgrade Paket</span>
            </Link>
          </div>
        </div>

        {/* Tombol Keluar (Logout) */}
        <div className="mt-6 rounded-3xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink text-sm">Keluar dari Akun</h3>
              <p className="text-xs text-ink-muted">Akhiri sesi aktif Anda di perangkat ini</p>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 active:scale-95"
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </main>

      {/* Modal Konfirmasi Logout */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => !isLoggingOut && setShowLogoutConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-5 mx-auto text-red-600">
              <LogOut size={28} />
            </div>

            <h3 className="text-lg font-bold text-center text-ink mb-2">
              Konfirmasi Keluar
            </h3>

            <p className="text-gray-500 text-xs text-center leading-relaxed mb-6">
              Apakah Anda yakin ingin keluar dari akun <strong className="text-ink">{displayName}</strong>?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-line font-bold text-xs text-ink hover:bg-gray-100 transition"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition"
              >
                {isLoggingOut ? 'Memproses...' : 'Ya, Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

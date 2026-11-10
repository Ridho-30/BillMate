
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';

import {
  Wallet,
  ReceiptText,
  Users,
  ArrowRight,
  LogOut,
  X,
} from 'lucide-react';

import { auth } from '../firebase';

export default function Dashboard() {
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Logout dengan konfirmasi
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

  return (
    <div className="min-h-screen bg-[#F8FAF5] text-gray-900">

      {/* Navbar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

          <h1 className="text-3xl font-black italic">
            Bill<span className="text-[#91D624]">Mate</span>
          </h1>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 transition"
          >
            <LogOut size={18} />
            <span className="font-semibold text-sm">Keluar</span>
          </button>

        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-6xl mx-auto px-6 py-14">

        {/* Welcome Section */}
        <div className="mb-10">

          <p className="text-sm font-bold text-[#75B51B] uppercase tracking-wider mb-3">
            Dashboard
          </p>

          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Selamat Datang di BillMate!
          </h2>

          <p className="text-gray-500 text-base md:text-lg">
            Kelola keuangan pribadi dan bersama dengan lebih mudah.
            Pilih fitur yang ingin kamu gunakan.
          </p>

        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Personal Finance */}
          <div className="bg-white border-2 border-[#91D624] rounded-2xl p-7 hover:shadow-lg transition duration-300">

            <div className="w-14 h-14 bg-[#EFF9DE] rounded-xl flex items-center justify-center mb-6">
              <Wallet size={28} className="text-[#75B51B]" />
            </div>

            <h3 className="text-xl font-bold mb-3">
              Personal Finance
            </h3>

            <p className="text-gray-500 text-sm leading-relaxed mb-7">
              Catat pemasukan dan pengeluaran serta pantau kondisi
              keuangan pribadimu dalam satu tempat.
            </p>

            <button
              type="button"
              onClick={() => navigate('/personal-finance')}
              className="w-full flex items-center justify-center gap-2 bg-[#91D624] hover:bg-[#82C51C] text-black font-bold py-3 rounded-xl transition"
            >
              Buka Fitur
              <ArrowRight size={18} />
            </button>

          </div>

          {/* Split Bill */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 hover:shadow-lg transition duration-300">

            <div className="w-14 h-14 bg-[#EFF9DE] rounded-xl flex items-center justify-center mb-6">
              <ReceiptText size={28} className="text-[#75B51B]" />
            </div>

            <h3 className="text-xl font-bold mb-3">
              Split Bill
            </h3>

            <p className="text-gray-500 text-sm leading-relaxed mb-7">
              Bagi tagihan bersama teman dengan mudah. Hitung
              pengeluaran setiap orang tanpa ribet.
            </p>

            <button
              type="button"
              onClick={() => navigate('/split-bill')}
              className="w-full flex items-center justify-center gap-2 bg-[#91D624] hover:bg-[#82C51C] text-black font-bold py-3 rounded-xl transition"
            >
              Buka Fitur
              <ArrowRight size={18} />
            </button>

          </div>

          {/* Group Wallet */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 hover:shadow-lg transition duration-300">

            <div className="w-14 h-14 bg-[#EFF9DE] rounded-xl flex items-center justify-center mb-6">
              <Users size={28} className="text-[#75B51B]" />
            </div>

            <h3 className="text-xl font-bold mb-3">
              Group Wallet
            </h3>

            <p className="text-gray-500 text-sm leading-relaxed mb-7">
              Kelola uang bersama, pantau transaksi kelompok,
              dan atur keuangan bersama anggota.
            </p>

            <button
              type="button"
              onClick={() => navigate('/group-wallet')}
              className="w-full flex items-center justify-center gap-2 bg-[#91D624] hover:bg-[#82C51C] text-black font-bold py-3 rounded-xl transition"
            >
              Buka Fitur
              <ArrowRight size={18} />
            </button>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="text-center py-6 pb-24 md:py-6 text-sm text-gray-400">
        © 2026 BillMate. All rights reserved.
      </footer>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => {
            if (!isLoggingOut) {
              setShowLogoutConfirm(false);
            }
          }}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="text-gray-400 hover:text-gray-700 transition disabled:opacity-50"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Icon */}
            <div className="w-16 h-16 bg-[#EFF9DE] rounded-full flex items-center justify-center mb-5 mx-auto">
              <LogOut size={28} className="text-[#75B51B]" />
            </div>

            {/* Title */}
            <h3
              id="logout-title"
              className="text-xl font-bold text-center mb-2"
            >
              Konfirmasi Logout
            </h3>

            {/* Description */}
            <p className="text-gray-500 text-sm text-center leading-relaxed mb-7">
              Apakah kamu yakin ingin keluar dari akun BillMate?
              Pastikan semua aktivitasmu sudah selesai.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">

              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={isLoggingOut}
                className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 py-3 rounded-xl bg-[#91D624] hover:bg-[#82C51C] text-black font-bold transition disabled:opacity-60"
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

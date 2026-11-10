
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simpan sesi login di browser
      await setPersistence(auth, browserLocalPersistence);

      await signInWithEmailAndPassword(auth, email, password);

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(
        err.code === 'auth/invalid-credential'
          ? 'Email atau password salah.'
          : err.code === 'auth/invalid-email'
          ? 'Format email tidak valid.'
          : 'Login gagal. Silakan coba kembali.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);

      await signInWithPopup(auth, googleProvider);

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(
        err.code === 'auth/popup-closed-by-user'
          ? 'Login Google dibatalkan.'
          : 'Login Google gagal. Silakan coba kembali.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <Link to="/" className="block text-center mb-8">
          <span className="text-3xl font-black italic">
            Bill<span className="text-lime-500">Mate</span>
          </span>
        </Link>

        <div className="border border-gray-200 rounded-3xl p-7 sm:p-9 shadow-sm">

          <div className="mb-7">
            <h1 className="text-3xl font-bold text-gray-900">
              Selamat Datang!
            </h1>
            <p className="text-gray-500 mt-2">
              Masuk ke akun BillMate kamu.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-20 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                >
                  {showPassword ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime-500 hover:bg-lime-600 disabled:opacity-60 text-black font-bold py-3 rounded-xl transition-all"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>

          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">atau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full border border-gray-300 hover:bg-gray-50 disabled:opacity-60 rounded-xl py-3 font-semibold flex items-center justify-center gap-3 transition-all"
          >
            <span className="text-xl font-bold text-blue-600">G</span>
            Masuk dengan Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-7">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="font-bold text-lime-600 hover:text-lime-700"
            >
              Daftar sekarang
            </Link>
          </p>

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 BillMate. All rights reserved.
        </p>

      </div>
    </div>
  );
}

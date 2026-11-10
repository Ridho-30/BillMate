
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

import { auth, googleProvider } from '../firebase';

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      // Simpan sesi login di browser
      await setPersistence(auth, browserLocalPersistence);

      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(result.user, {
        displayName: name.trim(),
      });

      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email sudah terdaftar. Silakan login.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password terlalu lemah.');
      } else {
        setError('Registrasi gagal. Silakan coba kembali.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);

    try {
      await setPersistence(auth, browserLocalPersistence);

      await signInWithPopup(auth, googleProvider);

      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      setError(
        err.code === 'auth/popup-closed-by-user'
          ? 'Pendaftaran Google dibatalkan.'
          : 'Pendaftaran Google gagal.'
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
              Buat Akun Baru
            </h1>
            <p className="text-gray-500 mt-2">
              Bergabung dengan BillMate dan mulai kelola tagihanmu.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">

            <div>
              <label className="block text-sm font-semibold mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
              />
            </div>

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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                minLength={6}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Konfirmasi Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                minLength={6}
                required
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-lime-500 focus:ring-2 focus:ring-lime-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-lime-500 hover:bg-lime-600 disabled:opacity-60 text-black font-bold py-3 rounded-xl transition-all"
            >
              {loading ? 'Membuat akun...' : 'Daftar Sekarang'}
            </button>

          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">atau</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full border border-gray-300 hover:bg-gray-50 disabled:opacity-60 rounded-xl py-3 font-semibold flex items-center justify-center gap-3 transition-all"
          >
            <span className="text-xl font-bold text-blue-600">G</span>
            Daftar dengan Google
          </button>

          <p className="text-center text-sm text-gray-500 mt-7">
            Sudah punya akun?{' '}
            <Link
              to="/login"
              className="font-bold text-lime-600 hover:text-lime-700"
            >
              Masuk sekarang
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

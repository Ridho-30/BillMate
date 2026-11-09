
import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ArrowLeft,
  Wallet,
  Plus,
  X,
  Trash2,
  Utensils,
  CarFront,
  Gamepad2,
  ShoppingBag,
  HeartPulse,
  MoreHorizontal,
} from 'lucide-react';

import {
  getBudgets,
  saveBudgets,
  type BudgetItem,
} from '../data/budgetStorage';

const BALANCE_STORAGE_KEY = 'billmate_balance';

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const getCategoryIcon = (category: string) => {
  const name = category.toLowerCase();

  if (name.includes('makan')) return Utensils;
  if (name.includes('transport')) return CarFront;
  if (name.includes('hiburan')) return Gamepad2;
  if (name.includes('belanja')) return ShoppingBag;
  if (name.includes('kesehatan')) return HeartPulse;

  return MoreHorizontal;
};

const getSavedBalance = () => {
  const savedBalance = localStorage.getItem(BALANCE_STORAGE_KEY);

  if (savedBalance === null) return 1000000;

  const parsedBalance = Number(savedBalance);

  return Number.isFinite(parsedBalance) && parsedBalance >= 0
    ? parsedBalance
    : 1000000;
};

export default function Budget() {
  const navigate = useNavigate();

  // SALDO PENGGUNA
  const [balance, setBalance] = useState<number>(getSavedBalance);

  // BUDGET
  const [budgets, setBudgets] = useState<BudgetItem[]>(() =>
    getBudgets()
  );

  // Menghitung total budget yang belum terpakai
  const allocatedBudget = useMemo(() => {
    return budgets.reduce(
      (total, budget) =>
        total + Math.max(budget.limit - budget.used, 0),
      0
    );
  }, [budgets]);

  // Saldo yang masih bisa dialokasikan untuk budget baru
  const availableBalance = Math.max(
    balance - allocatedBudget,
    0
  );

  // MODAL TAMBAH BUDGET
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('Makanan');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  // MODAL HAPUS BUDGET
  const [budgetToDelete, setBudgetToDelete] =
    useState<BudgetItem | null>(null);

  // Memperbarui saldo apabila berubah dari tab browser lain
  useState(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === BALANCE_STORAGE_KEY) {
        const newBalance = Number(event.newValue);

        setBalance(
          Number.isFinite(newBalance) && newBalance >= 0
            ? newBalance
            : 0
        );
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  });

  // BUKA MODAL TAMBAH
  const openAddModal = () => {
    setCategory('Makanan');
    setAmount('');
    setError('');
    setShowModal(true);
  };

  // TAMBAH BUDGET
  const handleAddBudget = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError('Masukkan nominal budget yang valid.');
      return;
    }

    // Validasi saldo yang tersedia
    if (numericAmount > availableBalance) {
      setError(
        `Nominal melebihi saldo yang tersedia. Maksimal budget adalah ${formatRupiah(availableBalance)}.`
      );
      return;
    }

    const newBudget: BudgetItem = {
      id: Date.now(),
      name: category,
      limit: numericAmount,
      used: 0,
    };

    const updatedBudgets = [...budgets, newBudget];

    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);

    setCategory('Makanan');
    setAmount('');
    setError('');
    setShowModal(false);
  };

  // HAPUS BUDGET
  const handleDeleteBudget = () => {
    if (!budgetToDelete) return;

    const updatedBudgets = budgets.filter(
      (budget) => budget.id !== budgetToDelete.id
    );

    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);

    setBudgetToDelete(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF5] text-gray-900">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">

          <button
            onClick={() => navigate('/personal-finance')}
            className="p-2 rounded-xl hover:bg-gray-100 transition"
            aria-label="Kembali"
          >
            <ArrowLeft size={22} />
          </button>

          <h1 className="text-2xl font-black italic">
            Bill<span className="text-[#91D624]">Mate</span>
          </h1>

          <span className="text-gray-300">|</span>

          <h2 className="font-semibold text-gray-700">
            Atur Budget
          </h2>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* INFORMATION BANNER */}
        <div className="bg-[#DDF5AC] rounded-2xl p-6 md:p-7 flex items-center gap-5 mb-8 shadow-sm">

          <div className="w-14 h-14 shrink-0 bg-[#91D624] rounded-full flex items-center justify-center">
            <Wallet size={27} className="text-white" />
          </div>

          <div>
            <h2 className="font-bold text-lg mb-1">
              Kelola budget sesuai kebutuhanmu
            </h2>

            <p className="text-sm text-gray-600 leading-relaxed">
              Atur dan pantau setiap pengeluaranmu agar
              keuangan tetap terkontrol.
            </p>
          </div>

        </div>

        {/* SALDO INFORMATION */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10 shadow-sm">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div>
              <p className="text-sm text-gray-500 mb-2">
                Total Saldo Saat Ini
              </p>

              <h3 className="text-2xl font-bold">
                {formatRupiah(balance)}
              </h3>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-2">
                Saldo Belum Dialokasikan
              </p>

              <h3 className="text-2xl font-bold text-[#75B51B]">
                {formatRupiah(availableBalance)}
              </h3>
            </div>

          </div>

          <div className="mt-5 w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#91D624] rounded-full transition-all"
              style={{
                width: `${
                  balance > 0
                    ? Math.min(
                        (allocatedBudget / balance) * 100,
                        100
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Saldo belum dialokasikan merupakan saldo yang
            masih dapat digunakan untuk membuat budget baru.
          </p>

        </div>

        {/* BUDGET HEADING */}
        <div className="flex items-center justify-between mb-6">

          <div>
            <h2 className="text-2xl font-bold">
              Budget Aktif
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Pantau penggunaan anggaranmu.
            </p>
          </div>

          <span className="text-sm font-semibold bg-[#EFF9DE] text-[#639B18] px-4 py-2 rounded-full">
            {budgets.length} Budget
          </span>

        </div>

        {/* BUDGET CARDS */}
        {budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {budgets.map((budget) => {
              const Icon = getCategoryIcon(budget.name);

              const percentage =
                budget.limit > 0
                  ? Math.min(
                      (budget.used / budget.limit) * 100,
                      100
                    )
                  : 0;

              const remaining = Math.max(
                budget.limit - budget.used,
                0
              );

              return (
                <div
                  key={budget.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
                >

                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-3 mb-5">

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 shrink-0 rounded-xl bg-[#EFF9DE] flex items-center justify-center">
                        <Icon
                          size={21}
                          className="text-[#75B51B]"
                        />
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">
                          Budget {budget.name}
                        </p>

                        <h3 className="text-xl font-bold">
                          {formatRupiah(budget.limit)}
                        </h3>
                      </div>

                    </div>

                    {/* DELETE BUTTON */}
                    <button
                      type="button"
                      onClick={() => setBudgetToDelete(budget)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition text-sm font-semibold shrink-0"
                      aria-label={`Hapus budget ${budget.name}`}
                    >
                      <Trash2 size={16} />
                      Hapus
                    </button>

                  </div>

                  {/* PROGRESS */}
                  <div className="mb-3">

                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>Penggunaan budget</span>

                      <span className="font-semibold text-gray-700">
                        {Math.round(percentage)}%
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">

                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          percentage >= 90
                            ? 'bg-red-500'
                            : 'bg-[#91D624]'
                        }`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* DETAILS */}
                  <div className="flex justify-between items-center text-xs mt-4">

                    <span className="text-gray-500">
                      Terpakai: {formatRupiah(budget.used)}
                    </span>

                    <span className="font-semibold text-[#75B51B]">
                      Sisa {formatRupiah(remaining)}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">

            <Wallet
              size={40}
              className="mx-auto text-gray-300 mb-4"
            />

            <h3 className="font-bold text-lg mb-2">
              Belum Ada Budget
            </h3>

            <p className="text-sm text-gray-500">
              Mulai atur anggaran untuk mengelola pengeluaranmu.
            </p>

          </div>
        )}

        {/* ADD BUTTON */}
        <button
          onClick={openAddModal}
          className="w-full mt-8 bg-[#DDF5AC] hover:bg-[#CBEF8B] text-gray-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
        >
          <Plus size={20} />
          Tambah Budget
        </button>

      </main>

      {/* ADD BUDGET MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 py-6"
          onClick={() => setShowModal(false)}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-budget-title"
            className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex justify-between items-center mb-6">

              <h2
                id="add-budget-title"
                className="text-xl font-bold"
              >
                Tambah Budget
              </h2>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Tutup"
              >
                <X size={22} />
              </button>

            </div>

            {/* AVAILABLE BALANCE */}
            <div className="bg-[#EFF9DE] rounded-xl p-4 mb-5">

              <p className="text-xs text-gray-500 mb-1">
                Maksimal budget yang dapat ditambahkan
              </p>

              <p className="text-lg font-bold text-[#639B18]">
                {formatRupiah(availableBalance)}
              </p>

            </div>

            <form onSubmit={handleAddBudget}>

              {/* CATEGORY */}
              <label className="block text-sm font-semibold mb-2">
                Kategori Budget
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-5 outline-none focus:border-[#91D624]"
              >
                <option value="Makanan">Makanan</option>
                <option value="Transportasi">Transportasi</option>
                <option value="Hiburan">Hiburan</option>
                <option value="Belanja">Belanja</option>
                <option value="Kesehatan">Kesehatan</option>
                <option value="Lainnya">Lainnya</option>
              </select>

              {/* AMOUNT */}
              <label className="block text-sm font-semibold mb-2">
                Nominal Budget
              </label>

              <div className={`flex items-center border rounded-xl px-4 mb-3 focus-within:border-[#91D624] ${
                error ? 'border-red-400' : 'border-gray-300'
              }`}>

                <span className="text-gray-500 font-semibold mr-2">
                  Rp
                </span>

                <input
                  type="number"
                  min="1"
                  max={availableBalance}
                  step="1"
                  value={amount}
                  onChange={(e) => {
                    const value = e.target.value;

                    setAmount(value);

                    if (
                      value &&
                      Number(value) > availableBalance
                    ) {
                      setError(
                        `Nominal tidak boleh melebihi ${formatRupiah(availableBalance)}.`
                      );
                    } else {
                      setError('');
                    }
                  }}
                  placeholder="Contoh: 500000"
                  className="w-full py-3 outline-none"
                  required
                />

              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <p className="text-sm text-red-500 mb-4">
                  {error}
                </p>
              )}

              {availableBalance <= 0 && (
                <p className="text-sm text-red-500 mb-4">
                  Saldo belum mencukupi untuk menambahkan budget baru.
                  Hapus atau sesuaikan budget yang sudah ada, atau tambahkan saldo terlebih dahulu.
                </p>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-3 mt-6">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold hover:bg-gray-100 transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    !amount ||
                    Number(amount) <= 0 ||
                    Number(amount) > availableBalance ||
                    availableBalance <= 0
                  }
                  className="flex-1 py-3 rounded-xl bg-[#91D624] hover:bg-[#82C51C] font-bold transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Simpan Budget
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {budgetToDelete && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setBudgetToDelete(null)}
        >

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-budget-title"
            className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* CLOSE */}
            <div className="flex justify-end">

              <button
                type="button"
                onClick={() => setBudgetToDelete(null)}
                className="text-gray-400 hover:text-gray-700 transition"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>

            </div>

            {/* ICON */}
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 mx-auto">
              <Trash2
                size={28}
                className="text-red-500"
              />
            </div>

            {/* TITLE */}
            <h3
              id="delete-budget-title"
              className="text-xl font-bold text-center mb-2"
            >
              Hapus Budget?
            </h3>

            {/* DESCRIPTION */}
            <p className="text-gray-500 text-sm text-center leading-relaxed mb-7">

              Apakah kamu yakin ingin menghapus budget{' '}

              <span className="font-bold text-gray-800">
                {budgetToDelete.name}
              </span>

              {' '}sebesar{' '}

              <span className="font-bold text-gray-800">
                {formatRupiah(budgetToDelete.limit)}
              </span>

              ? Budget yang dihapus tidak dapat dikembalikan.

            </p>

            {/* ACTIONS */}
            <div className="flex gap-3">

              <button
                type="button"
                onClick={() => setBudgetToDelete(null)}
                className="flex-1 py-3 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDeleteBudget}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition"
              >
                Ya, Hapus
              </button>

            </div>

          </div>

        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center py-6 pb-24 md:py-6 text-sm text-gray-400">
        © 2026 BillMate. All rights reserved.
      </footer>

    </div>
  );
}

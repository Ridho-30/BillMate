import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Utensils,
  CarFront,
  Gamepad2,
  ShoppingBag,
  CalendarDays,
  X,
  ReceiptText,
  HeartPulse,
  MoreHorizontal,
} from 'lucide-react';

import { auth } from '../firebase';

import {
  getBudgets,
  saveBudgets,
  type BudgetItem,
} from '../data/budgetStorage';

type Transaction = {
  id: number;
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const getBudgetIcon = (name: string) => {
  const category = name.toLowerCase();

  if (category.includes('makan')) return Utensils;
  if (category.includes('transport')) return CarFront;
  if (category.includes('hiburan')) return Gamepad2;
  if (category.includes('belanja')) return ShoppingBag;
  if (category.includes('kesehatan')) return HeartPulse;

  return MoreHorizontal;
};

export default function PersonalFinance() {
  const navigate = useNavigate();

  const userName =
    auth.currentUser?.displayName?.split(' ')[0] || 'User';

  // SALDO
  // Membaca saldo yang sebelumnya tersimpan
  const [balance, setBalance] = useState<number>(() => {
    const savedBalance = localStorage.getItem('billmate_balance');

    if (savedBalance !== null) {
      const parsedBalance = Number(savedBalance);

      return Number.isFinite(parsedBalance)
        ? parsedBalance
        : 1000000;
    }

    return 1000000;
  });

  const [income] = useState(2500000);
  const [expense, setExpense] = useState(1500000);

  // Menyimpan saldo setiap kali berubah
  useEffect(() => {
    localStorage.setItem(
      'billmate_balance',
      String(balance)
    );
  }, [balance]);

  // BUDGET
  const [budgets, setBudgets] = useState<BudgetItem[]>(() =>
    getBudgets()
  );

  // TRANSAKSI
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      title: 'Makan siang',
      category: 'Makanan',
      amount: 35000,
      type: 'expense',
      date: '5 Nov 2026',
    },
    {
      id: 2,
      title: 'Uang bulanan',
      category: 'Pemasukan',
      amount: 2500000,
      type: 'income',
      date: '1 Nov 2026',
    },
    {
      id: 3,
      title: 'Transportasi',
      category: 'Transportasi',
      amount: 25000,
      type: 'expense',
      date: '4 Nov 2026',
    },
    {
      id: 4,
      title: 'Belanja kebutuhan',
      category: 'Belanja',
      amount: 150000,
      type: 'expense',
      date: '3 Nov 2026',
    },
  ]);

  // MODAL TRANSAKSI
  const [showModal, setShowModal] = useState(false);

  // MODAL TAMBAH SALDO (TERPISAH DARI TRANSAKSI)
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceError, setBalanceError] = useState('');

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [transactionError, setTransactionError] = useState('');

  // Kategori pengeluaran hanya berasal dari budget yang sudah dibuat.
  const expenseCategories = budgets.map((budget) => budget.name);

  const [date, setDate] = useState(
    new Date().toLocaleDateString('en-CA')
  );

  const currentMonth = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // MEMBUKA MODAL TAMBAH SALDO
  const openAddBalanceModal = () => {
    setBalanceAmount('');
    setBalanceError('');
    setShowAddBalanceModal(true);
  };

  // MENAMBAHKAN SALDO TANPA MEMBUAT RIWAYAT TRANSAKSI
  const handleAddBalance = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const numericAmount = Number(balanceAmount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setBalanceError('Masukkan nominal saldo yang valid.');
      return;
    }

    setBalance((prev) => prev + numericAmount);
    setShowAddBalanceModal(false);
    setBalanceAmount('');
    setBalanceError('');
  };

  // MEMBUKA MODAL PENGELUARAN
  const openModal = () => {
    setTitle('');
    setAmount('');
    setCategory(expenseCategories[0] ?? '');
    setTransactionError('');
    setDate(new Date().toLocaleDateString('en-CA'));
    setShowModal(true);
  };

  // MENAMBAHKAN TRANSAKSI PENGELUARAN
  const handleAddTransaction = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const numericAmount = Number(amount);

    if (
      !title.trim() ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setTransactionError(
        'Lengkapi nama transaksi dan masukkan nominal yang valid.'
      );
      return;
    }

    // Pengeluaran wajib memakai kategori yang sudah memiliki budget.
    const selectedBudget = budgets.find(
      (budget) =>
        budget.name.toLowerCase() === category.toLowerCase()
    );

    if (!selectedBudget) {
      setTransactionError(
        budgets.length === 0
          ? 'Kamu belum memiliki budget. Buat budget terlebih dahulu sebelum mencatat pengeluaran.'
          : 'Pilih kategori yang sudah memiliki budget.'
      );
      return;
    }

    // Pengeluaran tidak boleh melebihi sisa budget kategori terpilih.
    const remainingBudget = Math.max(
      selectedBudget.limit - selectedBudget.used,
      0
    );

    if (numericAmount > remainingBudget) {
      setTransactionError(
        `Nominal melebihi sisa budget ${selectedBudget.name}. Sisa budget: ${formatRupiah(remainingBudget)}.`
      );
      return;
    }

    setTransactionError('');

    const newTransaction: Transaction = {
      id: Date.now(),
      title: title.trim(),
      category,
      amount: numericAmount,
      type: 'expense',
      date: new Date(`${date}T00:00:00`).toLocaleDateString(
        'id-ID',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }
      ),
    };

    setTransactions((prev) => [
      newTransaction,
      ...prev,
    ]);

    // UPDATE SALDO DAN TOTAL PENGELUARAN
    setBalance((prev) => prev - numericAmount);
    setExpense((prev) => prev + numericAmount);

    // UPDATE PENGGUNAAN BUDGET
    const updatedBudgets = budgets.map((budget) =>
      budget.id === selectedBudget.id
        ? {
            ...budget,
            used: budget.used + numericAmount,
          }
        : budget
    );

    setBudgets(updatedBudgets);
    saveBudgets(updatedBudgets);

    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF5] text-gray-900">

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl hover:bg-gray-100 transition"
            >
              <ArrowLeft size={22} />
            </button>

            <h1 className="text-2xl font-black italic">
              Bill<span className="text-[#91D624]">Mate</span>
            </h1>

          </div>

          <div className="flex items-center gap-3">

            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold">
                {userName}
              </p>

              <p className="text-xs text-gray-400">
                Personal Finance
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#E8F7CE] flex items-center justify-center font-bold text-[#659B19]">
              {userName.charAt(0).toUpperCase()}
            </div>

          </div>

        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* GREETING */}
        <div className="mb-8">

          <p className="text-sm font-bold text-[#75B51B] uppercase tracking-wider mb-2">
            PERSONAL FINANCE
          </p>

          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            Halo, {userName}! 👋
          </h2>

          <p className="text-gray-500">
            Atur keuangan pribadimu dan capai tujuan finansialmu.
          </p>

        </div>

        {/* BALANCE CARD */}
        <div className="bg-[#D7F3A5] rounded-3xl p-7 md:p-9 mb-8 relative overflow-hidden">

          <div className="absolute -right-10 -top-12 w-56 h-56 bg-white/20 rounded-full" />

          <div className="relative z-10">

            <div className="flex items-center justify-between mb-5">

              <p className="font-semibold text-gray-700">
                Total Saldo
              </p>

              <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-full text-sm">
                <CalendarDays size={16} />
                {currentMonth}
              </div>

            </div>

            <h3 className="text-4xl md:text-5xl font-black tracking-tight mb-8">
              {formatRupiah(balance)}
            </h3>

            <div className="flex flex-wrap gap-3">

              <button
                onClick={openAddBalanceModal}
                className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm"
              >
                <Plus size={18} />
                Tambah Saldo
              </button>

              <button
                onClick={() =>
                  navigate('/personal-finance/budget')
                }
                className="flex items-center gap-2 bg-white/70 px-5 py-3 rounded-xl font-bold hover:bg-white transition"
              >
                <Wallet size={18} />
                Atur Budget
              </button>

            </div>

          </div>
        </div>

        {/* INCOME & EXPENSE SUMMARY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">

          {/* INCOME */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

            <div className="flex items-center justify-between mb-5">

              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp
                  className="text-green-600"
                  size={25}
                />
              </div>

              <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                Pemasukan
              </span>

            </div>

            <p className="text-sm text-gray-500 mb-2">
              Total Pemasukan
            </p>

            <h3 className="text-2xl font-bold">
              {formatRupiah(income)}
            </h3>

          </div>

          {/* EXPENSE */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

            <div className="flex items-center justify-between mb-5">

              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingDown
                  className="text-red-500"
                  size={25}
                />
              </div>

              <span className="text-xs font-semibold text-red-500 bg-red-50 px-3 py-1 rounded-full">
                Pengeluaran
              </span>

            </div>

            <p className="text-sm text-gray-500 mb-2">
              Total Pengeluaran
            </p>

            <h3 className="text-2xl font-bold">
              {formatRupiah(expense)}
            </h3>

          </div>

        </div>

        {/* BUDGET SECTION */}
        <section className="mb-10">

          <div className="flex items-center justify-between mb-5">

            <div>

              <h3 className="text-xl font-bold">
                Budget Pengeluaran
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Pantau penggunaan anggaranmu.
              </p>

            </div>

            <button
              onClick={() =>
                navigate('/personal-finance/budget')
              }
              className="text-sm font-bold text-[#75B51B] hover:underline"
            >
              Kelola Budget
            </button>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {budgets.map((budget) => {

              const Icon = getBudgetIcon(budget.name);

              const percentage = budget.limit > 0
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
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm"
                >

                  <div className="flex items-center justify-between mb-4">

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 bg-[#EFF9DE] rounded-xl flex items-center justify-center">
                        <Icon
                          size={22}
                          className="text-[#75B51B]"
                        />
                      </div>

                      <div>

                        <h4 className="font-bold">
                          Budget {budget.name}
                        </h4>

                        <p className="text-xs text-gray-400">
                          Anggaran bulanan
                        </p>

                      </div>

                    </div>

                    <span className="text-sm font-bold text-[#75B51B]">
                      {Math.round(percentage)}%
                    </span>

                  </div>

                  <p className="font-bold text-lg mb-3">
                    {formatRupiah(budget.limit)}
                  </p>

                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">

                    <div
                      className={`h-full rounded-full ${
                        percentage >= 90
                          ? 'bg-red-500'
                          : 'bg-[#91D624]'
                      }`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />

                  </div>

                  <div className="flex justify-between text-xs text-gray-500">

                    <span>
                      Terpakai: {formatRupiah(budget.used)}
                    </span>

                    <span>
                      Sisa: {formatRupiah(remaining)}
                    </span>

                  </div>

                </div>
              );
            })}

            {budgets.length === 0 && (
              <div className="col-span-full bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400">
                <Wallet
                  size={35}
                  className="mx-auto mb-3"
                />
                Belum ada budget. Silakan tambahkan budget terlebih dahulu.
              </div>
            )}

          </div>
        </section>

        {/* TRANSACTION HISTORY */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 md:p-7 shadow-sm">

          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">

            <div>

              <h3 className="text-xl font-bold">
                Transaksi Terakhir
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Riwayat pemasukan dan pengeluaranmu.
              </p>

            </div>

            <button
              onClick={openModal}
              className="flex items-center gap-2 bg-[#91D624] hover:bg-[#82C51C] px-4 py-2.5 rounded-xl font-bold text-sm transition"
            >
              <Plus size={18} />
              Tambah Transaksi
            </button>

          </div>

          <div className="divide-y divide-gray-100">

            {transactions.map((transaction) => {

              const isIncome =
                transaction.type === 'income';

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-4 gap-3"
                >

                  <div className="flex items-center gap-3">

                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        isIncome
                          ? 'bg-green-50'
                          : 'bg-red-50'
                      }`}
                    >

                      {isIncome ? (
                        <ArrowDownRight className="text-green-600" />
                      ) : (
                        <ArrowUpRight className="text-red-500" />
                      )}

                    </div>

                    <div>

                      <h4 className="font-semibold text-sm">
                        {transaction.title}
                      </h4>

                      <p className="text-xs text-gray-400 mt-1">
                        {transaction.category} · {transaction.date}
                      </p>

                    </div>

                  </div>

                  <p
                    className={`font-bold text-sm whitespace-nowrap ${
                      isIncome
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatRupiah(transaction.amount)}
                  </p>

                </div>
              );
            })}

            {transactions.length === 0 && (
              <div className="py-10 text-center text-gray-400">

                <ReceiptText
                  size={35}
                  className="mx-auto mb-3"
                />

                Belum ada transaksi.

              </div>
            )}

          </div>

        </section>

      </main>

      {/* ADD BALANCE MODAL */}
      {showAddBalanceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={() => setShowAddBalanceModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-balance-title"
            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 id="add-balance-title" className="text-xl font-bold">
                Tambah Saldo
              </h3>

              <button
                type="button"
                onClick={() => setShowAddBalanceModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Tutup modal"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Masukkan nominal yang ingin ditambahkan ke total saldo.
            </p>

            <form onSubmit={handleAddBalance}>
              <div>
                <label
                  htmlFor="balance-amount"
                  className="block text-sm font-semibold mb-2"
                >
                  Nominal Saldo (Rp)
                </label>

                <input
                  id="balance-amount"
                  type="number"
                  min="1"
                  step="1"
                  required
                  autoFocus
                  value={balanceAmount}
                  onChange={(e) => {
                    setBalanceAmount(e.target.value);
                    setBalanceError('');
                  }}
                  placeholder="Masukkan nominal saldo"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#91D624] focus:ring-2 focus:ring-[#91D624]/20"
                />

                {balanceError && (
                  <p className="text-sm text-red-500 mt-2">
                    {balanceError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full mt-6 bg-[#91D624] hover:bg-[#82C51C] py-3.5 rounded-xl font-bold transition"
              >
                Simpan Saldo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD TRANSACTION MODAL */}
      {showModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={() => setShowModal(false)}
        >

          <div
            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between mb-6">

              <h3 className="text-xl font-bold">
                Tambah Transaksi
              </h3>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>

            </div>

            <form onSubmit={handleAddTransaction}>

              {/* FORM KHUSUS PENGELUARAN */}
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 py-3 text-center font-semibold text-red-600">
                Pengeluaran
              </div>

              <div className="space-y-4">

                {/* TRANSACTION NAME */}
                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Nama Transaksi
                  </label>

                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setTransactionError('');
                    }}
                    placeholder="Contoh: Makan siang"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#91D624]"
                  />

                </div>

                {/* AMOUNT */}
                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Nominal (Rp)
                  </label>

                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setTransactionError('');
                    }}
                    placeholder="Masukkan nominal"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#91D624]"
                  />

                </div>

                {/* CATEGORY */}
                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Kategori
                  </label>

                  <select
                    value={category}
                    disabled={expenseCategories.length === 0}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setTransactionError('');
                    }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#91D624] disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    {expenseCategories.length === 0 ? (
                      <option value="">
                        Belum ada budget tersedia
                      </option>
                    ) : (
                      expenseCategories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))
                    )}
                  </select>

                  {expenseCategories.length === 0 && (
                      <div className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                        Belum ada budget pengeluaran. Buat budget terlebih dahulu
                        melalui menu <strong>Atur Budget</strong> sebelum mencatat
                        pengeluaran.
                        <button
                          type="button"
                          onClick={() => {
                            setShowModal(false);
                            navigate('/personal-finance/budget');
                          }}
                          className="ml-1 font-bold underline"
                        >
                          Buat budget
                        </button>
                      </div>
                    )}

                </div>

                {/* DATE */}
                <div>

                  <label className="block text-sm font-semibold mb-2">
                    Tanggal
                  </label>

                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) =>
                      setDate(e.target.value)
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#91D624]"
                  />

                </div>

              </div>

              {transactionError && (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
                  {transactionError}
                </p>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={expenseCategories.length === 0}
                className="w-full mt-6 bg-[#91D624] hover:bg-[#82C51C] py-3.5 rounded-xl font-bold transition disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >
                Simpan Transaksi
              </button>

            </form>

          </div>

        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center py-7 pb-24 md:py-7 text-sm text-gray-400">
        © 2026 BillMate. All rights reserved.
      </footer>

    </div>
  );
}

import { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Users,
  Receipt,
  Calculator,
  CheckCircle2,
  Utensils,
  X,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

type Member = {
  id: number;
  name: string;
  paid: boolean;
};

type BillItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  memberIds: number[];
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

function SplitBill() {
  const [activity, setActivity] = useState('Makan Mabar Bareng');
  const [members, setMembers] = useState<Member[]>([

  ]);

  const [items, setItems] = useState<BillItem[]>([

  ]);

  const [tax, setTax] = useState(0);
  const [service, setService] = useState(0);
  const [newMember, setNewMember] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const taxAmount = Math.round(subtotal * tax / 100);
  const serviceAmount = Math.round(subtotal * service / 100);
  const grandTotal = subtotal + taxAmount + serviceAmount;

  const calculations = useMemo(() => {
    const baseAmounts = members.map((member) => {
      const amount = items.reduce((total, item) => {
        if (!item.memberIds.includes(member.id)) return total;
        if (item.memberIds.length === 0) return total;

        return total + (
          item.price * item.quantity / item.memberIds.length
        );
      }, 0);

      return { id: member.id, amount };
    });

    const totalBase = baseAmounts.reduce(
      (total, member) => total + member.amount,
      0
    );

    const result = baseAmounts.map((member) => ({
      id: member.id,
      amount: totalBase > 0
        ? Math.round(member.amount / totalBase * grandTotal)
        : 0,
    }));

    const difference = grandTotal - result.reduce(
      (total, member) => total + member.amount,
      0
    );

    if (difference !== 0) {
      const firstMember = result.find((member) => member.amount > 0);
      if (firstMember) firstMember.amount += difference;
    }

    return result;
  }, [members, items, grandTotal]);

  const addMember = () => {
    if (!newMember.trim()) return;

    setMembers([
      ...members,
      {
        id: Date.now(),
        name: newMember.trim(),
        paid: false,
      },
    ]);

    setNewMember('');
  };

  const removeMember = (id: number) => {
    setMembers(members.filter((member) => member.id !== id));
    setItems(items.map((item) => ({
      ...item,
      memberIds: item.memberIds.filter((memberId) => memberId !== id),
    })));
  };

  const addItem = () => {
    const price = Number(newItemPrice);
    const quantity = Number(newItemQuantity);

    if (!newItemName.trim() || price <= 0 || quantity < 1) return;

    setItems([
      ...items,
      {
        id: Date.now(),
        name: newItemName.trim(),
        price,
        quantity,
        memberIds: [],
      },
    ]);

    setNewItemName('');
    setNewItemPrice('');
    setNewItemQuantity('1');
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const toggleMember = (itemId: number, memberId: number) => {
    setItems(items.map((item) => {
      if (item.id !== itemId) return item;

      const selected = item.memberIds.includes(memberId);

      return {
        ...item,
        memberIds: selected
          ? item.memberIds.filter((id) => id !== memberId)
          : [...item.memberIds, memberId],
      };
    }));
  };

  const togglePaid = (id: number) => {
    setMembers(members.map((member) =>
      member.id === id
        ? { ...member, paid: !member.paid }
        : member
    ));
  };

  const paidTotal = members.reduce((total, member) => {
    if (!member.paid) return total;

    return total + (
      calculations.find((item) => item.id === member.id)?.amount || 0
    );
  }, 0);

  const inputClass =
    'w-full min-h-[48px] rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-muted/60 focus:border-ink focus:ring-2 focus:ring-lime';

  return (
    <div className="min-h-screen bg-white text-ink font-sans">
      <Navbar isSplitBillPage />

      <main className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-lime px-3 py-1.5 text-xs font-semibold text-ink">
            <Receipt size={14} />
            BillMate Split Bill
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
            Bagi tagihan tanpa ribet.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted md:text-base">
            Masukkan pesanan masing-masing dan biarkan BillMate menghitung
            pembagian tagihan secara otomatis.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-ink">
                  <Receipt size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-ink">Informasi Tagihan</h2>
                  <p className="text-xs text-ink-muted">Detail aktivitas bersama</p>
                </div>
              </div>

              <label className="mb-2 block text-sm font-medium">
                Nama aktivitas
              </label>
              <input
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className={inputClass}
                placeholder="Contoh: Makan Bersama"
              />
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/30 text-ink">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-ink">Anggota</h2>
                    <p className="text-xs text-ink-muted">
                      {members.length} orang dalam tagihan
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-xs font-bold text-ink">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{member.name}</span>
                    <button
                      onClick={() => removeMember(member.id)}
                      className="ml-1 text-ink-muted/70 hover:text-red-500"
                      aria-label={`Hapus ${member.name}`}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMember()}
                  className={inputClass}
                  placeholder="Masukkan nama anggota"
                />
                <button
                  onClick={addMember}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-lime px-4 py-3 text-sm font-bold text-ink transition hover:bg-lime-hover"
                >
                  <Plus size={17} />
                  <span className="hidden sm:inline">Tambah</span>
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/30 text-ink">
                  <Utensils size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-ink">Daftar Pesanan</h2>
                  <p className="text-xs text-ink-muted">
                    Tentukan siapa yang memesan setiap item
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-line p-4"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-ink">
                          {item.name}
                        </h3>
                        <p className="mt-1 text-sm text-ink-muted">
                          {item.quantity} × {formatRupiah(item.price)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-ink">
                          {formatRupiah(item.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="mt-2 text-ink-muted/70 transition hover:text-red-500"
                          aria-label={`Hapus ${item.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>

                    <p className="mb-2 text-xs font-semibold text-ink-muted">
                      Siapa yang memesan?
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {members.map((member) => {
                        const selected = item.memberIds.includes(member.id);

                        return (
                          <button
                            key={member.id}
                            onClick={() => toggleMember(item.id, member.id)}
                            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                              selected
                                ? 'border-ink bg-lime/30 text-ink'
                                : 'border-line bg-white text-ink-muted hover:border-ink-muted'
                            }`}
                          >
                            {selected ? '✓ ' : '+ '}
                            {member.name}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-xs text-ink-muted/70">
                      {item.memberIds.length === 0
                        ? 'Belum ada anggota yang dipilih'
                        : `Dibagi ${item.memberIds.length} orang · ${formatRupiah(item.price * item.quantity / item.memberIds.length)} per orang`}
                    </p>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className="rounded-xl bg-gray-50 py-8 text-center text-sm text-ink-muted/70">
                    Belum ada item pesanan.
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-line pt-5">
                <h3 className="mb-3 text-sm font-bold text-ink">
                  Tambahkan Item
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className={inputClass}
                    placeholder="Nama item"
                  />
                  <input
                    type="number"
                    min="1"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className={inputClass}
                    placeholder="Harga item (Rp)"
                  />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className={inputClass}
                    placeholder="Jumlah"
                  />
                  <button
                    onClick={addItem}
                    className="flex items-center justify-center gap-2 rounded-xl bg-dark px-4 py-3 text-sm font-bold text-white transition hover:bg-ink-muted"
                  >
                    <Plus size={17} />
                    Tambahkan Item
                  </button>
                </div>
                <p className="mt-2 text-xs text-ink-muted/70">
                  Setelah item ditambahkan, pilih anggota yang memesan item tersebut.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/30 text-ink">
                  <Calculator size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-ink">Biaya Tambahan</h2>
                  <p className="text-xs text-ink-muted">
                    Atur pajak dan service charge
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Pajak (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={tax}
                    onChange={(e) => setTax(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Service charge (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={service}
                    onChange={(e) => setService(Math.max(0, Math.min(100, Number(e.target.value))))}
                    className={inputClass}
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-ink-muted/70">
                Biaya tambahan dibagi secara proporsional berdasarkan nilai pesanan setiap anggota.
              </p>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl bg-dark p-6 text-white shadow-lg">
              <p className="text-sm font-medium text-white/75">
                Total Tagihan
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                {formatRupiah(grandTotal)}
              </h2>

              <div className="mt-6 space-y-3 border-t border-white/20 pt-4 text-sm">
                <div className="flex justify-between text-white/75">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-white/75">
                  <span>Pajak ({tax}%)</span>
                  <span>{formatRupiah(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-white/75">
                  <span>Service ({service}%)</span>
                  <span>{formatRupiah(serviceAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-white/20 pt-3 font-bold">
                  <span>Total</span>
                  <span>{formatRupiah(grandTotal)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="font-bold text-ink">
                  Pembagian Tagihan
                </h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Total pembayaran setiap anggota
                </p>
              </div>

              <div className="space-y-4">
                {members.map((member) => {
                  const amount = calculations.find(
                    (item) => item.id === member.id
                  )?.amount || 0;

                  return (
                    <div key={member.id} className="border-b border-line pb-4 last:border-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime text-sm font-bold text-ink">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-ink">
                              {member.name}
                            </p>
                            <p className="text-xs text-ink-muted/70">
                              {member.paid ? 'Sudah membayar' : 'Belum membayar'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-ink">
                            {formatRupiah(amount)}
                          </p>
                          <button
                            onClick={() => togglePaid(member.id)}
                            className={`mt-1 text-xs font-semibold ${
                              member.paid
                                ? 'text-ink'
                                : 'text-ink hover:text-ink-muted'
                            }`}
                          >
                            {member.paid ? '✓ Lunas' : 'Tandai lunas'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {members.length === 0 && (
                  <p className="py-4 text-center text-sm text-ink-muted/70">
                    Belum ada anggota.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-bold text-ink">
                Ringkasan Pembayaran
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Sudah dibayar</span>
                  <span className="font-semibold text-ink">
                    {formatRupiah(paidTotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">Belum dibayar</span>
                  <span className="font-semibold text-ink-muted">
                    {formatRupiah(grandTotal - paidTotal)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-50">
                  <div
                    className="h-full rounded-full bg-lime/300 transition-all"
                    style={{
                      width: `${grandTotal > 0 ? paidTotal / grandTotal * 100 : 0}%`,
                    }}
                  />
                </div>

                <p className="text-xs text-ink-muted/70">
                  {members.filter((member) => member.paid).length} dari {members.length} anggota sudah membayar.
                </p>
              </div>
            </section>

            <div className="rounded-xl border border-line bg-lime/30 p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="shrink-0 text-ink" size={20} />
                <div>
                  <p className="text-sm font-bold text-ink">
                    Pembagian Otomatis
                  </p>
                  <p className="mt-1 text-xs leading-5 text-ink">
                    BillMate membagi harga item berdasarkan anggota yang dipilih dan menghitung biaya tambahan secara proporsional.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-10 border-t border-line bg-white py-6">
        <p className="text-center text-xs text-ink-muted">
          © 2026 BillMate. Manage money together, effortlessly.
        </p>
      </footer>
    </div>
  );
}

export default SplitBill;

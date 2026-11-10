
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import {
  Wallet,
  Plus,
  Users,
  ArrowLeft,
  Copy,
  ImagePlus,
  X,
  LogIn,
} from "lucide-react";

import { auth, db } from "../firebase";

type GroupData = {
  id: string;
  name: string;
  description: string;
  targetContribution: number;
  qrisImageUrl: string;
  inviteCode: string;
  createdBy: string;
  memberIds: string[];
};

const CLOUD_NAME = "di4vutv1y";
const UPLOAD_PRESET = "Billmate";
const DEFAULT_TARGET_IURAN = 20000;

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function uploadToCloudinary(file: File): Promise<string> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Gunakan gambar JPG, PNG, atau WEBP.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ukuran gambar maksimal 5 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "billmate");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Upload gambar gagal.");
  }

  return result.secure_url;
}

export default function GroupWallet() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [targetContribution, setTargetContribution] = useState(
    String(DEFAULT_TARGET_IURAN)
  );
  const [qrisFile, setQrisFile] = useState<File | null>(null);

  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Mengambil data user dan grup
  useEffect(() => {
    let unsubscribeGroups: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeGroups?.();
      unsubscribeGroups = undefined;

      if (!user) {
        setUserId("");
        setGroups([]);
        setLoading(false);
        return;
      }

      setUserId(user.uid);
      setLoading(true);

      const groupsQuery = query(
        collection(db, "groups"),
        where("memberIds", "array-contains", user.uid)
      );

      unsubscribeGroups = onSnapshot(
        groupsQuery,
        (snapshot) => {
          const result = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })) as GroupData[];

          setGroups(result);
          setLoading(false);
        },
        (error) => {
          console.error("Gagal mengambil grup:", error);
          setMessage(
            "Tidak dapat memuat grup. Periksa koneksi dan aturan Firestore."
          );
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeGroups?.();
      unsubscribeAuth();
    };
  }, []);

  // Membuat grup baru
  const handleCreateGroup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userId) {
      setMessage("Silakan login terlebih dahulu.");
      return;
    }

    if (!groupName.trim()) {
      setMessage("Nama grup wajib diisi.");
      return;
    }

    const targetAmount = Number(targetContribution);

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setMessage("Target iuran harus lebih dari Rp0.");
      return;
    }

    if (!Number.isSafeInteger(targetAmount)) {
      setMessage("Target iuran harus berupa angka bulat yang valid.");
      return;
    }

    if (!qrisFile) {
      setMessage("Silakan upload foto QRIS grup.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const qrisImageUrl = await uploadToCloudinary(qrisFile);
      const inviteCode = generateInviteCode();

      await addDoc(collection(db, "groups"), {
        name: groupName.trim(),
        description: description.trim(),
        targetContribution: targetAmount,
        qrisImageUrl,
        inviteCode,
        createdBy: userId,
        memberIds: [userId],
        createdAt: serverTimestamp(),
      });

      setGroupName("");
      setDescription("");
      setTargetContribution(String(DEFAULT_TARGET_IURAN));
      setQrisFile(null);
      setShowCreate(false);

      setMessage("Grup berhasil dibuat!");
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Gagal membuat grup."
      );
    } finally {
      setSaving(false);
    }
  };

  // Bergabung dengan grup
  const handleJoinGroup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!userId) {
      setMessage("Silakan login terlebih dahulu.");
      return;
    }

    const code = inviteCodeInput.trim().toUpperCase();

    if (!code) {
      setMessage("Masukkan kode undangan.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const groupQuery = query(
        collection(db, "groups"),
        where("inviteCode", "==", code)
      );

      const snapshot = await getDocs(groupQuery);

      if (snapshot.empty) {
        setMessage("Kode undangan tidak ditemukan.");
        return;
      }

      const groupDoc = snapshot.docs[0];
      const groupData = groupDoc.data();

      if (groupData.memberIds?.includes(userId)) {
        setMessage("Kamu sudah menjadi anggota grup ini.");
        return;
      }

      await updateDoc(doc(db, "groups", groupDoc.id), {
        memberIds: arrayUnion(userId),
      });

      setInviteCodeInput("");
      setShowJoin(false);
      setMessage("Berhasil bergabung ke grup!");
    } catch (error) {
      console.error(error);
      setMessage("Gagal bergabung. Periksa aturan Firestore.");
    } finally {
      setSaving(false);
    }
  };

  // Menyalin kode undangan
  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setMessage("Kode undangan berhasil disalin.");
    } catch {
      setMessage("Tidak dapat menyalin kode undangan.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF5] text-gray-900">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-5 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-xl hover:bg-gray-100"
            aria-label="Kembali"
          >
            <ArrowLeft />
          </button>

          <div>
            <h1 className="text-2xl font-black italic">
              Bill<span className="text-[#91D624]">Mate</span>
            </h1>
            <p className="text-sm text-gray-500">Group Wallet</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-10">
        {/* JUDUL */}
        <section className="mb-8">
          <p className="text-sm font-bold text-[#75B51B] uppercase tracking-wider mb-2">
            Keuangan Bersama
          </p>

          <h2 className="text-3xl font-bold mb-3">
            Group Wallet
          </h2>

          <p className="text-gray-500">
            Kelola iuran, simpan QRIS, dan pantau kontribusi seluruh anggota grup.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 bg-[#EFF9DE] text-[#568D13] px-4 py-3 rounded-xl font-semibold">
            <Wallet size={20} />
            Target default: {formatRupiah(DEFAULT_TARGET_IURAN)} / anggota
          </div>
        </section>

        {/* TOMBOL AKSI */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => {
              setMessage("");
              setShowCreate(true);
            }}
            className="bg-[#91D624] hover:bg-[#82C51C] p-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition"
          >
            <Plus />
            Buat Grup Baru
          </button>

          <button
            onClick={() => {
              setMessage("");
              setShowJoin(true);
            }}
            className="bg-white border border-gray-200 hover:bg-gray-50 p-5 rounded-2xl font-bold flex items-center justify-center gap-2 transition"
          >
            <LogIn />
            Gabung dengan Kode
          </button>
        </div>

        {/* PESAN */}
        {message && (
          <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl text-sm">
            {message}
          </div>
        )}

        {/* DAFTAR GRUP */}
        <section>
          <h3 className="text-xl font-bold mb-5">Grup Saya</h3>

          {loading ? (
            <p className="text-gray-500">Memuat daftar grup...</p>
          ) : groups.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
              <Users size={42} className="mx-auto text-gray-300 mb-4" />

              <h4 className="font-bold text-lg mb-2">
                Belum ada grup
              </h4>

              <p className="text-gray-500 text-sm">
                Buat grup baru atau gabung menggunakan kode undangan.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                >
                  {group.qrisImageUrl && (
                    <img
                      src={group.qrisImageUrl}
                      alt="QRIS grup"
                      className="w-full h-40 object-contain bg-gray-50 rounded-xl mb-4"
                    />
                  )}

                  <h4 className="text-xl font-bold mb-2">
                    {group.name}
                  </h4>

                  <p className="text-sm text-gray-500 mb-4">
                    {group.description || "Tidak ada deskripsi grup."}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <Users size={17} />
                    {group.memberIds?.length || 0} anggota
                  </div>

                  <div className="bg-[#F4F9EC] rounded-xl p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">
                      Target iuran per anggota
                    </p>

                    <p className="font-bold text-[#568D13]">
                      {formatRupiah(group.targetContribution)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500">
                        Kode undangan
                      </p>

                      <p className="font-bold tracking-wider">
                        {group.inviteCode}
                      </p>
                    </div>

                    <button
                      onClick={() => copyCode(group.inviteCode)}
                      className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200"
                      title="Salin kode"
                    >
                      <Copy size={18} />
                    </button>
                  </div>

                  {/* TOMBOL DETAIL GRUP */}
                  <button
                    onClick={() =>
                      navigate(`/group-wallet/${group.id}`)
                    }
                    className="w-full mt-4 bg-[#91D624] hover:bg-[#82C51C] text-black font-bold py-3 rounded-xl transition"
                  >
                    Buka Detail Grup
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MODAL BUAT GRUP */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateGroup}
            className="bg-white rounded-2xl p-6 w-full max-w-lg my-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Buat Grup Baru</h3>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X />
              </button>
            </div>

            {/* NAMA GRUP */}
            <label className="block text-sm font-semibold mb-2">
              Nama Grup
            </label>

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Contoh: Liburan ke Bali"
              className="w-full border border-gray-300 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-lime-400"
              required
            />

            {/* DESKRIPSI */}
            <label className="block text-sm font-semibold mb-2">
              Deskripsi Agenda
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan tujuan grup..."
              className="w-full border border-gray-300 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-lime-400"
              rows={3}
            />

            {/* TARGET CUSTOM */}
            <div className="bg-[#F4F9EC] p-4 rounded-xl mb-4">
              <label className="block text-sm font-semibold mb-2">
                Target iuran per anggota
              </label>

              <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden">
                <span className="px-4 py-3 bg-gray-100 font-bold text-gray-600">
                  Rp
                </span>

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={targetContribution}
                  onChange={(e) =>
                    setTargetContribution(e.target.value)
                  }
                  placeholder="Contoh: 50000"
                  className="w-full p-3 outline-none"
                  required
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Target yang dipilih:{" "}
                <strong>
                  {formatRupiah(Number(targetContribution) || 0)}
                </strong>
              </p>

              <div className="flex flex-wrap gap-2 mt-3">
                {[10000, 20000, 50000, 100000].map((nominal) => (
                  <button
                    key={nominal}
                    type="button"
                    onClick={() =>
                      setTargetContribution(String(nominal))
                    }
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold hover:border-lime-500"
                  >
                    {formatRupiah(nominal)}
                  </button>
                ))}
              </div>
            </div>

            {/* QRIS */}
            <label className="block text-sm font-semibold mb-2">
              Upload Foto QRIS
            </label>

            <label className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center cursor-pointer hover:bg-gray-50 mb-5">
              <ImagePlus className="text-gray-400 mb-2" size={30} />

              <span className="text-sm text-gray-500 text-center">
                {qrisFile
                  ? qrisFile.name
                  : "Pilih foto QRIS (maksimal 5 MB)"}
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) =>
                  setQrisFile(e.target.files?.[0] || null)
                }
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#91D624] hover:bg-[#82C51C] disabled:opacity-50 py-3 rounded-xl font-bold"
            >
              {saving ? "Membuat grup..." : "Buat Grup"}
            </button>
          </form>
        </div>
      )}

      {/* MODAL GABUNG GRUP */}
      {showJoin && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleJoinGroup}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Gabung Grup</h3>

              <button
                type="button"
                onClick={() => setShowJoin(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X />
              </button>
            </div>

            <label className="block text-sm font-semibold mb-2">
              Kode Undangan
            </label>

            <input
              value={inviteCodeInput}
              onChange={(e) =>
                setInviteCodeInput(e.target.value.toUpperCase())
              }
              placeholder="Contoh: AB12CD"
              maxLength={6}
              className="w-full border border-gray-300 rounded-xl p-3 mb-5 uppercase tracking-widest"
              required
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#91D624] hover:bg-[#82C51C] disabled:opacity-50 py-3 rounded-xl font-bold"
            >
              {saving ? "Memproses..." : "Gabung Grup"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

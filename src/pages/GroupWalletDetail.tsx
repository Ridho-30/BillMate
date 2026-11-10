
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ImagePlus,
  Loader2,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

import { auth, db } from "../firebase";

type GroupData = {
  id: string;
  name: string;
  description?: string;
  targetContribution: number;
  qrisImageUrl: string;
  createdBy: string;
  memberIds: string[];
};

type Contribution = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  proofUrl: string;
  status: "pending" | "accepted" | "rejected";
  createdAt?: {
    seconds?: number;
  } | null;
};

const CLOUD_NAME = "di4vutv1y";
const UPLOAD_PRESET = "Billmate";

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(timestamp?: { seconds?: number } | null) {
  if (!timestamp?.seconds) return "Baru saja";

  return new Date(timestamp.seconds * 1000).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function uploadProof(file: File): Promise<string> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Gunakan gambar JPG, PNG, atau WEBP.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Ukuran bukti pembayaran maksimal 5 MB.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "billmate/payment-proofs");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message || "Upload bukti pembayaran gagal.");
  }

  return result.secure_url;
}

export default function GroupWalletDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("Anggota");

  const [group, setGroup] = useState<GroupData | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || "");
      setUserName(user?.displayName || user?.email || "Anggota");
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    let unsubscribeContributions: (() => void) | undefined;

    const loadGroup = async () => {
      try {
        const groupRef = doc(db, "groups", groupId);
        const groupSnapshot = await getDoc(groupRef);

        if (!groupSnapshot.exists()) {
          setGroup(null);
          setLoading(false);
          return;
        }

        setGroup({
          id: groupSnapshot.id,
          ...groupSnapshot.data(),
        } as GroupData);

        const contributionQuery = query(
          collection(db, "groups", groupId, "contributions"),
          orderBy("createdAt", "desc")
        );

        unsubscribeContributions = onSnapshot(
          contributionQuery,
          (snapshot) => {
            const result = snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            })) as Contribution[];

            setContributions(result);
            setLoading(false);
          },
          (error) => {
            console.error("Gagal mengambil pembayaran:", error);
            setMessage("Gagal memuat pembayaran. Periksa aturan Firestore.");
            setLoading(false);
          }
        );
      } catch (error) {
        console.error(error);
        setMessage("Gagal memuat detail grup.");
        setLoading(false);
      }
    };

    loadGroup();

    return () => {
      unsubscribeContributions?.();
    };
  }, [groupId]);

  const isCreator = Boolean(group && userId === group.createdBy);

  const acceptedTotal = useMemo(
    () =>
      contributions
        .filter((item) => item.status === "accepted")
        .reduce((total, item) => total + Number(item.amount || 0), 0),
    [contributions]
  );

  const myAccepted = useMemo(
    () =>
      contributions
        .filter(
          (item) => item.userId === userId && item.status === "accepted"
        )
        .reduce((total, item) => total + Number(item.amount || 0), 0),
    [contributions, userId]
  );

  const myPending = useMemo(
    () =>
      contributions
        .filter(
          (item) => item.userId === userId && item.status === "pending"
        )
        .reduce((total, item) => total + Number(item.amount || 0), 0),
    [contributions, userId]
  );

  const myRemaining = Math.max(
    0,
    (group?.targetContribution || 0) - myAccepted - myPending
  );

  const acceptedPercentage =
    group && group.targetContribution > 0
      ? Math.min(
          100,
          (acceptedTotal /
            (group.targetContribution * (group.memberIds?.length || 1))) *
            100
        )
      : 0;

  const handleSubmitContribution = async (event: FormEvent) => {
    event.preventDefault();

    if (!groupId || !group || !userId) {
      setMessage("Kamu harus login untuk membayar iuran.");
      return;
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setMessage("Masukkan nominal pembayaran yang valid.");
      return;
    }

    if (paymentAmount > myRemaining) {
      setMessage(
        `Nominal melebihi sisa iuranmu (${formatRupiah(myRemaining)}).`
      );
      return;
    }

    if (!proofFile) {
      setMessage("Silakan upload bukti pembayaran.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const proofUrl = await uploadProof(proofFile);

      await addDoc(collection(db, "groups", groupId, "contributions"), {
        userId,
        userName,
        amount: paymentAmount,
        proofUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setAmount("");
      setProofFile(null);
      setMessage("Bukti pembayaran berhasil dikirim. Menunggu verifikasi.");
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error ? error.message : "Gagal mengirim pembayaran."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (
    contributionId: string,
    status: "accepted" | "rejected"
  ) => {
    if (!groupId || !isCreator) {
      setMessage("Hanya pembuat grup yang dapat memverifikasi pembayaran.");
      return;
    }

    try {
      await updateDoc(
        doc(db, "groups", groupId, "contributions", contributionId),
        {
          status,
          verifiedAt: serverTimestamp(),
          verifiedBy: userId,
        }
      );

      setMessage(
        status === "accepted"
          ? "Pembayaran berhasil diterima."
          : "Pembayaran ditolak."
      );
    } catch (error) {
      console.error(error);
      setMessage("Gagal memperbarui status pembayaran.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF5]">
        <Loader2 className="animate-spin text-lime-600" size={34} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[#F8FAF5] flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold mb-3">Grup tidak ditemukan</h2>
        <button
          onClick={() => navigate("/group-wallet")}
          className="bg-[#91D624] px-5 py-3 rounded-xl font-bold"
        >
          Kembali ke Group Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF5] text-gray-900">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-5 py-5 flex items-center gap-4">
          <button
            onClick={() => navigate("/group-wallet")}
            className="p-2 rounded-xl hover:bg-gray-100"
            aria-label="Kembali"
          >
            <ArrowLeft />
          </button>

          <div>
            <h1 className="text-2xl font-black italic">
              Bill<span className="text-[#91D624]">Mate</span>
            </h1>
            <p className="text-sm text-gray-500">Detail Group Wallet</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <section className="mb-8">
          <p className="text-sm font-bold text-[#75B51B] uppercase tracking-wider mb-2">
            Keuangan Bersama
          </p>
          <h2 className="text-3xl font-bold mb-2">{group.name}</h2>
          <p className="text-gray-500">
            {group.description || "Tidak ada deskripsi grup."}
          </p>
        </section>

        {message && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 text-sm">
            {message}
          </div>
        )}

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Wallet size={19} />
              <span className="text-sm">Total terkumpul</span>
            </div>
            <p className="text-xl font-black text-[#568D13]">
              {formatRupiah(acceptedTotal)}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Users size={19} />
              <span className="text-sm">Jumlah anggota</span>
            </div>
            <p className="text-xl font-black">
              {group.memberIds?.length || 0} orang
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Wallet size={19} />
              <span className="text-sm">Target per anggota</span>
            </div>
            <p className="text-xl font-black">
              {formatRupiah(group.targetContribution)}
            </p>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-5 mb-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="font-bold">Progres iuran seluruh grup</h3>
            <span className="text-sm font-bold text-[#568D13]">
              {acceptedPercentage.toFixed(0)}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-[#91D624] rounded-full transition-all"
              style={{ width: `${acceptedPercentage}%` }}
            />
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Total target:{" "}
            {formatRupiah(
              group.targetContribution * (group.memberIds?.length || 1)
            )}
          </p>
        </section>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <section className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-lg font-bold mb-4">QRIS Pembayaran Grup</h3>

            {group.qrisImageUrl ? (
              <img
                src={group.qrisImageUrl}
                alt="QRIS pembayaran grup"
                className="w-full max-h-96 object-contain bg-gray-50 rounded-xl"
              />
            ) : (
              <p className="text-gray-500">QRIS belum tersedia.</p>
            )}

            <p className="text-xs text-gray-500 mt-3">
              Pastikan nama penerima dan nominal sudah benar sebelum membayar.
              Pembayaran perlu diverifikasi oleh pembuat grup.
            </p>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-lg font-bold mb-2">Bayar Iuran</h3>
            <p className="text-sm text-gray-500 mb-4">
              Kamu bisa membayar secara bertahap sampai target iuran tercapai.
            </p>

            <div className="bg-[#F4F9EC] rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-500">Sisa iuranmu</p>
              <p className="text-2xl font-black text-[#568D13]">
                {formatRupiah(myRemaining)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Diterima: {formatRupiah(myAccepted)} · Menunggu:{" "}
                {formatRupiah(myPending)}
              </p>
            </div>

            {myRemaining > 0 ? (
              <form onSubmit={handleSubmitContribution}>
                <label className="block text-sm font-semibold mb-2">
                  Nominal pembayaran (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  max={myRemaining}
                  step="1"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Contoh: 10000"
                  className="w-full border border-gray-300 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-lime-400"
                  required
                />

                <label className="block text-sm font-semibold mb-2">
                  Bukti pembayaran
                </label>
                <label className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center cursor-pointer hover:bg-gray-50 mb-5">
                  <ImagePlus className="text-gray-400 mb-2" size={30} />
                  <span className="text-sm text-gray-500 text-center">
                    {proofFile
                      ? proofFile.name
                      : "Pilih foto bukti pembayaran (maksimal 5 MB)"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) =>
                      setProofFile(event.target.files?.[0] || null)
                    }
                  />
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[#91D624] hover:bg-[#82C51C] disabled:opacity-50 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="animate-spin" size={18} />}
                  {saving ? "Mengirim bukti..." : "Kirim Bukti Pembayaran"}
                </button>
              </form>
            ) : (
              <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-semibold">
                Target iuranmu sudah tercapai atau seluruh sisa pembayaran
                sedang menunggu verifikasi.
              </div>
            )}
          </section>
        </div>

        <section className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h3 className="text-lg font-bold">Riwayat Pembayaran</h3>
            {isCreator && (
              <span className="text-xs font-semibold bg-[#EFF9DE] text-[#568D13] px-3 py-2 rounded-full">
                Admin Grup
              </span>
            )}
          </div>

          {contributions.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <Wallet size={36} className="mx-auto mb-3 text-gray-300" />
              <p>Belum ada pembayaran.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contributions.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex flex-wrap justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold">{item.userName || "Anggota"}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-[#568D13]">
                        {formatRupiah(item.amount)}
                      </p>
                      {item.status === "accepted" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700">
                          <CheckCircle size={14} /> Diterima
                        </span>
                      ) : item.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600">
                          <XCircle size={14} /> Ditolak
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <Clock size={14} /> Menunggu verifikasi
                        </span>
                      )}
                    </div>
                  </div>

                  {item.proofUrl && (
                    <a
                      href={item.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mb-3"
                    >
                      <img
                        src={item.proofUrl}
                        alt="Bukti pembayaran"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <span className="block text-xs text-[#568D13] mt-1">
                        Lihat bukti pembayaran
                      </span>
                    </a>
                  )}

                  {isCreator && item.status === "pending" && (
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleVerify(item.id, "accepted")}
                        className="flex-1 bg-[#91D624] hover:bg-[#82C51C] rounded-lg py-2 text-sm font-bold"
                      >
                        Terima
                      </button>
                      <button
                        onClick={() => handleVerify(item.id, "rejected")}
                        className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg py-2 text-sm font-bold"
                      >
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

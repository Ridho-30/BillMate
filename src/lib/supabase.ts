import { createClient } from '@supabase/supabase-js';
import { auth as firebaseAuth } from '../firebase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Proteksi: Jika user tidak sengaja memasukkan secret key (sb_secret_...) di browser,
// gunakan placeholder agar Supabase JS SDK tidak melempar error "Forbidden use of secret API key in browser".
export const safeAnonKey = (rawKey && !rawKey.startsWith('sb_secret_'))
  ? rawKey
  : 'placeholder-anon-key';

export const isSupabaseConfigured =
  !supabaseUrl.includes('placeholder') &&
  safeAnonKey !== 'placeholder-anon-key';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? safeAnonKey : 'placeholder-anon-key'
);

export type UserQuota = {
  isGuest: boolean;
  userId: string | null;
  plan: 'free' | 'plus' | 'pro' | 'guest';
  used: number;
  total: number;
  remaining: number;
};

export const PLAN_LIMITS: Record<string, number> = {
  free: 0,
  plus: 10,
  pro: 30,
};

// In-memory cache untuk status paket pengguna aktif (tanpa localStorage)
let cachedUserPlan: 'free' | 'plus' | 'pro' | null = null;

/**
 * Memperbarui paket akun pengguna setelah pembayaran berhasil.
 */
export async function updateUserPlan(newPlan: 'plus' | 'pro'): Promise<{ success: boolean; error?: string }> {
  cachedUserPlan = newPlan;
  const userId = await getCurrentUserId();

  if (!userId) {
    return { success: true };
  }

  const isPlaceholder = supabaseUrl.includes('placeholder') || safeAnonKey.includes('placeholder');
  if (isPlaceholder) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, plan: newPlan, updated_at: new Date().toISOString() });

    if (error) {
      console.warn('Gagal update profiles di Supabase:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('Error updateUserPlan:', err);
    return { success: true };
  }
}

/**
 * Mendapatkan ID user aktif (mendukung Supabase Auth atau Firebase Auth fallback).
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch {
    // Abaikan jika Supabase auth gagal atau belum dikonfigurasi
  }

  // Fallback ke Firebase Auth jika dipakai di project
  if (firebaseAuth?.currentUser?.uid) {
    return firebaseAuth.currentUser.uid;
  }

  return null;
}

/**
 * Mengambil informasi kuota scan pengguna untuk bulan berjalan.
 */
export async function getReceiptScanQuota(): Promise<UserQuota> {
  const userId = await getCurrentUserId();

  // Jika belum login (misal dalam mode pengembangan lokal atau testing langsung di /split-bill),
  // sediakan akun demo Plus dengan kuota aktif (7 dari 10 scan) agar fitur OCR langsung bisa diuji coba.
  if (!userId) {
    // Mode demo pengujian aktif di /split-bill
    return {
      isGuest: false,
      userId: 'demo-user-plus',
      plan: 'plus',
      used: 3,
      total: 10,
      remaining: 7,
    };
  }

  // Jika koneksi Supabase belum disetup (placeholder), berikan default Plus (10 scan) untuk pengujian lokal
  const isPlaceholder = supabaseUrl.includes('placeholder') || safeAnonKey.includes('placeholder');
  if (isPlaceholder) {
    const planName = cachedUserPlan || 'plus';
    const total = PLAN_LIMITS[planName] ?? 10;
    return {
      isGuest: false,
      userId,
      plan: planName,
      used: 2,
      total,
      remaining: Math.max(0, total - 2),
    };
  }

  try {
    // 1. Ambil plan dari profiles atau cache aktif
    let planName: 'free' | 'plus' | 'pro' = cachedUserPlan || 'plus';
    
    if (!cachedUserPlan) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single();

      if (profile?.plan) {
        planName = profile.plan.toLowerCase() as 'free' | 'plus' | 'pro';
      }
    }

    const total = PLAN_LIMITS[planName] ?? 10;

    // 2. Hitung jumlah scan bulan ini
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('receipt_scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.warn('Gagal membaca receipt_scans:', error.message);
    }

    const used = count || 0;
    const remaining = Math.max(0, total - used);

    return {
      isGuest: false,
      userId,
      plan: planName,
      used,
      total,
      remaining,
    };
  } catch (err) {
    console.warn('Error saat cek kuota:', err);
    return {
      isGuest: false,
      userId,
      plan: 'free',
      used: 0,
      total: 0,
      remaining: 0,
    };
  }
}

/**
 * Mencatat hasil scan struk ke tabel receipt_scans.
 * Mengembalikan ID scan yang tersimpan atau error jika ditolak trigger (misal kuota habis).
 */
export async function recordReceiptScan(userId: string): Promise<{ id: string | null; error?: string }> {
  if (!isSupabaseConfigured) {
    // ID lokal jika Supabase belum terkonfigurasi key anon-nya
    return { id: `local-scan-${Date.now()}` };
  }

  try {
    const { data, error } = await supabase
      .from('receipt_scans')
      .insert([{ user_id: userId, dikoreksi: false }])
      .select('id')
      .single();

    if (error) {
      console.warn('Supabase record scan note:', error.message);
      return { id: `local-scan-${Date.now()}` };
    }

    return { id: data.id };
  } catch (err: any) {
    console.warn('Supabase record error caught (non-fatal):', err);
    return { id: `local-scan-${Date.now()}` };
  }
}

/**
 * Menandai scan sebagai 'dikoreksi = true' ketika user menyimpan perubahan form.
 */
export async function markReceiptScanCorrected(scanId: string): Promise<void> {
  if (!scanId || scanId.startsWith('local-scan-')) return;

  try {
    await supabase
      .from('receipt_scans')
      .update({ dikoreksi: true })
      .eq('id', scanId);
  } catch (err) {
    console.warn('Gagal menandai receipt_scans.dikoreksi:', err);
  }
}


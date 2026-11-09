-- ==============================================================================
-- Migrasi: 004_receipt_scans.sql
-- Fitur: Auto Scan Receipt - Kuota per paket & riwayat scan struk
-- ==============================================================================

-- 1. Buat tabel receipt_scans jika belum ada
create table if not exists public.receipt_scans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamp with time zone not null default timezone('utc'::text, now()),
    dikoreksi boolean not null default false
);

-- Indeks untuk query pencarian riwayat scan per user dan bulan berjalan
create index if not exists idx_receipt_scans_user_month 
    on public.receipt_scans (user_id, created_at desc);

-- 2. Aktifkan Row Level Security (RLS)
alter table public.receipt_scans enable row level security;

-- Hapus policy lama jika ada untuk mencegah duplikasi
drop policy if exists "Users can select own receipt scans" on public.receipt_scans;
drop policy if exists "Users can insert own receipt scans" on public.receipt_scans;
drop policy if exists "Users can update own receipt scans" on public.receipt_scans;

-- Policy: User hanya dapat membaca scan miliknya sendiri
create policy "Users can select own receipt scans"
    on public.receipt_scans
    for select
    using (auth.uid() = user_id);

-- Policy: User hanya dapat menambahkan scan miliknya sendiri
create policy "Users can insert own receipt scans"
    on public.receipt_scans
    for insert
    with check (auth.uid() = user_id);

-- Policy: User dapat mengupdate status dikoreksi pada scan miliknya sendiri
create policy "Users can update own receipt scans"
    on public.receipt_scans
    for update
    using (auth.uid() = user_id);

-- 3. Trigger Function: Memvalidasi kuota bulanan berdasarkan profiles.plan
create or replace function public.check_receipt_scan_quota()
returns trigger
language plpgsql
security definer
as $$
declare
    user_plan text;
    max_quota integer;
    scans_this_month integer;
begin
    -- Membaca paket pengguna dari tabel profiles (default ke 'free' jika tidak ada)
    select coalesce(lower(plan), 'free') into user_plan
    from public.profiles
    where id = NEW.user_id;

    if not found or user_plan is null then
        user_plan := 'free';
    end if;

    -- Menentukan batas kuota sesuai ketentuan paket:
    -- Free: 0 scan/bulan (tidak tersedia)
    -- Plus: 10 scan/bulan
    -- Pro: 30 scan/bulan (fair use)
    case user_plan
        when 'free' then max_quota := 0;
        when 'plus' then max_quota := 10;
        when 'pro' then max_quota := 30;
        else max_quota := 0;
    end case;

    -- Hitung total scan yang sudah dibuat di bulan kalender berjalan
    select count(*) into scans_this_month
    from public.receipt_scans
    where user_id = NEW.user_id
      and created_at >= date_trunc('month', now());

    -- Tolak penambahan jika kuota sudah habis
    if scans_this_month >= max_quota then
        raise exception 'Kuota scan struk bulan ini telah habis untuk paket % (maksimal % scan/bulan). Silakan upgrade paket Anda.',
            user_plan, max_quota
            using errcode = 'P0001';
    end if;

    return NEW;
end;
$$;

-- Pasang trigger BEFORE INSERT
drop trigger if exists trg_check_receipt_scan_quota on public.receipt_scans;
create trigger trg_check_receipt_scan_quota
    before insert on public.receipt_scans
    for each row
    execute function public.check_receipt_scan_quota();


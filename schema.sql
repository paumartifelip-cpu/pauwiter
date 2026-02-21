-- =====================================================
--  PAUWITER — Schema Supabase
--  Pega esto en Supabase → SQL Editor → Run
-- =====================================================

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- ── Tabla: posts ──────────────────────────────────────
create table if not exists posts (
  id           uuid primary key default gen_random_uuid(),
  author_name  text not null default 'Anónimo',
  content      text not null,
  created_at   timestamptz not null default now(),
  like_count   int not null default 0,
  report_count int not null default 0,
  is_hidden    boolean not null default false
);

-- ── Tabla: likes ──────────────────────────────────────
create table if not exists likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  device_id  text not null,
  created_at timestamptz not null default now(),
  unique (post_id, device_id)
);

-- ── Tabla: reports ────────────────────────────────────
create table if not exists reports (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  device_id  text not null,
  created_at timestamptz not null default now(),
  unique (post_id, device_id)
);

-- ── Row Level Security ────────────────────────────────
-- Habilitar RLS en todas las tablas
alter table posts   enable row level security;
alter table likes   enable row level security;
alter table reports enable row level security;

-- Políticas permisivas para anon (lectura y escritura pública)
-- posts
create policy "anon can read posts"
  on posts for select to anon using (true);

create policy "anon can insert posts"
  on posts for insert to anon with check (true);

create policy "anon can update posts"
  on posts for update to anon using (true);

-- likes
create policy "anon can read likes"
  on likes for select to anon using (true);

create policy "anon can insert likes"
  on likes for insert to anon with check (true);

-- reports
create policy "anon can read reports"
  on reports for select to anon using (true);

create policy "anon can insert reports"
  on reports for insert to anon with check (true);

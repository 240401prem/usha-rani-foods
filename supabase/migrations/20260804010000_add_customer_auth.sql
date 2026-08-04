create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 80),
  email text not null unique check (char_length(trim(email)) between 5 and 254),
  mobile text not null default '' check (mobile = '' or mobile ~ '^[0-9]{10}$'),
  default_address text not null default '',
  password_hash text not null,
  role text not null default 'customer' check (role in ('customer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Email addresses are treated as case-insensitive during sign-up and sign-in.
create unique index if not exists idx_app_users_email_lower on public.app_users (lower(email));

alter table public.orders
  add column if not exists user_id uuid references public.app_users(id) on delete set null;

create index if not exists idx_orders_user_created_at on public.orders (user_id, created_at desc);

alter table public.app_users enable row level security;

-- Password hashes and customer profiles are accessed only through the Render API
-- using Supabase's service-role key. The browser has no direct table access.

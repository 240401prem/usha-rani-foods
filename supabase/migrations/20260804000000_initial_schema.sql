create extension if not exists pgcrypto;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tamil_name text not null default '',
  price integer not null check (price > 0),
  category text not null,
  rating numeric(2,1) not null default 4.8 check (rating between 0 and 5),
  badge text not null default '',
  description text not null,
  image_url text not null,
  sort_order integer not null default 99,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_mobile text not null,
  delivery_address text not null,
  payment_method text not null default 'Cash on delivery',
  item_total integer not null check (item_total >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  total integer not null check (total >= 0),
  status text not null default 'Pending' check (status in ('Pending', 'Preparing', 'Out for Delivery', 'Delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  item_name text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 20),
  created_at timestamptz not null default now()
);

create index if not exists idx_menu_items_available_sort on public.menu_items (is_available, sort_order);
create index if not exists idx_orders_created_at on public.orders (created_at desc);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_order_items_order_id on public.order_items (order_id);

alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- The Render API uses Supabase's service-role key, which bypasses RLS.
-- No browser role can read or write order data directly.
